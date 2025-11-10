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
      'Generates images for characters and/or panels from comic.yaml using Leonardo AI and uploads them to Cloudinary. Can generate characters, panels, or both. Returns Cloudinary URLs for all generated images.';
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
      }),
      func: async ({ generateType }) => {
        return await this.execute(generateType);
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

    const res = await axios.post(`${LEONARDO.API_URL}/generations`, body, { headers: HEADERS });
    const genId = res.data.sdGenerationJob.generationId;

    console.log(`🕓 [${prefix} ${imageNum}] Generating → ${genId}`);
    
    // Wait for generation to complete (polling)
    let imageUrl = null;
    let leonardoImageId = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 5000)); // Wait 5 seconds between polls
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
          break;
        } else if (status === 'FAILED') {
          throw new Error(`Generation failed for ${prefix} ${imageNum}`);
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          throw new Error(`Timeout waiting for generation: ${error.message}`);
        }
      }
    }

    if (!imageUrl || !leonardoImageId) {
      throw new Error(`No image returned for ${prefix} ${imageNum}`);
    }

    // Download image and upload to Cloudinary
    const imageData = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageData.data);
    const publicId = `${prefix}_${imageNum}`;
    const uploaded = await uploadBuffer(buffer, publicId, folder);
    console.log(`☁️ Uploaded ${prefix} ${imageNum} → ${uploaded.secure_url}`);

    return {
      number: imageNum,
      leonardoId: leonardoImageId,
      cloudinaryUrl: uploaded.secure_url,
    };
  }

  /**
   * Execute image generation
   */
  async execute(generateType = 'both') {
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
                    // Try direct lookup in contextMap
                    if (contextMap[key]) {
                      return contextMap[key];
                    }
                    return null;
                  })
                  .filter(Boolean);
              }

              // Optional: if no context images specified and not first panel, use previous panel
              if (contextImages.length === 0 && i > 0) {
                const prevPanel = results.panels[i - 1];
                if (prevPanel && prevPanel.leonardoId) {
                  contextImages = [{ type: 'GENERATED', id: prevPanel.leonardoId }];
                }
              }

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

              // Small delay between generations
              if (i < panels.length - 1) {
                await new Promise((r) => setTimeout(r, 10000));
              }
            } catch (error) {
              console.error(`❌ Failed to generate panel ${panelId}:`, error.message);
              results.panels.push({
                id: panelId,
                error: error.message,
              });
            }
          }
        }
      }

      console.log('✅ All image generation completed!');
      console.table([
        ...results.characters.map((r) => ({ type: 'Character', id: r.id, url: r.url || r.error })),
        ...results.panels.map((r) => ({ type: 'Panel', id: r.id, url: r.url || r.error })),
      ]);

      return JSON.stringify(
        {
          success: true,
          generateType,
          results,
          sourceMap, // Map of all IDs to Cloudinary URLs
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

