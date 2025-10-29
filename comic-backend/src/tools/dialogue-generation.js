import { OllamaService } from '../services/ollama.js';

/**
 * Dialogue Generation Tool
 * Generates contextual dialogue for panels using Ollama AI
 */
class DialogueGenerationTool {
  constructor() {
    this.name = 'dialogue-generation';
    this.description = 'Generate contextual dialogue for panels using Ollama AI';
    this.requiredParams = ['panels'];
    this.optionalParams = ['storyContext', 'characters', 'mode'];
    this.ollama = new OllamaService();
  }

  /**
   * Execute dialogue generation
   * @param {object} params - Parameters
   * @param {ContextMemory} context - Context memory
   * @returns {Promise<object>} Generation result
   */
  async execute(params, context) {
    const { panels, storyContext = {}, characters = [], mode = 'context-aware' } = params;
    
    try {
      // Check if Ollama service is available
      if (!this.ollama.isAvailable()) {
        throw new Error('Ollama not available. Please ensure Ollama is running locally.');
      }

      // Generate dialogue using Ollama
      const dialogues = await this.ollama.generateDialogue(panels, storyContext, characters, mode);
      
      // Enhance dialogues with positioning and styling
      const enhancedDialogues = dialogues.map(dialogue => {
        const panel = panels.find(p => p.id === dialogue.panelId);
        return {
          ...dialogue,
          bubbles: dialogue.bubbles.map((bubble, index) => ({
            ...bubble,
            x: this.calculateDefaultX(panel, index),
            y: this.calculateDefaultY(panel, index),
            fontSize: this.getFontSize(bubble.style),
            color: this.getColor(bubble.mood),
            style: bubble.style || 'speech'
          }))
        };
      });
      
      // Store in context
      context.setContext('generatedDialogues', enhancedDialogues, 'project');
      context.addAction('dialogue-generation', params, { dialogues: enhancedDialogues });
      
      return {
        success: true,
        dialogues: enhancedDialogues,
        message: `Generated dialogue for ${enhancedDialogues.length} panels`
      };
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        dialogues: []
      };
      
      context.addAction('dialogue-generation', params, errorResult);
      return errorResult;
    }
  }

  /**
   * Generate dialogue for a specific panel
   * @param {object} panel - Panel object
   * @param {object} storyContext - Story context
   * @param {Array} characters - Character array
   * @param {number} index - Panel index
   * @param {string} mode - Generation mode
   * @returns {object} Dialogue for panel
   */
  generateDialogueForPanel(panel, storyContext, characters, index, mode) {
    const sceneDialogue = storyContext.scenes?.[index]?.dialogue || [];
    
    // If scene already has dialogue, use it
    if (sceneDialogue.length > 0) {
      return {
        panelId: panel.id,
        bubbles: sceneDialogue.map(bubble => ({
          text: bubble.text,
          speaker: bubble.speaker,
          x: bubble.x || this.calculateDefaultX(panel),
          y: bubble.y || this.calculateDefaultY(panel),
          style: bubble.style || 'speech',
          fontSize: bubble.fontSize || 24,
          color: bubble.color || '#000000'
        }))
      };
    }
    
    // Generate dialogue based on mode
    switch (mode) {
      case 'context-aware':
        return this.generateContextAwareDialogue(panel, storyContext, characters, index);
      case 'minimal':
        return this.generateMinimalDialogue(panel, storyContext, characters, index);
      case 'detailed':
        return this.generateDetailedDialogue(panel, storyContext, characters, index);
      default:
        return this.generateContextAwareDialogue(panel, storyContext, characters, index);
    }
  }

  /**
   * Generate context-aware dialogue
   * @param {object} panel - Panel object
   * @param {object} storyContext - Story context
   * @param {Array} characters - Character array
   * @param {number} index - Panel index
   * @returns {object} Dialogue
   */
  generateContextAwareDialogue(panel, storyContext, characters, index) {
    const scene = storyContext.scenes?.[index];
    const bubbles = [];
    
    if (scene && scene.description) {
      // Extract potential dialogue from scene description
      const dialogueHints = this.extractDialogueHints(scene.description);
      
      dialogueHints.forEach((hint, hintIndex) => {
        bubbles.push({
          text: hint.text,
          speaker: hint.speaker || this.getRandomCharacter(characters),
          x: this.calculateDefaultX(panel, hintIndex),
          y: this.calculateDefaultY(panel, hintIndex),
          style: hint.style || 'speech',
          fontSize: 24,
          color: '#000000'
        });
      });
    }
    
    // If no dialogue found, add a generic one
    if (bubbles.length === 0 && characters.length > 0) {
      bubbles.push({
        text: this.generateGenericDialogue(scene, characters),
        speaker: characters[0].name,
        x: this.calculateDefaultX(panel),
        y: this.calculateDefaultY(panel),
        style: 'speech',
        fontSize: 24,
        color: '#000000'
      });
    }
    
    return {
      panelId: panel.id,
      bubbles
    };
  }

  /**
   * Generate minimal dialogue
   * @param {object} panel - Panel object
   * @param {object} storyContext - Story context
   * @param {Array} characters - Character array
   * @param {number} index - Panel index
   * @returns {object} Dialogue
   */
  generateMinimalDialogue(panel, storyContext, characters, index) {
    const bubbles = [];
    
    // Only add dialogue if there's a clear speaking opportunity
    const scene = storyContext.scenes?.[index];
    if (scene && this.hasSpeakingOpportunity(scene.description)) {
      bubbles.push({
        text: this.generateShortDialogue(scene, characters),
        speaker: this.getRandomCharacter(characters),
        x: this.calculateDefaultX(panel),
        y: this.calculateDefaultY(panel),
        style: 'speech',
        fontSize: 20,
        color: '#000000'
      });
    }
    
    return {
      panelId: panel.id,
      bubbles
    };
  }

  /**
   * Generate detailed dialogue
   * @param {object} panel - Panel object
   * @param {object} storyContext - Story context
   * @param {Array} characters - Character array
   * @param {number} index - Panel index
   * @returns {object} Dialogue
   */
  generateDetailedDialogue(panel, storyContext, characters, index) {
    const scene = storyContext.scenes?.[index];
    const bubbles = [];
    
    if (scene && characters.length > 0) {
      // Generate multiple dialogue bubbles
      const dialogueCount = Math.min(3, characters.length);
      
      for (let i = 0; i < dialogueCount; i++) {
        bubbles.push({
          text: this.generateDetailedText(scene, characters[i]),
          speaker: characters[i].name,
          x: this.calculateDefaultX(panel, i),
          y: this.calculateDefaultY(panel, i),
          style: i === 0 ? 'speech' : 'thought',
          fontSize: 22,
          color: '#000000'
        });
      }
    }
    
    return {
      panelId: panel.id,
      bubbles
    };
  }

  /**
   * Extract dialogue hints from scene description
   * @param {string} description - Scene description
   * @returns {Array} Dialogue hints
   */
  extractDialogueHints(description) {
    const hints = [];
    
    // Look for quoted text
    const quotedMatches = description.match(/"([^"]+)"/g);
    if (quotedMatches) {
      quotedMatches.forEach(quote => {
        hints.push({
          text: quote.replace(/"/g, ''),
          style: 'speech'
        });
      });
    }
    
    // Look for dialogue indicators
    const dialogueIndicators = ['says', 'shouts', 'whispers', 'exclaims', 'asks'];
    dialogueIndicators.forEach(indicator => {
      const regex = new RegExp(`\\b${indicator}\\s+["']([^"']+)["']`, 'gi');
      const matches = description.match(regex);
      if (matches) {
        matches.forEach(match => {
          const text = match.replace(new RegExp(`\\b${indicator}\\s+["']`, 'gi'), '').replace(/["']$/, '');
          hints.push({
            text,
            style: indicator === 'whispers' ? 'thought' : 'speech'
          });
        });
      }
    });
    
    return hints;
  }

  /**
   * Check if scene has speaking opportunity
   * @param {string} description - Scene description
   * @returns {boolean} Has speaking opportunity
   */
  hasSpeakingOpportunity(description) {
    const speakingWords = ['says', 'speaks', 'talks', 'shouts', 'whispers', 'exclaims', 'asks', 'replies'];
    return speakingWords.some(word => description.toLowerCase().includes(word));
  }

  /**
   * Generate generic dialogue
   * @param {object} scene - Scene object
   * @param {Array} characters - Character array
   * @returns {string} Generic dialogue
   */
  generateGenericDialogue(scene, characters) {
    const genericPhrases = [
      "What's happening?",
      "I need to figure this out.",
      "This is interesting...",
      "Let me think about this.",
      "I see what's going on.",
      "This changes everything.",
      "I understand now.",
      "That makes sense."
    ];
    
    return genericPhrases[Math.floor(Math.random() * genericPhrases.length)];
  }

  /**
   * Generate short dialogue
   * @param {object} scene - Scene object
   * @param {Array} characters - Character array
   * @returns {string} Short dialogue
   */
  generateShortDialogue(scene, characters) {
    const shortPhrases = [
      "Yes!",
      "No!",
      "What?",
      "Really?",
      "I see.",
      "Got it.",
      "Okay.",
      "Right."
    ];
    
    return shortPhrases[Math.floor(Math.random() * shortPhrases.length)];
  }

  /**
   * Generate detailed text
   * @param {object} scene - Scene object
   * @param {object} character - Character object
   * @returns {string} Detailed dialogue
   */
  generateDetailedText(scene, character) {
    const detailedPhrases = [
      `I can't believe this is happening to me.`,
      `This situation is more complex than I thought.`,
      `I need to be careful about what I say next.`,
      `The implications of this are significant.`,
      `I should consider all the possibilities here.`,
      `This requires immediate attention.`,
      `I'm not sure how to respond to this.`,
      `There's more to this than meets the eye.`
    ];
    
    return detailedPhrases[Math.floor(Math.random() * detailedPhrases.length)];
  }

  /**
   * Get random character
   * @param {Array} characters - Character array
   * @returns {string} Character name
   */
  getRandomCharacter(characters) {
    if (characters.length === 0) return 'Character';
    return characters[Math.floor(Math.random() * characters.length)].name;
  }

  /**
   * Calculate default X position for dialogue bubble
   * @param {object} panel - Panel object
   * @param {number} index - Bubble index
   * @returns {number} X position
   */
  calculateDefaultX(panel, index = 0) {
    const width = panel.width || 832;
    return Math.floor(width * 0.1 + (index * width * 0.2));
  }

  /**
   * Calculate default Y position for dialogue bubble
   * @param {object} panel - Panel object
   * @param {number} index - Bubble index
   * @returns {number} Y position
   */
  calculateDefaultY(panel, index = 0) {
    const height = panel.height || 1248;
    return Math.floor(height * 0.1 + (index * height * 0.15));
  }

  /**
   * Get font size based on dialogue style
   * @param {string} style - Dialogue style
   * @returns {number} Font size
   */
  getFontSize(style) {
    const fontSizes = {
      'speech': 24,
      'thought': 20,
      'shout': 28,
      'whisper': 18,
      'narrator': 16
    };
    return fontSizes[style] || 24;
  }

  /**
   * Get color based on mood
   * @param {string} mood - Dialogue mood
   * @returns {string} Color hex code
   */
  getColor(mood) {
    const colors = {
      'tense': '#8B0000',
      'happy': '#006400',
      'sad': '#4169E1',
      'angry': '#DC143C',
      'excited': '#FF8C00',
      'neutral': '#000000',
      'mysterious': '#4B0082',
      'romantic': '#FF69B4'
    };
    return colors[mood] || '#000000';
  }

  /**
   * Get available dialogue modes
   * @returns {Array} Available modes
   */
  getAvailableModes() {
    return ['context-aware', 'minimal', 'detailed'];
  }

  /**
   * Get available bubble styles
   * @returns {Array} Available styles
   */
  getAvailableStyles() {
    return ['speech', 'thought', 'shout', 'whisper', 'narrator'];
  }
}

export { DialogueGenerationTool };
