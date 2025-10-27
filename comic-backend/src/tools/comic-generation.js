import fs from 'fs-extra';
import { AnthropicService } from '../services/anthropic.js';

/**
 * Comic Generation Tool
 * Generates comic panels using Anthropic Claude AI
 */
class ComicGenerationTool {
  constructor() {
    this.name = 'comic-generation';
    this.description = 'Generate comic panels using Anthropic Claude AI';
    this.requiredParams = ['story'];
    this.optionalParams = ['characters', 'style', 'referenceImages'];
    this.anthropic = new AnthropicService();
  }

  /**
   * Execute comic generation
   * @param {object} params - Parameters
   * @param {ContextMemory} context - Context memory
   * @returns {Promise<object>} Generation result
   */
  async execute(params, context) {
    const { story, characters = [], style = 'cinematic', referenceImages = [] } = params;
    
    try {
      // Check if Anthropic service is available
      if (!this.anthropic.isAvailable()) {
        throw new Error('Anthropic API not available. Please set ANTHROPIC_API_KEY environment variable.');
      }

      // Generate enhanced panel descriptions using Anthropic
      const enhancedPanels = await this.anthropic.generatePanelDescriptions(story, characters, style);
      
      // Create panel objects with enhanced descriptions
      const panels = enhancedPanels.map((enhancedPanel, index) => {
        const originalScene = story.scenes[index];
        return {
          id: enhancedPanel.panelId || `panel${index + 1}`,
          prompt: enhancedPanel.description,
          description: enhancedPanel.description,
          mood: enhancedPanel.mood || 'neutral',
          lighting: enhancedPanel.lighting || 'natural',
          cameraAngle: enhancedPanel.cameraAngle || 'medium-shot',
          width: this.getPanelWidth(originalScene),
          height: this.getPanelHeight(originalScene),
          contextImages: originalScene?.references || referenceImages,
          generated: true,
          generatedAt: new Date().toISOString()
        };
      });

      // Store in context
      context.setContext('generatedPanels', panels, 'project');
      context.addAction('comic-generation', params, { panels });
      
      return {
        success: true,
        panels: panels,
        message: `Generated ${panels.length} enhanced panel descriptions successfully`
      };
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        panels: []
      };
      
      context.addAction('comic-generation', params, errorResult);
      return errorResult;
    }
  }

  /**
   * Create panel prompts from story structure
   * @param {object} story - Story object
   * @param {Array} characters - Character array
   * @param {string} style - Art style
   * @returns {Array} Panel prompts
   */
  createPanelPrompts(story, characters, style) {
    if (!story.scenes || !Array.isArray(story.scenes)) {
      throw new Error('Story must have scenes array');
    }

    return story.scenes.map((scene, index) => ({
      id: `panel${index + 1}`,
      prompt: this.buildPrompt(scene, characters, style),
      width: this.getPanelWidth(scene),
      height: this.getPanelHeight(scene),
      contextImages: scene.references || []
    }));
  }

  /**
   * Build prompt for a scene
   * @param {object} scene - Scene object
   * @param {Array} characters - Character array
   * @param {string} style - Art style
   * @returns {string} Generated prompt
   */
  buildPrompt(scene, characters, style) {
    let prompt = `${style} style comic panel, `;
    
    // Add scene description
    if (scene.description) {
      prompt += scene.description + ', ';
    }
    
    // Add character descriptions
    if (characters && characters.length > 0) {
      const characterDescriptions = characters.map(char => {
        let desc = char.name;
        if (char.description) {
          desc += ` (${char.description})`;
        }
        return desc;
      }).join(', ');
      prompt += `featuring ${characterDescriptions}, `;
    }
    
    // Add style modifiers
    prompt += 'high quality, detailed, professional comic art';
    
    return prompt.trim();
  }

  /**
   * Get panel width from scene or default
   * @param {object} scene - Scene object
   * @returns {number} Panel width
   */
  getPanelWidth(scene) {
    if (scene.width) return scene.width;
    if (scene.size) {
      const [width] = scene.size.split('x').map(Number);
      return width;
    }
    return 832; // Default width
  }

  /**
   * Get panel height from scene or default
   * @param {object} scene - Scene object
   * @returns {number} Panel height
   */
  getPanelHeight(scene) {
    if (scene.height) return scene.height;
    if (scene.size) {
      const [, height] = scene.size.split('x').map(Number);
      return height;
    }
    return 1248; // Default height
  }

  /**
   * Generate image generation prompts for external AI image services
   * @param {Array} panels - Panel array with descriptions
   * @returns {Array} Image generation prompts
   */
  generateImagePrompts(panels) {
    return panels.map(panel => ({
      id: panel.id,
      prompt: this.buildImagePrompt(panel),
      width: panel.width,
      height: panel.height,
      style: panel.style || 'cinematic',
      mood: panel.mood,
      lighting: panel.lighting,
      cameraAngle: panel.cameraAngle,
      negativePrompt: this.getNegativePrompt(panel),
      settings: {
        steps: 30,
        cfgScale: 7.5,
        sampler: 'DPM++ 2M Karras',
        seed: Math.floor(Math.random() * 1000000)
      }
    }));
  }

  /**
   * Build image generation prompt from panel description
   * @param {object} panel - Panel object
   * @returns {string} Image generation prompt
   */
  buildImagePrompt(panel) {
    let prompt = `${panel.style || 'cinematic'} style comic panel, `;
    
    // Add main description
    prompt += panel.description + ', ';
    
    // Add mood and lighting
    if (panel.mood) {
      prompt += `${panel.mood} mood, `;
    }
    
    if (panel.lighting) {
      prompt += `${panel.lighting} lighting, `;
    }
    
    if (panel.cameraAngle) {
      prompt += `${panel.cameraAngle}, `;
    }
    
    // Add quality modifiers
    prompt += 'high quality, detailed, professional comic art, clean lines, vibrant colors';
    
    return prompt.trim();
  }

  /**
   * Get negative prompt for image generation
   * @param {object} panel - Panel object
   * @returns {string} Negative prompt
   */
  getNegativePrompt(panel) {
    const negativePrompts = [
      'blurry',
      'low quality',
      'distorted',
      'watermark',
      'text',
      'signature',
      'bad anatomy',
      'bad proportions',
      'extra limbs',
      'mutated hands',
      'poorly drawn face',
      'mutation',
      'deformed',
      'ugly',
      'blurry',
      'bad anatomy',
      'bad proportions',
      'extra limbs',
      'cloned face',
      'disfigured',
      'out of frame',
      'ugly',
      'extra limbs',
      'bad anatomy',
      'gross proportions',
      'malformed limbs',
      'missing arms',
      'missing legs',
      'extra arms',
      'extra legs',
      'mutated hands',
      'fused fingers',
      'too many fingers',
      'long neck'
    ];

    return negativePrompts.join(', ');
  }

  /**
   * Validate story structure
   * @param {object} story - Story to validate
   * @returns {object} Validation result
   */
  validateStory(story) {
    const errors = [];
    const warnings = [];

    if (!story) {
      errors.push('Story object is required');
      return { valid: false, errors, warnings };
    }

    if (!story.title) warnings.push('Story missing title');
    if (!story.scenes || !Array.isArray(story.scenes)) {
      errors.push('Story must have scenes array');
    } else {
      story.scenes.forEach((scene, index) => {
        if (!scene.description) {
          warnings.push(`Scene ${index + 1} missing description`);
        }
        if (!scene.panel) {
          warnings.push(`Scene ${index + 1} missing panel number`);
        }
      });
    }

    if (!story.pages) warnings.push('Story missing pages count');

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Load story from file
   * @param {string} filePath - Path to story file
   * @returns {Promise<object>} Story object
   */
  async loadStory(filePath) {
    try {
      const storyData = await fs.readFile(filePath, 'utf8');
      const story = JSON.parse(storyData);
      
      const validation = this.validateStory(story);
      if (!validation.valid) {
        throw new Error(`Invalid story file: ${validation.errors.join(', ')}`);
      }
      
      return story;
    } catch (error) {
      throw new Error(`Failed to load story file: ${error.message}`);
    }
  }

  /**
   * Save story to file
   * @param {object} story - Story object
   * @param {string} filePath - Path to save file
   * @returns {Promise<void>}
   */
  async saveStory(story, filePath) {
    try {
      const validation = this.validateStory(story);
      if (!validation.valid) {
        throw new Error(`Invalid story: ${validation.errors.join(', ')}`);
      }
      
      await fs.writeFile(filePath, JSON.stringify(story, null, 2));
    } catch (error) {
      throw new Error(`Failed to save story file: ${error.message}`);
    }
  }

  /**
   * Get available art styles
   * @returns {Array} Available styles
   */
  getAvailableStyles() {
    return [
      'cinematic',
      'anime',
      'manga',
      'western',
      'realistic',
      'cartoon',
      'noir',
      'fantasy',
      'sci-fi',
      'horror'
    ];
  }

  /**
   * Estimate generation time
   * @param {number} panelCount - Number of panels
   * @returns {number} Estimated time in seconds
   */
  estimateGenerationTime(panelCount) {
    // Rough estimate: 30 seconds per panel
    return panelCount * 30;
  }
}

export { ComicGenerationTool };
