
/**
 * Dialogue Insert Tool
 * Inserts and styles dialogue bubbles on panels
 */
class DialogueInsertTool {
  constructor() {
    this.name = 'dialogue-insert';
    this.description = 'Insert and style dialogue bubbles';
    this.requiredParams = ['panels', 'dialogues'];
    this.optionalParams = ['style', 'fontSize', 'color'];
  }

  /**
   * Execute dialogue insertion
   * @param {object} params - Parameters
   * @param {ContextMemory} context - Context memory
   * @returns {Promise<object>} Insertion result
   */
  async execute(params, context) {
    const { panels, dialogues, style = 'speech', fontSize = 24, color = '#000000' } = params;
    
    try {
      // Use existing text rendering system
      const { addTextToAllPanels } = await this.loadTextRenderer();
      
      const enhancedPanels = await addTextToAllPanels(panels, dialogues, {
        style,
        fontSize,
        color
      });
      
      // Store in context
      context.setContext('panelsWithDialogue', enhancedPanels, 'project');
      context.addAction('dialogue-insert', params, { enhancedPanels });
      
      return {
        success: true,
        enhancedPanels,
        message: `Added dialogue to ${enhancedPanels.length} panels`
      };
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        enhancedPanels: panels
      };
      
      context.addAction('dialogue-insert', params, errorResult);
      return errorResult;
    }
  }

  /**
   * Load text renderer (placeholder for integration)
   * @returns {Promise<object>} Text renderer
   */
  async loadTextRenderer() {
    // This would integrate with the existing text rendering system
    // For now, return a mock implementation
    return {
      addTextToAllPanels: async (panels, dialogues, options) => {
        // Mock implementation - replace with actual text rendering
        return panels.map(panel => {
          const panelDialogues = dialogues.find(d => d.panelId === panel.id);
          return {
            ...panel,
            dialogues: panelDialogues?.bubbles || [],
            enhanced: true,
            textOptions: options
          };
        });
      }
    };
  }

  /**
   * Validate dialogue structure
   * @param {Array} dialogues - Dialogues to validate
   * @returns {object} Validation result
   */
  validateDialogues(dialogues) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(dialogues)) {
      errors.push('Dialogues must be an array');
      return { valid: false, errors, warnings };
    }

    dialogues.forEach((dialogue, index) => {
      if (!dialogue.panelId) {
        errors.push(`Dialogue ${index + 1} missing panelId`);
      }
      
      if (!dialogue.bubbles || !Array.isArray(dialogue.bubbles)) {
        errors.push(`Dialogue ${index + 1} missing bubbles array`);
      } else {
        dialogue.bubbles.forEach((bubble, bubbleIndex) => {
          if (!bubble.text) {
            errors.push(`Dialogue ${index + 1}, bubble ${bubbleIndex + 1} missing text`);
          }
          if (!bubble.speaker) {
            warnings.push(`Dialogue ${index + 1}, bubble ${bubbleIndex + 1} missing speaker`);
          }
          if (bubble.x === undefined || bubble.y === undefined) {
            warnings.push(`Dialogue ${index + 1}, bubble ${bubbleIndex + 1} missing position`);
          }
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Optimize dialogue positioning
   * @param {Array} dialogues - Dialogues to optimize
   * @param {Array} panels - Panels for reference
   * @returns {Array} Optimized dialogues
   */
  optimizeDialoguePositioning(dialogues, panels) {
    return dialogues.map(dialogue => {
      const panel = panels.find(p => p.id === dialogue.panelId);
      if (!panel) return dialogue;

      const optimizedBubbles = dialogue.bubbles.map((bubble, index) => {
        // Ensure bubbles don't overlap
        const spacing = 100;
        const x = bubble.x || (panel.width * 0.1 + (index * spacing));
        const y = bubble.y || (panel.height * 0.1 + (index * spacing * 0.8));

        // Ensure bubbles stay within panel bounds
        const maxX = panel.width * 0.9;
        const maxY = panel.height * 0.9;

        return {
          ...bubble,
          x: Math.min(x, maxX),
          y: Math.min(y, maxY)
        };
      });

      return {
        ...dialogue,
        bubbles: optimizedBubbles
      };
    });
  }

  /**
   * Apply dialogue styling
   * @param {Array} dialogues - Dialogues to style
   * @param {object} styleOptions - Style options
   * @returns {Array} Styled dialogues
   */
  applyDialogueStyling(dialogues, styleOptions) {
    const {
      fontSize = 24,
      color = '#000000',
      fontFamily = 'Arial',
      bubbleStyle = 'speech',
      bubbleColor = '#FFFFFF',
      bubbleBorderColor = '#000000',
      bubbleBorderWidth = 2
    } = styleOptions;

    return dialogues.map(dialogue => ({
      ...dialogue,
      bubbles: dialogue.bubbles.map(bubble => ({
        ...bubble,
        fontSize: bubble.fontSize || fontSize,
        color: bubble.color || color,
        fontFamily: bubble.fontFamily || fontFamily,
        style: bubble.style || bubbleStyle,
        bubbleColor: bubble.bubbleColor || bubbleColor,
        bubbleBorderColor: bubble.bubbleBorderColor || bubbleBorderColor,
        bubbleBorderWidth: bubble.bubbleBorderWidth || bubbleBorderWidth
      }))
    }));
  }

  /**
   * Export dialogue data
   * @param {Array} dialogues - Dialogues to export
   * @param {string} format - Export format (json, csv, txt)
   * @returns {string} Exported data
   */
  exportDialogues(dialogues, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(dialogues, null, 2);
      
      case 'csv':
        const csvHeaders = 'Panel ID,Speaker,Text,X,Y,Style\n';
        const csvRows = dialogues.flatMap(dialogue => 
          dialogue.bubbles.map(bubble => 
            `${dialogue.panelId},"${bubble.speaker}","${bubble.text}",${bubble.x},${bubble.y},${bubble.style}`
          )
        );
        return csvHeaders + csvRows.join('\n');
      
      case 'txt':
        return dialogues.map(dialogue => 
          `Panel ${dialogue.panelId}:\n` +
          dialogue.bubbles.map(bubble => 
            `  ${bubble.speaker}: "${bubble.text}"`
          ).join('\n')
        ).join('\n\n');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Import dialogue data
   * @param {string} data - Data to import
   * @param {string} format - Import format (json, csv, txt)
   * @returns {Array} Imported dialogues
   */
  importDialogues(data, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.parse(data);
      
      case 'csv':
        const lines = data.split('\n');
        const headers = lines[0].split(',');
        const dialogues = {};
        
        lines.slice(1).forEach(line => {
          if (line.trim()) {
            const values = line.split(',');
            const panelId = values[0];
            const speaker = values[1].replace(/"/g, '');
            const text = values[2].replace(/"/g, '');
            const x = parseInt(values[3]);
            const y = parseInt(values[4]);
            const style = values[5];
            
            if (!dialogues[panelId]) {
              dialogues[panelId] = { panelId, bubbles: [] };
            }
            
            dialogues[panelId].bubbles.push({
              speaker,
              text,
              x,
              y,
              style
            });
          }
        });
        
        return Object.values(dialogues);
      
      case 'txt':
        // Simple text parsing - would need more sophisticated parsing for real use
        const sections = data.split('Panel ');
        return sections.slice(1).map(section => {
          const lines = section.split('\n');
          const panelId = lines[0].replace(':', '');
          const bubbles = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const match = line.match(/^\s*([^:]+):\s*"([^"]+)"/);
              if (match) {
                return {
                  speaker: match[1].trim(),
                  text: match[2],
                  x: 100,
                  y: 100,
                  style: 'speech'
                };
              }
              return null;
            })
            .filter(bubble => bubble !== null);
          
          return { panelId, bubbles };
        });
      
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }
  }

  /**
   * Get available text styles
   * @returns {Array} Available styles
   */
  getAvailableStyles() {
    return [
      'speech',
      'thought',
      'shout',
      'whisper',
      'narrator',
      'caption',
      'sound-effect'
    ];
  }

  /**
   * Get available font families
   * @returns {Array} Available fonts
   */
  getAvailableFonts() {
    return [
      'Arial',
      'Helvetica',
      'Times New Roman',
      'Comic Sans MS',
      'Impact',
      'Verdana',
      'Georgia',
      'Courier New'
    ];
  }

  /**
   * Calculate optimal font size based on panel size
   * @param {object} panel - Panel object
   * @param {string} text - Text content
   * @returns {number} Optimal font size
   */
  calculateOptimalFontSize(panel, text) {
    const panelArea = panel.width * panel.height;
    const textLength = text.length;
    
    // Base font size calculation
    let fontSize = Math.floor(Math.sqrt(panelArea) / 50);
    
    // Adjust for text length
    if (textLength > 50) {
      fontSize *= 0.8;
    } else if (textLength < 10) {
      fontSize *= 1.2;
    }
    
    // Ensure reasonable bounds
    return Math.max(12, Math.min(48, fontSize));
  }
}

export { DialogueInsertTool };
