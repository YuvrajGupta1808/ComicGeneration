import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Tool Registry
 * Manages registration, execution, and lifecycle of tools
 */
class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.toolConfigs = new Map();
    this.loadToolConfigs();
  }

  /**
   * Register a tool
   * @param {string} name - Tool name
   * @param {object} tool - Tool instance
   * @param {object} config - Tool configuration
   */
  register(name, tool, config = {}) {
    this.tools.set(name, tool);
    this.toolConfigs.set(name, {
      enabled: true,
      timeout: 300000, // 5 minutes default
      retries: 3,
      ...config
    });
  }

  /**
   * Execute a tool
   * @param {string} name - Tool name
   * @param {object} params - Tool parameters
   * @param {ContextMemory} context - Context memory instance
   * @returns {Promise<object>} Tool execution result
   */
  async execute(name, params, context) {
    const tool = this.tools.get(name);
    const config = this.toolConfigs.get(name);

    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }

    if (!config.enabled) {
      throw new Error(`Tool '${name}' is disabled`);
    }

    // Validate required parameters
    if (tool.requiredParams) {
      const missingParams = tool.requiredParams.filter(param => !(param in params));
      if (missingParams.length > 0) {
        throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
      }
    }

    // Execute with timeout and retries
    return this.executeWithRetry(tool, params, context, config);
  }

  /**
   * Execute tool with retry logic
   * @param {object} tool - Tool instance
   * @param {object} params - Tool parameters
   * @param {ContextMemory} context - Context memory instance
   * @param {object} config - Tool configuration
   * @returns {Promise<object>} Tool execution result
   */
  async executeWithRetry(tool, params, context, config) {
    let lastError;
    
    for (let attempt = 1; attempt <= config.retries; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Tool execution timeout')), config.timeout);
        });

        const executionPromise = tool.execute(params, context);
        
        const result = await Promise.race([executionPromise, timeoutPromise]);
        
        // Log successful execution
        context.addAction(tool.name, params, result);
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt < config.retries) {
          console.warn(`Tool execution failed (attempt ${attempt}/${config.retries}): ${error.message}`);
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // All retries failed
    const errorResult = {
      success: false,
      error: lastError.message,
      attempts: config.retries
    };
    
    context.addAction(tool.name, params, errorResult);
    throw lastError;
  }

  /**
   * List all registered tools
   * @returns {Array} List of tool information
   */
  listTools() {
    return Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description || 'No description',
      requiredParams: tool.requiredParams || [],
      optionalParams: tool.optionalParams || [],
      enabled: this.toolConfigs.get(name).enabled
    }));
  }

  /**
   * Get tool information
   * @param {string} name - Tool name
   * @returns {object} Tool information
   */
  getToolInfo(name) {
    const tool = this.tools.get(name);
    const config = this.toolConfigs.get(name);
    
    if (!tool) {
      return null;
    }

    return {
      name,
      description: tool.description || 'No description',
      requiredParams: tool.requiredParams || [],
      optionalParams: tool.optionalParams || [],
      config
    };
  }

  /**
   * Enable/disable a tool
   * @param {string} name - Tool name
   * @param {boolean} enabled - Enable status
   */
  setToolEnabled(name, enabled) {
    const config = this.toolConfigs.get(name);
    if (config) {
      config.enabled = enabled;
    }
  }

  /**
   * Update tool configuration
   * @param {string} name - Tool name
   * @param {object} config - New configuration
   */
  updateToolConfig(name, config) {
    const existingConfig = this.toolConfigs.get(name);
    if (existingConfig) {
      this.toolConfigs.set(name, { ...existingConfig, ...config });
    }
  }

  /**
   * Load tool configurations from file
   */
  loadToolConfigs() {
    try {
      const configPath = path.join(__dirname, '../../config/agent.yaml');
      if (fs.existsSync(configPath)) {
        const configData = yaml.parse(fs.readFileSync(configPath, 'utf8'));
        
        if (configData.tools) {
          Object.entries(configData.tools).forEach(([name, config]) => {
            this.toolConfigs.set(name, config);
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load tool configurations:', error.message);
    }
  }

  /**
   * Save tool configurations to file
   */
  saveToolConfigs() {
    try {
      const configPath = path.join(__dirname, '../../config/agent.yaml');
      const yaml = require('yaml');
      
      const configData = {
        tools: Object.fromEntries(this.toolConfigs)
      };
      
      fs.writeFileSync(configPath, yaml.stringify(configData));
    } catch (error) {
      console.warn('Failed to save tool configurations:', error.message);
    }
  }

  /**
   * Validate tool parameters
   * @param {string} name - Tool name
   * @param {object} params - Parameters to validate
   * @returns {object} Validation result
   */
  validateParams(name, params) {
    const tool = this.tools.get(name);
    if (!tool) {
      return { valid: false, error: `Tool '${name}' not found` };
    }

    const errors = [];
    const warnings = [];

    // Check required parameters
    if (tool.requiredParams) {
      tool.requiredParams.forEach(param => {
        if (!(param in params)) {
          errors.push(`Missing required parameter: ${param}`);
        }
      });
    }

    // Check for unknown parameters
    const knownParams = [
      ...(tool.requiredParams || []),
      ...(tool.optionalParams || [])
    ];
    
    Object.keys(params).forEach(param => {
      if (!knownParams.includes(param)) {
        warnings.push(`Unknown parameter: ${param}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Register all available tools
   */
  async registerAll() {
    try {
      // Import and register all tools
      const { StoryStructureGenerationTool } = await import('../tools/story-structure-generation.js');
      const { ComicGenerationTool } = await import('../tools/comic-generation.js');
      const { CharacterGenerationTool } = await import('../tools/character-generation.js');
      const { LayoutSelectionTool } = await import('../tools/layout-selection.js');
      const { DialogueGenerationTool } = await import('../tools/dialogue-generation.js');
      const { DialogueInsertTool } = await import('../tools/dialogue-insert.js');
      const { ShowPagesTool } = await import('../tools/show-pages.js');

      // Register each tool
      this.register('story-structure-generation', new StoryStructureGenerationTool());
      this.register('comic-generation', new ComicGenerationTool());
      this.register('character-generation', new CharacterGenerationTool());
      this.register('layout-selection', new LayoutSelectionTool());
      this.register('dialogue-generation', new DialogueGenerationTool());
      this.register('dialogue-insert', new DialogueInsertTool());
      this.register('show-pages', new ShowPagesTool());

      console.log(`Registered ${this.tools.size} tools`);
    } catch (error) {
      console.error('Failed to register tools:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    // Cleanup any tool-specific resources
    for (const [name, tool] of this.tools) {
      if (tool.cleanup && typeof tool.cleanup === 'function') {
        try {
          await tool.cleanup();
        } catch (error) {
          console.warn(`Failed to cleanup tool ${name}:`, error.message);
        }
      }
    }
  }
}

export { ToolRegistry };
