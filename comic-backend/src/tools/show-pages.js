import fs from 'fs-extra';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

/**
 * Show Pages Tool
 * Preview and export comic pages
 */
class ShowPagesTool {
  constructor() {
    this.name = 'show-pages';
    this.description = 'Preview and export comic pages';
    this.requiredParams = [];
    this.optionalParams = ['format', 'layout', 'outputPath'];
  }

  /**
   * Execute page preview/export
   * @param {object} params - Parameters
   * @param {ContextMemory} context - Context memory
   * @returns {Promise<object>} Preview/export result
   */
  async execute(params, context) {
    const { format = 'preview', layout, outputPath } = params;
    
    try {
      // Get panels from context
      const panels = context.getContext('panelsWithDialogue', 'project');
      const selectedLayout = layout || context.getContext('selectedLayout', 'project');
      
      if (!panels || !selectedLayout) {
        return {
          success: false,
          error: 'Missing panels or layout data. Run comic generation and layout selection first.'
        };
      }
      
      // Use existing rendering system
      const { renderAll } = await this.loadRenderer();
      
      const pages = await renderAll(panels, selectedLayout);
      
      // Handle different output formats
      let result;
      switch (format.toLowerCase()) {
        case 'preview':
          result = await this.generatePreview(pages, outputPath);
          break;
        case 'pdf':
          result = await this.exportToPDF(pages, outputPath);
          break;
        case 'images':
          result = await this.exportToImages(pages, outputPath);
          break;
        case 'json':
          result = await this.exportToJSON(pages, outputPath);
          break;
        default:
          result = await this.generatePreview(pages, outputPath);
      }
      
      // Store in context
      context.setContext('finalPages', pages, 'project');
      context.addAction('show-pages', params, { pages, result });
      
      return {
        success: true,
        pages,
        result,
        message: `Generated ${pages.length} pages successfully`
      };
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        pages: []
      };
      
      context.addAction('show-pages', params, errorResult);
      return errorResult;
    }
  }

  /**
   * Load renderer (placeholder for integration)
   * @returns {Promise<object>} Renderer
   */
  async loadRenderer() {
    // This would integrate with the existing rendering system
    // For now, return a mock implementation
    return {
      renderAll: async (panels, layout) => {
        // Mock implementation - replace with actual rendering
        const pages = [];
        const panelsPerPage = layout.panels_per_page;
        
        if (Array.isArray(panelsPerPage)) {
          let panelIndex = 0;
          panelsPerPage.forEach((panelCount, pageIndex) => {
            const pagePanels = panels.slice(panelIndex, panelIndex + panelCount);
            pages.push({
              pageNumber: pageIndex + 1,
              panels: pagePanels,
              layout: layout.layouts[`page${pageIndex + 1}`] || [],
              rendered: true
            });
            panelIndex += panelCount;
          });
        } else {
          // Single panel per page
          panels.forEach((panel, index) => {
            pages.push({
              pageNumber: index + 1,
              panels: [panel],
              layout: layout.layouts[`page${index + 1}`] || [],
              rendered: true
            });
          });
        }
        
        return pages;
      }
    };
  }

  /**
   * Generate preview
   * @param {Array} pages - Pages to preview
   * @param {string} outputPath - Output path
   * @returns {Promise<object>} Preview result
   */
  async generatePreview(pages, outputPath) {
    const previewPath = outputPath || './preview';
    
    // Create preview directory
    await fs.ensureDir(previewPath);
    
    // Generate preview files
    const previewFiles = [];
    
    for (const page of pages) {
      const previewFile = path.join(previewPath, `page_${page.pageNumber}_preview.json`);
      await fs.writeFile(previewFile, JSON.stringify(page, null, 2));
      previewFiles.push(previewFile);
    }
    
    // Generate summary
    const summary = {
      totalPages: pages.length,
      totalPanels: pages.reduce((sum, page) => sum + page.panels.length, 0),
      previewFiles,
      generatedAt: new Date().toISOString()
    };
    
    const summaryFile = path.join(previewPath, 'preview_summary.json');
    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
    
    return {
      type: 'preview',
      path: previewPath,
      files: previewFiles,
      summary
    };
  }

  /**
   * Export to PDF
   * @param {Array} pages - Pages to export
   * @param {string} outputPath - Output path
   * @returns {Promise<object>} Export result
   */
  async exportToPDF(pages, outputPath) {
    const pdfDoc = await PDFDocument.create();
    
    // Add pages to PDF
    for (const page of pages) {
      const pdfPage = pdfDoc.addPage([612, 792]); // Standard page size
      
      // Add page content (placeholder)
      pdfPage.drawText(`Page ${page.pageNumber}`, {
        x: 50,
        y: 750,
        size: 12
      });
      
      // Add panel information
      page.panels.forEach((panel, index) => {
        pdfPage.drawText(`Panel ${index + 1}: ${panel.id}`, {
          x: 50,
          y: 700 - (index * 20),
          size: 10
        });
      });
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const pdfPath = outputPath || './comic.pdf';
    await fs.writeFile(pdfPath, pdfBytes);
    
    return {
      type: 'pdf',
      path: pdfPath,
      size: pdfBytes.length,
      pages: pages.length
    };
  }

  /**
   * Export to images
   * @param {Array} pages - Pages to export
   * @param {string} outputPath - Output path
   * @returns {Promise<object>} Export result
   */
  async exportToImages(pages, outputPath) {
    const imagesPath = outputPath || './images';
    await fs.ensureDir(imagesPath);
    
    const imageFiles = [];
    
    for (const page of pages) {
      // Generate mock image data (replace with actual image generation)
      const imageData = this.generateMockImageData(page);
      const imagePath = path.join(imagesPath, `page_${page.pageNumber}.png`);
      
      // In a real implementation, this would generate actual images
      await fs.writeFile(imagePath, imageData);
      imageFiles.push(imagePath);
    }
    
    return {
      type: 'images',
      path: imagesPath,
      files: imageFiles,
      count: imageFiles.length
    };
  }

  /**
   * Export to JSON
   * @param {Array} pages - Pages to export
   * @param {string} outputPath - Output path
   * @returns {Promise<object>} Export result
   */
  async exportToJSON(pages, outputPath) {
    const jsonPath = outputPath || './comic.json';
    
    const exportData = {
      metadata: {
        totalPages: pages.length,
        totalPanels: pages.reduce((sum, page) => sum + page.panels.length, 0),
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      },
      pages: pages.map(page => ({
        pageNumber: page.pageNumber,
        panels: page.panels.map(panel => ({
          id: panel.id,
          prompt: panel.prompt,
          url: panel.url,
          dialogues: panel.dialogues || []
        })),
        layout: page.layout
      }))
    };
    
    await fs.writeFile(jsonPath, JSON.stringify(exportData, null, 2));
    
    return {
      type: 'json',
      path: jsonPath,
      size: JSON.stringify(exportData).length,
      pages: pages.length
    };
  }

  /**
   * Generate mock image data
   * @param {object} page - Page object
   * @returns {Buffer} Mock image data
   */
  generateMockImageData(page) {
    // This is a placeholder - in a real implementation, this would generate actual images
    const mockData = {
      pageNumber: page.pageNumber,
      panels: page.panels.length,
      generated: true
    };
    
    return Buffer.from(JSON.stringify(mockData));
  }

  /**
   * Get available export formats
   * @returns {Array} Available formats
   */
  getAvailableFormats() {
    return ['preview', 'pdf', 'images', 'json'];
  }

  /**
   * Validate pages structure
   * @param {Array} pages - Pages to validate
   * @returns {object} Validation result
   */
  validatePages(pages) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(pages)) {
      errors.push('Pages must be an array');
      return { valid: false, errors, warnings };
    }

    pages.forEach((page, index) => {
      if (!page.pageNumber) {
        errors.push(`Page ${index + 1} missing pageNumber`);
      }
      
      if (!page.panels || !Array.isArray(page.panels)) {
        errors.push(`Page ${index + 1} missing panels array`);
      } else if (page.panels.length === 0) {
        warnings.push(`Page ${index + 1} has no panels`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get page statistics
   * @param {Array} pages - Pages to analyze
   * @returns {object} Statistics
   */
  getPageStatistics(pages) {
    const totalPages = pages.length;
    const totalPanels = pages.reduce((sum, page) => sum + page.panels.length, 0);
    const averagePanelsPerPage = totalPanels / totalPages;
    
    const panelSizes = pages.flatMap(page => 
      page.panels.map(panel => ({
        width: panel.width || 0,
        height: panel.height || 0
      }))
    );
    
    const averageWidth = panelSizes.reduce((sum, p) => sum + p.width, 0) / panelSizes.length;
    const averageHeight = panelSizes.reduce((sum, p) => sum + p.height, 0) / panelSizes.length;
    
    return {
      totalPages,
      totalPanels,
      averagePanelsPerPage: Math.round(averagePanelsPerPage * 100) / 100,
      averagePanelWidth: Math.round(averageWidth),
      averagePanelHeight: Math.round(averageHeight),
      totalDialogues: pages.reduce((sum, page) => 
        sum + page.panels.reduce((panelSum, panel) => 
          panelSum + (panel.dialogues ? panel.dialogues.length : 0), 0
        ), 0
      )
    };
  }
}

export { ShowPagesTool };
