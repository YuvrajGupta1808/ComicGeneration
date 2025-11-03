import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Layout Selection Tool
 * Manages layout templates and selection logic
 */
class LayoutSelectionTool {
  constructor() {
    this.name = 'layout-selection';
    this.description = 'Select layout template based on page count';
    this.requiredParams = ['pageCount'];
    this.optionalParams = ['storyType'];
    this.templates = this.loadLayoutTemplates();
  }

  /**
   * Execute layout selection
   * @param {object} params - Parameters
   * @param {ContextMemory} context - Context memory
   * @returns {Promise<object>} Selection result
   */
  async execute(params, context) {
    const { pageCount, storyType = 'general' } = params;
    
    const selectedLayout = this.selectLayout(pageCount, storyType);
    
    if (!selectedLayout) {
      return {
        success: false,
        error: `No layout template found for ${pageCount} pages`
      };
    }
    
    // Store in context
    context.setContext('selectedLayout', selectedLayout, 'project');
    context.addAction('layout-selection', params, { layout: selectedLayout });
    
    return {
      success: true,
      layout: selectedLayout,
      message: `Selected ${selectedLayout.name} layout`
    };
  }

  /**
   * Select layout based on page count and story type
   * @param {number} pageCount - Number of pages
   * @param {string} storyType - Type of story
   * @returns {object|null} Selected layout
   */
  selectLayout(pageCount, storyType) {
    const availableLayouts = this.templates.filter(
      layout => layout.pages === pageCount
    );
    
    if (availableLayouts.length === 0) {
      return null;
    }
    
    // Return the first matching layout or allow user selection
    return availableLayouts[0];
  }

  /**
   * List all available layouts
   * @returns {Array} Available layouts
   */
  listAvailableLayouts() {
    return this.templates.map(layout => ({
      name: layout.name,
      pages: layout.pages,
      panels: layout.panels_per_page,
      template: layout.template
    }));
  }

  /**
   * Get layouts by page count
   * @param {number} pageCount - Number of pages
   * @returns {Array} Matching layouts
   */
  getLayoutsByPageCount(pageCount) {
    return this.templates.filter(layout => layout.pages === pageCount);
  }

  /**
   * Get layout by name
   * @param {string} name - Layout name
   * @returns {object|null} Layout
   */
  getLayoutByName(name) {
    return this.templates.find(layout => layout.name === name);
  }

  /**
   * Validate layout structure
   * @param {object} layout - Layout to validate
   * @returns {object} Validation result
   */
  validateLayout(layout) {
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
   * Load layout templates from YAML file
   * @returns {Array} Layout templates
   */
  loadLayoutTemplates() {
    try {
      const layoutsPath = path.join(__dirname, '../../config/layouts.yaml');
      if (fs.existsSync(layoutsPath)) {
        const layoutsConfig = fs.readFileSync(layoutsPath, 'utf8');
        const parsed = yaml.parse(layoutsConfig);
        return Object.values(parsed.layouts || {});
      }
    } catch (error) {
      console.warn('Failed to load layout templates:', error.message);
    }
    
    return [];
  }

  /**
   * Save layout templates to YAML file
   * @param {Array} templates - Layout templates
   */
  saveLayoutTemplates(templates) {
    try {
      const layoutsPath = path.join(__dirname, '../../config/layouts.yaml');
      const layoutsConfig = {
        layouts: {}
      };
      
      templates.forEach(template => {
        layoutsConfig.layouts[template.name.toLowerCase().replace(/\s+/g, '-')] = template;
      });
      
      fs.writeFileSync(layoutsPath, yaml.stringify(layoutsConfig));
      this.templates = templates;
    } catch (error) {
      console.warn('Failed to save layout templates:', error.message);
    }
  }

  /**
   * Add new layout template
   * @param {object} layout - Layout template
   * @returns {object} Result
   */
  addLayout(layout) {
    const validation = this.validateLayout(layout);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Invalid layout template',
        details: validation.errors
      };
    }

    // Check for duplicate name
    if (this.templates.find(t => t.name === layout.name)) {
      return {
        success: false,
        error: 'Layout with this name already exists'
      };
    }

    this.templates.push(layout);
    this.saveLayoutTemplates(this.templates);

    return {
      success: true,
      message: `Added layout template: ${layout.name}`
    };
  }

  /**
   * Remove layout template
   * @param {string} name - Layout name
   * @returns {object} Result
   */
  removeLayout(name) {
    const index = this.templates.findIndex(t => t.name === name);
    if (index === -1) {
      return {
        success: false,
        error: 'Layout not found'
      };
    }

    this.templates.splice(index, 1);
    this.saveLayoutTemplates(this.templates);

    return {
      success: true,
      message: `Removed layout template: ${name}`
    };
  }
}

export { LayoutSelectionTool };
