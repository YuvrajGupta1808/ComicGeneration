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
 * Leonardo AI Image Generation Tool for LangChain
 * Generates character and panel images using Leonardo AI and uploads to Cloudinary
 */
export class LeonardoImageGenerationLangChainTool {
  constructor() {
    this.name = 'generate_leonardo_images';
    this.description =
      'Generates images for characters and/or panels from comic.yaml using Leonardo AI and uploads them to Cloudinary. Can generate characters, panels, both, or a specific panel. Automatically uses context images for visual consistency. Returns Cloudinary URLs and generation summary.';
  }

  /**
   * Get the tool definition for LangChain
   */
  getTool() {
    return new DynamicStructuredTool({
      name: this.name,
      description: this.description,
      schema: z.object({
        generateType: z
          .enum(['characters', 'panels', 'both'])
          .optional()
          .default('both')
          .describe(
            'What to generate: "characters" (only characters), "panels" (only panels), or "both" (characters then panels)'
          ),
        specificPanel: z
          .string()
          .optional()
          .describe('Optional: Generate only a specific panel by ID (e.g., "panel4", "panel5")'),
      }),
      func: async ({ generateType, specificPanel }) => {
        return await this.execute(generateType, specificPanel);
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
    
    // Wait for generation to complete (polling) - reduced time per poll
    let imageUrl = null;
    let leonardoImageId = null;
    let attempts = 0;
    const maxAttempts = 40; // 40 attempts * 3 seconds = 2 minutes max
    const pollInterval = 3000; // Reduced from 5000 to 3000ms

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
          // Progress update every 15 seconds
          console.log(`⏳ [${prefix} ${imageNum}] Still generating... (${attempts * pollInterval / 1000}s elapsed)`);
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          throw new Error(`Timeout after ${maxAttempts * pollInterval / 1000}s: ${error.message}`);
        }
        // Continue polling on transient errors
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
   * Execute image generation
   */
  async execute(generateType = 'both', specificPanel = null) {
    try {
      const comicData = this.loadComicYaml();
      const { characters = [], panels = [] } = comicData;

      if (characters.length === 0 && panels.length === 0) {
        return JSON.stringify({
          success: false,
          error: 'No characters or panels found in comic.yaml. Please generate them first.',
          results: {},
        });
      }

      const results = {
        characters: [],
        panels: [],
      };

      // Context map to track generated images for use in panels
      const contextMap = {};
      const sourceMap = {}; // Maps character/panel IDs to Cloudinary URLs

      // If specific panel requested, load existing context from previous generations
      if (specificPanel && generateType === 'panels') {
        console.log(`🎯 Generating specific panel: ${specificPanel}`);
        
        // Load existing character context
        for (let i = 0; i < characters.length; i++) {
          const char = characters[i];
          const charId = char.id || `char_${i + 1}`;
          // Note: We don't have leonardoId stored, so context won't include previous characters
          // This is a limitation - ideally we'd store leonardoId in comic.yaml
        }
        
        // Find the specific panel
        const panelIndex = panels.findIndex(p => p.id === specificPanel);
        if (panelIndex === -1) {
          return JSON.stringify({
            success: false,
            error: `Panel ${specificPanel} not found in comic.yaml`,
            results: {},
          });
        }
        
        const panel = panels[panelIndex];
        
        try {
          // Build context images - for specific panel, we can't reference previous panels
          // since we don't have their leonardoIds stored
          let contextImages = [];
          
          const generated = await this.generateImage({
            prompt: panel.prompt || panel.description,
            imageNum: panelIndex + 1,
            seed: 18000 + panelIndex * 23 + Math.floor(Math.random() * 100), // Add randomness for regeneration
            width: panel.width || 832,
            height: panel.height || 1248,
            contextImages,
            folder: 'comic/panels',
            prefix: 'panel',
          });

          results.panels.push({
            id: panel.id,
            leonardoId: generated.leonardoId,
            url: generated.cloudinaryUrl,
          });
          
          sourceMap[panel.id] = generated.cloudinaryUrl;
          
          console.log(`✅ Panel ${specificPanel} generated successfully!`);
          
          return JSON.stringify(
            {
              success: true,
              generateType: 'specific_panel',
              specificPanel,
              results,
              sourceMap,
            },
            null,
            2
          );
        } catch (error) {
          console.error(`❌ Failed to generate panel ${specificPanel}:`, error.message);
          return JSON.stringify({
            success: false,
            error: `Failed to generate panel ${specificPanel}: ${error.message}`,
            results: {},
          });
        }
      }

      // Generate characters if requested
      if (generateType === 'characters' || generateType === 'both') {
        if (characters.length === 0) {
          console.warn('⚠️  No characters found in comic.yaml, skipping character generation');
        } else {
          console.log(`🎨 Generating ${characters.length} character images...`);

          for (let i = 0; i < characters.length; i++) {
            const char = characters[i];
            const charId = char.id || `char_${i + 1}`;

            try {
              const generated = await this.generateImage({
                prompt: char.prompt || char.description,
                imageNum: i + 1,
                seed: 17000 + i * 17,
                width: char.width || 832,
                height: char.height || 1248,
                contextImages: [], // Characters typically don't use context
                folder: 'comic/characters',
                prefix: 'character',
              });

              // Store for context mapping (panels will reference these)
              contextMap[charId] = { type: 'GENERATED', id: generated.leonardoId };
              sourceMap[charId] = generated.cloudinaryUrl;

              results.characters.push({
                id: charId,
                leonardoId: generated.leonardoId,
                url: generated.cloudinaryUrl,
              });

              // Small delay between generations
              if (i < characters.length - 1) {
                await new Promise((r) => setTimeout(r, 2000));
              }
            } catch (error) {
              console.error(`❌ Failed to generate character ${charId}:`, error.message);
              results.characters.push({
                id: charId,
                error: error.message,
              });
            }
          }
        }
      }

      // Generate panels if requested
      if (generateType === 'panels' || generateType === 'both') {
        if (panels.length === 0) {
          console.warn('⚠️  No panels found in comic.yaml, skipping panel generation');
        } else {
          console.log(`🎨 Generating ${panels.length} panel images...`);

          for (let i = 0; i < panels.length; i++) {
            const panel = panels[i];
            const panelId = panel.id || `panel${i + 1}`;

            try {
              // Build context images array from panel's contextImages
              let contextImages = [];
              if (panel.contextImages && Array.isArray(panel.contextImages)) {
                contextImages = panel.contextImages
                  .map((key) => {
                    // Check if it's a character reference
                    if (contextMap[key]) {
                      return contextMap[key];
                    }
                    // Check if it's a previous panel reference (e.g., "panel_1", "panel1")
                    const panelMatch = key.match(/panel[_\s]?(\d+)/i);
                    if (panelMatch) {
                      const panelNum = parseInt(panelMatch[1]) - 1; // Convert to 0-based index
                      if (panelNum >= 0 && panelNum < i) {
                        // Reference to a previous panel
                        const prevPanel = results.panels[panelNum];
                        if (prevPanel && prevPanel.leonardoId) {
                          return { type: 'GENERATED', id: prevPanel.leonardoId };
                        }
                      }
                    }
                    return null;
                  })
                  .filter(Boolean);
              }

              // CRITICAL: Always use previous panel as context for consistency
              if (i > 0) {
                const prevPanel = results.panels[i - 1];
                if (prevPanel && prevPanel.leonardoId) {
                  // Add previous panel at the beginning for priority
                  contextImages.unshift({ type: 'GENERATED', id: prevPanel.leonardoId });
                }
              }
              
              // Limit to 4 context images max
              if (contextImages.length > 4) {
                contextImages = contextImages.slice(0, 4);
              }

              console.log(`📸 [panel ${i + 1}] Using ${contextImages.length} context images for consistency`);

              const generated = await this.generateImage({
                prompt: panel.prompt || panel.description,
                imageNum: i + 1,
                seed: 18000 + i * 23,
                width: panel.width || 832,
                height: panel.height || 1248,
                contextImages,
                folder: 'comic/panels',
                prefix: 'panel',
              });

              // Store for future panel references
              contextMap[`panel_${i + 1}`] = { type: 'GENERATED', id: generated.leonardoId };
              contextMap[panelId] = { type: 'GENERATED', id: generated.leonardoId };
              sourceMap[panelId] = generated.cloudinaryUrl;

              results.panels.push({
                id: panelId,
                leonardoId: generated.leonardoId,
                url: generated.cloudinaryUrl,
              });

              // Reduced delay between generations (from 15s to 8s)
              if (i < panels.length - 1) {
                console.log(`⏳ Waiting 8s before next panel...`);
                await new Promise((r) => setTimeout(r, 8000));
              }
            } catch (error) {
              console.error(`❌ Failed to generate panel ${panelId}:`, error.message);
              
              // Retry once on any error
              console.log(`🔄 Retrying panel ${panelId} (attempt 2/2)...`);
              try {
                await new Promise((r) => setTimeout(r, 5000)); // Wait 5s before retry
                
                // Rebuild context images for retry
                let retryContextImages = [];
                if (i > 0) {
                  const prevPanel = results.panels[i - 1];
                  if (prevPanel && prevPanel.leonardoId) {
                    retryContextImages = [{ type: 'GENERATED', id: prevPanel.leonardoId }];
                  }
                }
                
                const generated = await this.generateImage({
                  prompt: panel.prompt || panel.description,
                  imageNum: i + 1,
                  seed: 18000 + i * 23 + 1000, // Different seed for retry
                  width: panel.width || 832,
                  height: panel.height || 1248,
                  contextImages: retryContextImages,
                  folder: 'comic/panels',
                  prefix: 'panel',
                });

                contextMap[`panel_${i + 1}`] = { type: 'GENERATED', id: generated.leonardoId };
                contextMap[panelId] = { type: 'GENERATED', id: generated.leonardoId };
                sourceMap[panelId] = generated.cloudinaryUrl;

                results.panels.push({
                  id: panelId,
                  leonardoId: generated.leonardoId,
                  url: generated.cloudinaryUrl,
                  retried: true,
                });
                
                console.log(`✓ Retry successful for panel ${panelId}`);
                
                // Continue with delay
                if (i < panels.length - 1) {
                  console.log(`⏳ Waiting 8s before next panel...`);
                  await new Promise((r) => setTimeout(r, 8000));
                }
              } catch (retryError) {
                console.error(`❌ Retry failed for panel ${panelId}:`, retryError.message);
                results.panels.push({
                  id: panelId,
                  error: retryError.message,
                  skipped: true,
                });
                
                // Continue to next panel even after failure
                console.log(`⏭️  Continuing to next panel...`);
              }
            }
          }
        }
      }

      console.log('✅ Image generation completed!');
      
      const successfulPanels = results.panels.filter(p => !p.error).length;
      const failedPanels = results.panels.filter(p => p.error).length;
      
      console.log(`📊 Summary: ${successfulPanels} panels succeeded, ${failedPanels} panels failed`);
      
      console.table([
        ...results.characters.map((r) => ({ type: 'Character', id: r.id, status: r.error ? '❌ Failed' : '✓ Success' })),
        ...results.panels.map((r) => ({ type: 'Panel', id: r.id, status: r.error ? '❌ Failed' : (r.retried ? '✓ Retried' : '✓ Success') })),
      ]);

      return JSON.stringify(
        {
          success: true,
          generateType,
          results,
          sourceMap, // Map of all IDs to Cloudinary URLs
          summary: {
            totalPanels: panels.length,
            successfulPanels,
            failedPanels,
          }
        },
        null,
        2
      );
    } catch (error) {
      console.error('❌ Leonardo image generation failed:', error.message);
      return JSON.stringify({
        success: false,
        error: `Failed to generate images: ${error.message}`,
        results: {},
      });
    }
  }
}

