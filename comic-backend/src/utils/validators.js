/**
 * Input Validation Utility
 * Provides validation functions for various input types
 */

export class Validators {
  /**
   * Validate story file structure
   * @param {object} story - Story object to validate
   * @returns {object} Validation result
   */
  static validateStory(story) {
    const errors = [];
    const warnings = [];

    if (!story) {
      errors.push('Story object is required');
      return { valid: false, errors, warnings };
    }

    // Required fields
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

    // Validate characters
    if (story.characters && Array.isArray(story.characters)) {
      story.characters.forEach((character, index) => {
        if (!character.name) {
          errors.push(`Character ${index + 1} missing name`);
        }
        if (!character.description) {
          warnings.push(`Character ${index + 1} missing description`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate panel structure
   * @param {object} panel - Panel object to validate
   * @returns {object} Validation result
   */
  static validatePanel(panel) {
    const errors = [];
    const warnings = [];

    if (!panel) {
      errors.push('Panel object is required');
      return { valid: false, errors, warnings };
    }

    if (!panel.id) errors.push('Panel missing id');
    if (!panel.prompt) warnings.push('Panel missing prompt');
    if (!panel.width) warnings.push('Panel missing width');
    if (!panel.height) warnings.push('Panel missing height');

    // Validate dimensions
    if (panel.width && (panel.width < 100 || panel.width > 2000)) {
      warnings.push('Panel width seems unusual');
    }
    if (panel.height && (panel.height < 100 || panel.height > 2000)) {
      warnings.push('Panel height seems unusual');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate dialogue structure
   * @param {Array} dialogues - Dialogues array to validate
   * @returns {object} Validation result
   */
  static validateDialogues(dialogues) {
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
   * Validate layout structure
   * @param {object} layout - Layout object to validate
   * @returns {object} Validation result
   */
  static validateLayout(layout) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!layout.name) errors.push('Missing layout name');
    if (!layout.pages) errors.push('Missing pages count');
    if (!layout.panels_per_page) errors.push('Missing panels_per_page');
    if (!layout.template) errors.push('Missing template type');

    // Validate panels_per_page
    if (layout.panels_per_page) {
      if (Array.isArray(layout.panels_per_page)) {
        if (layout.panels_per_page.length !== layout.pages) {
          warnings.push('panels_per_page array length does not match pages count');
        }
      } else if (typeof layout.panels_per_page !== 'number') {
        errors.push('panels_per_page must be a number or array');
      }
    }

    // Validate layouts structure
    if (layout.layouts) {
      Object.keys(layout.layouts).forEach(pageKey => {
        const pageLayouts = layout.layouts[pageKey];
        if (!Array.isArray(pageLayouts)) {
          errors.push(`Page ${pageKey} layouts must be an array`);
        } else {
          pageLayouts.forEach((panel, index) => {
            if (!panel.id) errors.push(`Panel ${index} in ${pageKey} missing id`);
            if (!panel.size) errors.push(`Panel ${index} in ${pageKey} missing size`);
            if (panel.y === undefined) errors.push(`Panel ${index} in ${pageKey} missing y position`);
            if (panel.h === undefined) errors.push(`Panel ${index} in ${pageKey} missing height`);
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate file path
   * @param {string} filePath - File path to validate
   * @returns {object} Validation result
   */
  static validateFilePath(filePath) {
    const errors = [];
    const warnings = [];

    if (!filePath || typeof filePath !== 'string') {
      errors.push('File path must be a string');
      return { valid: false, errors, warnings };
    }

    if (filePath.length === 0) {
      errors.push('File path cannot be empty');
    }

    // Check for invalid characters
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(filePath)) {
      errors.push('File path contains invalid characters');
    }

    // Check file extension
    const validExtensions = ['.json', '.yaml', '.yml', '.txt', '.md'];
    const hasValidExtension = validExtensions.some(ext => filePath.endsWith(ext));
    if (!hasValidExtension) {
      warnings.push('File path does not have a recognized extension');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate page count
   * @param {number} pageCount - Page count to validate
   * @returns {object} Validation result
   */
  static validatePageCount(pageCount) {
    const errors = [];
    const warnings = [];

    if (typeof pageCount !== 'number') {
      errors.push('Page count must be a number');
      return { valid: false, errors, warnings };
    }

    if (pageCount < 1) {
      errors.push('Page count must be at least 1');
    }

    if (pageCount > 10) {
      warnings.push('Page count is quite high, consider breaking into smaller comics');
    }

    if (!Number.isInteger(pageCount)) {
      errors.push('Page count must be an integer');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate art style
   * @param {string} style - Art style to validate
   * @returns {object} Validation result
   */
  static validateArtStyle(style) {
    const errors = [];
    const warnings = [];

    const validStyles = [
      'cinematic', 'anime', 'manga', 'western', 'realistic',
      'cartoon', 'noir', 'fantasy', 'sci-fi', 'horror'
    ];

    if (!style || typeof style !== 'string') {
      errors.push('Art style must be a string');
      return { valid: false, errors, warnings };
    }

    if (!validStyles.includes(style.toLowerCase())) {
      warnings.push(`Art style '${style}' is not in the predefined list`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate dialogue mode
   * @param {string} mode - Dialogue mode to validate
   * @returns {object} Validation result
   */
  static validateDialogueMode(mode) {
    const errors = [];
    const warnings = [];

    const validModes = ['context-aware', 'minimal', 'detailed'];

    if (!mode || typeof mode !== 'string') {
      errors.push('Dialogue mode must be a string');
      return { valid: false, errors, warnings };
    }

    if (!validModes.includes(mode.toLowerCase())) {
      errors.push(`Invalid dialogue mode: ${mode}. Valid modes: ${validModes.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate export format
   * @param {string} format - Export format to validate
   * @returns {object} Validation result
   */
  static validateExportFormat(format) {
    const errors = [];
    const warnings = [];

    const validFormats = ['preview', 'pdf', 'images', 'json'];

    if (!format || typeof format !== 'string') {
      errors.push('Export format must be a string');
      return { valid: false, errors, warnings };
    }

    if (!validFormats.includes(format.toLowerCase())) {
      errors.push(`Invalid export format: ${format}. Valid formats: ${validFormats.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate character object
   * @param {object} character - Character object to validate
   * @returns {object} Validation result
   */
  static validateCharacter(character) {
    const errors = [];
    const warnings = [];

    if (!character) {
      errors.push('Character object is required');
      return { valid: false, errors, warnings };
    }

    if (!character.name) {
      errors.push('Character missing name');
    }

    if (!character.description) {
      warnings.push('Character missing description');
    }

    if (character.references && !Array.isArray(character.references)) {
      errors.push('Character references must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate multiple objects
   * @param {Array} objects - Array of objects to validate
   * @param {Function} validator - Validation function to use
   * @returns {object} Combined validation result
   */
  static validateMultiple(objects, validator) {
    const allErrors = [];
    const allWarnings = [];

    objects.forEach((obj, index) => {
      const result = validator(obj);
      if (result.errors) {
        allErrors.push(...result.errors.map(error => `Item ${index + 1}: ${error}`));
      }
      if (result.warnings) {
        allWarnings.push(...result.warnings.map(warning => `Item ${index + 1}: ${warning}`));
      }
    });

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }
}
