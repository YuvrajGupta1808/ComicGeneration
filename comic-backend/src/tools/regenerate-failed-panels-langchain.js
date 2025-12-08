import { DynamicStructuredTool } from '@langchain/core/tools';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { z } from 'zod';
import { LEONARDO } from '../../config/leonardo.js';
import { uploadBuffer } from '../utils/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.LEONARDO_API_KEY;
const HEADERS = {
  accept: 'application/json',
  'content-type': 'application/json',
  authorization: `Bearer ${API_KEY}`,
};

/**
 * Regenerate Failed Panels Tool for LangChain
 * Regenerates specific failed panels from comic.yaml using Leonardo AI
 */
export class RegenerateFailedPanelsLangChainTool {
  constructor() {
    this.name = 'regenerate_failed_panels';
    this.description =
      'Regenerates specific failed panel images from comic.yaml. Provide a single panel ID or comma-separated list of panel IDs to regenerate (e.g., "panel4" or "panel4,panel7,panel9"). Uses the panel prompt from comic.yaml and attempts generation with different seeds.';
  }

  /**
   * Get the tool definition for LangChain
   */
  getTool() {
    return new DynamicStructuredTool({
      name: this.name,
      description: this.description,
      schema: z.object({
        panelIds: z
          .string()
          .describe('Panel ID(s) to regenerate. Single ID (e.g., "panel4") or comma-separated list (e.g., "panel4,panel7,panel9")'),
      }),
      func: async ({ panelIds }) => {
        return await this.execute(panelIds);
      },
    });
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
   * Save generated image URLs back to comic.yaml
   */
  async saveUrlsToComicYaml(results, comicData) {
    try {
      const comicPath = path.join(__dirname, '../../config/comic.yaml');
      
      // Update panel URLs
      if (results.panels && results.panels.length > 0) {
        results.panels.forEach(panelResult => {
          if (!panelResult.error && panelResult.url) {
            const panel = comicData.panels.find(p => p.id === panelResult.id);
            if (panel) {
              panel.cloudinaryUrl = panelResult.url;
            }
          }
        });
      }
      
      // Write back to comic.yaml
      await fs.writeFile(
        comicPath,
        yaml.stringify(comicData, {
          indent: 2,
          lineWidth: 120,
          simpleKeys: false
        })
      );
      
      console.log('💾 Saved regenerated panel URLs to comic.yaml');
    } catch (error) {
      console.error('⚠️  Failed to save URLs to comic.yaml:', error.message);
    }
  }

  /**
   * Generate a single image using Leonardo AI
   */
  async generateImage({ prompt, imageNum, seed, width, height, contextImages, folder, prefix }) {
    const body = {
      prompt,
      modelId: LEONARDO.MODEL_ID,
      styleUUID: LEONARDO.STYLE_UUID,
      width,
      height,
      num_images: 1,
      enhancePrompt: true,
      seed,
      contrastRatio: 0.5,
      ...(contextImages && contextImages.length > 0 && { contextImages }),
    };

    console.log(`🎨 [${prefix} ${imageNum}] Starting generation with ${contextImages?.length || 0} context images...`);
    
    const res = await axios.post(`${LEONARDO.API_URL}/generations`, body, { headers: HEADERS });
    const genId = res.data.sdGenerationJob.generationId;

    console.log(`🕓 [${prefix} ${imageNum}] Generation ID: ${genId}`);
    
    // Wait for generation to complete (polling)
    let imageUrl = null;
    let leonardoImageId = null;
    let attempts = 0;
    const maxAttempts = 40;
    const pollInterval = 3000;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, pollInterval));
      attempts++;

      try {
        const fetchRes = await axios.get(`${LEONARDO.API_URL}/generations/${genId}`, {
          headers: HEADERS,
        });
        const status = fetchRes.data.generations_by_pk?.status;
        const generatedImages = fetchRes.data.generations_by_pk?.generated_images;

        if (status === 'COMPLETE' && generatedImages && generatedImages.length > 0) {
          const img = generatedImages[0];
          imageUrl = img.url;
          leonardoImageId = img.id;
          console.log(`✓ [${prefix} ${imageNum}] Generation complete (${attempts * pollInterval / 1000}s)`);
          break;
        } else if (status === 'FAILED') {
          throw new Error(`Generation failed for ${prefix} ${imageNum}`);
        } else if (attempts % 5 === 0) {
          console.log(`⏳ [${prefix} ${imageNum}] Still generating... (${attempts * pollInterval / 1000}s elapsed)`);
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          throw new Error(`Timeout after ${maxAttempts * pollInterval / 1000}s: ${error.message}`);
        }
      }
    }

    if (!imageUrl || !leonardoImageId) {
      throw new Error(`No image returned for ${prefix} ${imageNum} after ${maxAttempts * pollInterval / 1000}s`);
    }

    // Download image and upload to Cloudinary
    const imageData = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageData.data);
    const publicId = `${prefix}_${imageNum}`;
    const uploaded = await uploadBuffer(buffer, publicId, folder);
    console.log(`☁️ [${prefix} ${imageNum}] Uploaded → ${uploaded.secure_url}`);

    return {
      number: imageNum,
      leonardoId: leonardoImageId,
      cloudinaryUrl: uploaded.secure_url,
    };
  }

  /**
   * Execute panel regeneration
   */
  async execute(panelIds = '') {
    try {
      const comicData = this.loadComicYaml();
      const { panels = [] } = comicData;

      if (panels.length === 0) {
        return JSON.stringify({
          success: false,
          error: 'No panels found in comic.yaml. Please generate them first.',
          results: {},
        });
      }

      // Parse panel IDs (handle single or comma-separated list)
      const panelIdList = panelIds.split(',').map(id => id.trim()).filter(Boolean);
      
      if (panelIdList.length === 0) {
        return JSON.stringify({
          success: false,
          error: 'No panel IDs provided. Please specify panel ID(s) to regenerate.',
          results: {},
        });
      }

      console.log(`🔄 Regenerating ${panelIdList.length} panel(s): ${panelIdList.join(', ')}`);

      const results = {
        panels: [],
      };

      const sourceMap = {};

      // Process each panel
      for (const panelId of panelIdList) {
        const panelIndex = panels.findIndex(p => p.id === panelId);
        
        if (panelIndex === -1) {
          console.warn(`⚠️  Panel ${panelId} not found in comic.yaml, skipping...`);
          results.panels.push({
            id: panelId,
            error: 'Panel not found in comic.yaml',
          });
          continue;
        }

        const panel = panels[panelIndex];
        
        try {
          console.log(`\n🎯 Regenerating panel: ${panelId}`);
          
          // Use context from previous panel if available
          let contextImages = [];
          if (panelIndex > 0) {
            const prevPanel = panels[panelIndex - 1];
            if (prevPanel && prevPanel.cloudinaryUrl) {
              console.log(`📸 Note: Previous panel (${prevPanel.id}) exists but Leonardo API requires Leonardo IDs for context`);
            }
          }

          // Use a randomized seed for regeneration
          const randomSeed = 18000 + panelIndex * 23 + Math.floor(Math.random() * 10000);

          const generated = await this.generateImage({
            prompt: panel.prompt || panel.description,
            imageNum: panelIndex + 1,
            seed: randomSeed,
            width: panel.width || 832,
            height: panel.height || 1248,
            contextImages,
            folder: 'comic/panels',
            prefix: 'panel',
          });

          results.panels.push({
            id: panelId,
            leonardoId: generated.leonardoId,
            url: generated.cloudinaryUrl,
            regenerated: true,
          });
          
          sourceMap[panelId] = generated.cloudinaryUrl;
          
          console.log(`✅ Panel ${panelId} regenerated successfully!`);

          // Delay between panels
          if (panelIdList.indexOf(panelId) < panelIdList.length - 1) {
            console.log(`⏳ Waiting 5s before next panel...`);
            await new Promise((r) => setTimeout(r, 5000));
          }
        } catch (error) {
          console.error(`❌ Failed to regenerate panel ${panelId}:`, error.message);
          results.panels.push({
            id: panelId,
            error: error.message,
            prompt: panel.prompt || panel.description,
          });
        }
      }

      // Save URLs back to comic.yaml
      await this.saveUrlsToComicYaml(results, comicData);

      const successfulPanels = results.panels.filter(p => !p.error).length;
      const failedPanels = results.panels.filter(p => p.error);
      const failedPanelIds = failedPanels.map(p => p.id);

      console.log(`\n📊 Regeneration Summary: ${successfulPanels}/${panelIdList.length} panels succeeded`);
      
      if (failedPanels.length > 0) {
        console.log(`⚠️  Failed panels: ${failedPanelIds.join(', ')}`);
      }

      console.table(
        results.panels.map((r) => ({ 
          id: r.id, 
          status: r.error ? '❌ Failed' : '✓ Success',
          error: r.error || '-'
        }))
      );

      return JSON.stringify(
        {
          success: successfulPanels > 0,
          totalRequested: panelIdList.length,
          successfulPanels,
          failedPanels: failedPanels.length,
          failedPanelIds,
          results,
          sourceMap,
          message: failedPanels.length > 0
            ? `Regenerated ${successfulPanels}/${panelIdList.length} panels. Failed: ${failedPanelIds.join(', ')}`
            : `Successfully regenerated all ${successfulPanels} panels!`
        },
        null,
        2
      );
    } catch (error) {
      console.error('❌ Panel regeneration failed:', error.message);
      return JSON.stringify({
        success: false,
        error: `Failed to regenerate panels: ${error.message}`,
        results: {},
      });
    }
  }
}
