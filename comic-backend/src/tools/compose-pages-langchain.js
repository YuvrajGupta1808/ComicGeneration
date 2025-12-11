import { DynamicStructuredTool } from '@langchain/core/tools';
import axios from 'axios';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { z } from 'zod';
import { A4 } from '../../config/a4.js';
import { uploadBuffer } from '../utils/cloudinary.js';
import { calculatePanelPosition } from '../utils/panelCalculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Compose Pages Tool for LangChain
 * Combines generated panel images into A4 comic pages and uploads to Cloudinary
 */
export class ComposePagesLangChainTool {
  constructor() {
    this.name = 'compose_pages';
    this.description =
      'Combines generated panel images into A4 comic pages using layouts from layouts.yaml. Automatically uses images with rendered text (textImageUrl) if available. Reads panel URLs from sourceMap (from Leonardo tool output) or comic.yaml. Returns Cloudinary URLs for composed pages.';
  }

  /**
   * Get the tool definition for LangChain
   */
  getTool() {
    return new DynamicStructuredTool({
      name: this.name,
      description: this.description,
      schema: z.object({
        sourceMap: z
          .string()
          .optional()
          .describe(
            'JSON string mapping panel IDs to Cloudinary URLs (from Leonardo tool output). If not provided, tool will try to read from comic.yaml.'
          ),
        pageCount: z
          .number()
          .int()
          .optional()
          .describe('Use 3 Page Layout'),
        useTextImages: z
          .boolean()
          .optional()
          .describe('Use images with rendered text (textImageUrl) if available. Default: true'),
      }),
      func: async ({ sourceMap, pageCount, useTextImages = true }) => {
        return await this.execute(sourceMap, pageCount, useTextImages);
      },
    });
  }

  /**
   * Load layouts.yaml
   */
  loadLayouts() {
    try {
      const layoutsPath = path.join(__dirname, '../../config/layouts.yaml');
      if (fs.existsSync(layoutsPath)) {
        const layoutsFile = fs.readFileSync(layoutsPath, 'utf8');
        const parsed = yaml.parse(layoutsFile);
        return parsed.layouts || {};
      }
    } catch (error) {
      console.warn('⚠️  Failed to load layouts.yaml:', error.message);
    }
    return {};
  }

  /**
   * Load comic.yaml
   */
  loadComicYaml() {
    try {
      const comicPath = path.join(__dirname, '../../config/comic.yaml');
      if (fs.existsSync(comicPath)) {
        const comicFile = fs.readFileSync(comicPath, 'utf8');
        const parsed = yaml.parse(comicFile);
        return parsed || { characters: [], panels: [] };
      }
    } catch (error) {
      console.warn('⚠️  Failed to load comic.yaml:', error.message);
    }
    return { characters: [], panels: [] };
  }

  /**
   * Get panel URLs from sourceMap, Leonardo output, or construct from results
   * PRIORITY: Use textImageUrl (images with dialogue rendered) if available
   */
  getPanelUrls(sourceMapStr, useTextImages = true) {
    let panelUrls = {};

    // Try to parse sourceMap if provided
    if (sourceMapStr) {
      try {
        // Handle both JSON string and object
        let parsed = sourceMapStr;
        if (typeof sourceMapStr === 'string') {
          parsed = JSON.parse(sourceMapStr);
        }
        
        // Check if parsed has sourceMap property (from Leonardo tool output)
        if (parsed && typeof parsed === 'object') {
          if (parsed.sourceMap) {
            // Extract sourceMap from Leonardo tool response
            panelUrls = parsed.sourceMap;
          } else if (parsed.results && parsed.results.panels) {
            // Try to extract from results.panels array
            const panels = parsed.results.panels || [];
            panels.forEach(panel => {
              if (panel.id && panel.url) {
                panelUrls[panel.id] = panel.url;
              }
            });
          } else {
            // Assume it's directly the sourceMap object
            panelUrls = parsed;
          }
        }
      } catch (error) {
        console.warn('⚠️  Failed to parse sourceMap:', error.message);
      }
    }

    // If no sourceMap, try to construct from Leonardo tool results structure
    if (Object.keys(panelUrls).length === 0 && sourceMapStr) {
      try {
        let parsed = typeof sourceMapStr === 'string' ? JSON.parse(sourceMapStr) : sourceMapStr;
        // Try to extract from results.panels if available
        if (parsed.results && parsed.results.panels) {
          parsed.results.panels.forEach(panel => {
            if (panel.id && panel.url) {
              panelUrls[panel.id] = panel.url;
            }
          });
        }
      } catch (e) {
        // Ignore
      }
    }

    // If still no URLs, try to get from comic.yaml cloudinaryUrl fields
    if (Object.keys(panelUrls).length === 0) {
      const comicData = this.loadComicYaml();
      const panels = comicData.panels || [];
      
      console.log('ℹ️  Reading panel URLs from comic.yaml...');
      
      // Read cloudinaryUrl from each panel
      panels.forEach(panel => {
        const panelId = panel.id;
        if (panelId && panel.cloudinaryUrl) {
          panelUrls[panelId] = panel.cloudinaryUrl;
          console.log(`✓ Found URL for ${panelId}: ${panel.cloudinaryUrl}`);
        }
      });
      
      if (Object.keys(panelUrls).length === 0) {
        console.warn('⚠️  No cloudinaryUrl fields found in comic.yaml panels. Please generate images first.');
      } else {
        console.log(`✓ Found ${Object.keys(panelUrls).length} panel URLs in comic.yaml`);
      }
    }

    // CRITICAL: Override with textImageUrl if available and useTextImages is true
    if (useTextImages) {
      const comicData = this.loadComicYaml();
      const panels = comicData.panels || [];
      
      let textImageCount = 0;
      panels.forEach(panel => {
        if (panel.textImageUrl && panelUrls[panel.id]) {
          console.log(`✓ Using text image for ${panel.id}: ${panel.textImageUrl}`);
          panelUrls[panel.id] = panel.textImageUrl;
          textImageCount++;
        }
      });
      
      if (textImageCount > 0) {
        console.log(`📝 Using ${textImageCount} panels with rendered text`);
      }
    }

    return panelUrls;
  }

  /**
   * Match panel count to layout
   */
  matchLayoutToPanelCount(panelCount, pageCountOverride) {
    const layouts = this.loadLayouts();
    
    // If pageCount is provided, try to match directly
    if (pageCountOverride) {
      const layoutKey = 
        pageCountOverride === 3 ? 'three-page-story' :
        pageCountOverride === 4 ? 'three-page-story' :
        pageCountOverride === 5 ? 'three-page-story' :
        pageCountOverride === 2 ? 'three-page-story' :
        'three-page-story'; // default
      
      if (layouts[layoutKey]) {
        return { layoutKey, layout: layouts[layoutKey] };
      }
    }

    // Auto-detect based on panel count
    // Typical: 8 panels = 3 pages, 12 panels = 4 pages, 14 panels = 5 pages
    let layoutKey;
    if (panelCount <= 1) {
      layoutKey = 'single-panel';
    } else if (panelCount <= 8) {
      layoutKey = 'three-page-story';
    } else if (panelCount <= 12) {
      layoutKey = 'three-page-story';
    } else if (panelCount <= 14) {
      layoutKey = 'three-page-story';
    } else {
      layoutKey = 'three-page-story'; // default
    }

    const layout = layouts[layoutKey];
    if (!layout) {
      throw new Error(`Layout '${layoutKey}' not found in layouts.yaml`);
    }

    return { layoutKey, layout };
  }

  /**
   * Render a single page
   */
  async renderPage(pageNumber, pageLayout, panelUrls) {
    // Create A4 canvas
    const canvas = createCanvas(A4.width, A4.height);
    const ctx = canvas.getContext('2d');

    // Fill background using putImageData (fillRect doesn't work reliably in node-canvas)
    const bgColor = A4.bg || '#FFFFFF';
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Set background by directly writing pixel data
    const imgData = ctx.createImageData(A4.width, A4.height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      imgData.data[i] = r;     // R
      imgData.data[i + 1] = g; // G
      imgData.data[i + 2] = b; // B
      imgData.data[i + 3] = 255; // A (fully opaque)
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw page border
    ctx.strokeStyle = A4.borderColor;
    ctx.lineWidth = A4.borderWidth;
    ctx.strokeRect(A4.margin, A4.margin, A4.width - A4.margin * 2, A4.height - A4.margin * 2);

    // Render each panel on this page
    for (const layoutPanel of pageLayout) {
      const panelId = layoutPanel.id;
      const panelUrl = panelUrls[panelId];

      if (!panelUrl) {
        console.warn(`⚠️  No URL found for panel ${panelId}, skipping...`);
        continue;
      }

      try {
        // Calculate panel position and size (offsetX comes from layouts.yaml)
        const { x, y, width, height } = calculatePanelPosition(A4, layoutPanel);

        // Load and draw panel image
        const imageData = (await axios.get(panelUrl, { responseType: 'arraybuffer' })).data;
        const img = await loadImage(Buffer.from(imageData));
        ctx.drawImage(img, x, y, width, height);

        // Draw panel border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
      } catch (error) {
        console.error(`❌ Failed to render panel ${panelId}:`, error.message);
      }
    }

    // Draw page number
    ctx.fillStyle = '#666';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Page ${pageNumber}`, A4.width / 2, A4.height - 10);

    // Convert to buffer and upload to Cloudinary
    const buffer = canvas.toBuffer('image/png');
    const uploaded = await uploadBuffer(buffer, `page_${pageNumber}`, 'comic/pages', 'png');

    return {
      page: pageNumber,
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    };
  }

  /**
   * Execute page composition
   */
  async execute(sourceMapStr, pageCountOverride = null, useTextImages = true) {
    try {
      // Get panel URLs (prioritize text images if available)
      const panelUrls = this.getPanelUrls(sourceMapStr, useTextImages);

      if (Object.keys(panelUrls).length === 0) {
        return JSON.stringify({
          success: false,
          error:
            'No panel URLs found. Please provide sourceMap from Leonardo tool output, or ensure panels have been generated and uploaded to Cloudinary.',
          pages: [],
        });
      }

      const panelCount = Object.keys(panelUrls).length;
      console.log(`📄 Found ${panelCount} panels, composing pages...`);

      // Match to layout
      const { layoutKey, layout } = this.matchLayoutToPanelCount(panelCount, pageCountOverride);
      console.log(`📐 Using layout: ${layoutKey}`);

      const totalPages = layout.pages || 3;
      const pageLayouts = layout.layouts || {};

      if (!pageLayouts || Object.keys(pageLayouts).length === 0) {
        throw new Error(`No page layouts found in ${layoutKey}`);
      }

      // Render each page
      const pageResults = [];
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pageKey = `page${pageNum}`;
        const pageLayout = pageLayouts[pageKey];

        if (!pageLayout || !Array.isArray(pageLayout)) {
          console.warn(`⚠️  No layout found for ${pageKey}, skipping...`);
          continue;
        }

        console.log(`🎨 Composing page ${pageNum}/${totalPages}...`);
        const pageResult = await this.renderPage(pageNum, pageLayout, panelUrls);
        pageResults.push(pageResult);
        console.log(`✅ Page ${pageNum}: ${pageResult.url}`);
      }

      console.log(`✨ Successfully composed ${pageResults.length} pages!`);

      return JSON.stringify(
        {
          success: true,
          layout: layoutKey,
          totalPages: pageResults.length,
          pages: pageResults,
        },
        null,
        2
      );
    } catch (error) {
      console.error('❌ Page composition failed:', error.message);
      return JSON.stringify({
        success: false,
        error: `Failed to compose pages: ${error.message}`,
        pages: [],
      });
    }
  }
}

