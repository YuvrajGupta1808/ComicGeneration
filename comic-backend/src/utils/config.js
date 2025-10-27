/**
 * Configuration Management Utility
 * Handles loading and validation of configuration files
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ConfigManager {
  constructor() {
    this.configPath = path.join(__dirname, '../../config');
    this.agentConfig = null;
    this.layoutConfig = null;
    this.loadConfigs();
  }

  /**
   * Load all configuration files
   */
  loadConfigs() {
    this.loadAgentConfig();
    this.loadLayoutConfig();
  }

  /**
   * Load agent configuration
   */
  loadAgentConfig() {
    try {
      const agentPath = path.join(this.configPath, 'agent.yaml');
      if (fs.existsSync(agentPath)) {
        const configContent = fs.readFileSync(agentPath, 'utf8');
        this.agentConfig = yaml.parse(configContent);
      } else {
        this.agentConfig = this.getDefaultAgentConfig();
      }
    } catch (error) {
      console.warn('Failed to load agent config:', error.message);
      this.agentConfig = this.getDefaultAgentConfig();
    }
  }

  /**
   * Load layout configuration
   */
  loadLayoutConfig() {
    try {
      const layoutPath = path.join(this.configPath, 'layouts.yaml');
      if (fs.existsSync(layoutPath)) {
        const configContent = fs.readFileSync(layoutPath, 'utf8');
        this.layoutConfig = yaml.parse(configContent);
      } else {
        this.layoutConfig = this.getDefaultLayoutConfig();
      }
    } catch (error) {
      console.warn('Failed to load layout config:', error.message);
      this.layoutConfig = this.getDefaultLayoutConfig();
    }
  }

  /**
   * Get agent configuration
   * @returns {object} Agent configuration
   */
  getAgentConfig() {
    return this.agentConfig;
  }

  /**
   * Get layout configuration
   * @returns {object} Layout configuration
   */
  getLayoutConfig() {
    return this.layoutConfig;
  }

  /**
   * Get tool configuration
   * @param {string} toolName - Tool name
   * @returns {object} Tool configuration
   */
  getToolConfig(toolName) {
    return this.agentConfig?.tools?.[toolName] || {};
  }

  /**
   * Update agent configuration
   * @param {object} config - New configuration
   */
  updateAgentConfig(config) {
    this.agentConfig = { ...this.agentConfig, ...config };
    this.saveAgentConfig();
  }

  /**
   * Update layout configuration
   * @param {object} config - New configuration
   */
  updateLayoutConfig(config) {
    this.layoutConfig = { ...this.layoutConfig, ...config };
    this.saveLayoutConfig();
  }

  /**
   * Save agent configuration to file
   */
  saveAgentConfig() {
    try {
      const agentPath = path.join(this.configPath, 'agent.yaml');
      fs.ensureDirSync(this.configPath);
      fs.writeFileSync(agentPath, yaml.stringify(this.agentConfig));
    } catch (error) {
      console.error('Failed to save agent config:', error.message);
    }
  }

  /**
   * Save layout configuration to file
   */
  saveLayoutConfig() {
    try {
      const layoutPath = path.join(this.configPath, 'layouts.yaml');
      fs.ensureDirSync(this.configPath);
      fs.writeFileSync(layoutPath, yaml.stringify(this.layoutConfig));
    } catch (error) {
      console.error('Failed to save layout config:', error.message);
    }
  }

  /**
   * Get default agent configuration
   * @returns {object} Default agent configuration
   */
  getDefaultAgentConfig() {
    return {
      agent: {
        name: "Comic Generation Agent",
        version: "1.0.0",
        description: "Professional CLI agent for comic generation workflows"
      },
      memory: {
        persistence: true,
        maxHistory: 1000,
        autoSave: true,
        contextFile: ".comic-agent-context.json"
      },
      tools: {
        'comic-generation': { 
          enabled: true, 
          timeout: 300000, 
          retries: 3, 
          defaultStyle: "cinematic" 
        },
        'layout-selection': { 
          enabled: true, 
          templatesFile: "./config/layouts.yaml" 
        },
        'dialogue-generation': { 
          enabled: true, 
          defaultMode: "context-aware" 
        },
        'dialogue-insert': { 
          enabled: true, 
          defaultStyle: "speech" 
        },
        'show-pages': { 
          enabled: true, 
          defaultFormat: "preview" 
        }
      },
      logging: {
        level: "info",
        format: "colored",
        file: "comic-agent.log"
      }
    };
  }

  /**
   * Get default layout configuration
   * @returns {object} Default layout configuration
   */
  getDefaultLayoutConfig() {
    return {
      layouts: {
        'single-panel': {
          name: "Single Panel Cover",
          pages: 1,
          panels_per_page: 1,
          template: "cover",
          dimensions: "832x1248"
        }
      }
    };
  }

  /**
   * Validate configuration
   * @param {object} config - Configuration to validate
   * @returns {object} Validation result
   */
  validateConfig(config) {
    const errors = [];
    const warnings = [];

    // Validate agent section
    if (!config.agent) {
      errors.push('Missing agent section');
    } else {
      if (!config.agent.name) errors.push('Missing agent name');
      if (!config.agent.version) errors.push('Missing agent version');
    }

    // Validate memory section
    if (!config.memory) {
      warnings.push('Missing memory section, using defaults');
    }

    // Validate tools section
    if (!config.tools) {
      warnings.push('Missing tools section, using defaults');
    }

    // Validate logging section
    if (!config.logging) {
      warnings.push('Missing logging section, using defaults');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults() {
    this.agentConfig = this.getDefaultAgentConfig();
    this.layoutConfig = this.getDefaultLayoutConfig();
    this.saveAgentConfig();
    this.saveLayoutConfig();
  }

  /**
   * Export configuration
   * @param {string} format - Export format (yaml, json)
   * @returns {string} Exported configuration
   */
  exportConfig(format = 'yaml') {
    const config = {
      agent: this.agentConfig,
      layouts: this.layoutConfig
    };

    switch (format.toLowerCase()) {
      case 'yaml':
        return yaml.stringify(config);
      case 'json':
        return JSON.stringify(config, null, 2);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Import configuration
   * @param {string} configData - Configuration data
   * @param {string} format - Import format (yaml, json)
   */
  importConfig(configData, format = 'yaml') {
    let config;
    
    switch (format.toLowerCase()) {
      case 'yaml':
        config = yaml.parse(configData);
        break;
      case 'json':
        config = JSON.parse(configData);
        break;
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }

    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    if (config.agent) {
      this.agentConfig = config.agent;
      this.saveAgentConfig();
    }

    if (config.layouts) {
      this.layoutConfig = config.layouts;
      this.saveLayoutConfig();
    }
  }
}
