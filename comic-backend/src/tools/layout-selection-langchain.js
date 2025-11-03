import { DynamicStructuredTool } from '@langchain/core/tools';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Layout Selection Tool for LangChain
 * Dynamically selects multi-page comic layout templates based on page count
 */
export class LayoutSelectionLangChainTool {
  constructor() {
    this.name = 'select_comic_layout';
    this.description = 'Select the number of pages for your comic. Choose from 1-5 pages. Each layout represents a complete comic with cover and story pages. Default is 3 pages if not specified.';
    this.defaultPageCount = 3;
    this.templates = this.loadLayoutTemplates();
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
   * Get the tool definition for LangChain
   */
  getTool() {
    return new DynamicStructuredTool({
      name: this.name,
      description: this.description,
      schema: z.object({
        pageCount: z.number()
          .int()
          .min(1)
          .max(5)
          .optional()
          .describe('Number of pages for the comic (1-5). Default is 3 if not specified.')
      }),
      func: async ({ pageCount }) => {
        return await this.execute(pageCount);
      }
    });
  }

  /**
   * Execute layout selection
   * @param {number} pageCount - Number of pages (1-5), default is 3
   * @returns {Promise<string>} JSON string of selected layout
   */
  async execute(pageCount = null) {
    try {
      // Use default if no page count specified
      const pages = pageCount || this.defaultPageCount;
      
      // Validate page count
      if (pages < 1 || pages > 5) {
        return JSON.stringify({
          success: false,
          error: `Invalid page count. Must be between 1 and 5. Got: ${pages}`,
          suggestedPageCount: this.defaultPageCount
        });
      }

      // Select layout based on page count
      const selectedLayout = this.templates.find(layout => layout.pages === pages);

      if (!selectedLayout) {
        return JSON.stringify({
          success: false,
          error: `No layout found for ${pages} pages`,
          availableLayouts: this.templates.map(layout => ({
            pages: layout.pages,
            name: layout.name,
            panelCount: layout.panels_per_page
          }))
        });
      }

      // Return simplified result
      const result = {
        success: true,
        pageCount: pages,
        layoutName: selectedLayout.name,
        message: `Selected ${pages}-page comic layout successfully`
      };

      return JSON.stringify(result);

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Failed to select layout: ${error.message}`,
        suggestedPageCount: this.defaultPageCount
      });
    }
  }

  /**
   * Get all available layouts for reference
   * @returns {Array} List of available layouts
   */
  getAvailableLayouts() {
    return this.templates.map(layout => ({
      pages: layout.pages,
      name: layout.name,
      panelsPerPage: layout.panels_per_page
    }));
  }

  /**
   * Get layout by page count
   * @param {number} pageCount - Number of pages
   * @returns {object|null} Layout object or null
   */
  getLayoutByPageCount(pageCount) {
    return this.templates.find(layout => layout.pages === pageCount) || null;
  }
}
