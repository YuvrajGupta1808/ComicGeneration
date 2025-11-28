import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Panel Generation Tool for LangChain
 * Uses Gemini to generate full panel descriptions, camera angles, and context images.
 */
export class PanelGenerationLangChainTool {
  constructor() {
    this.name = 'generate_panels';
    this.description =
      'Uses Gemini to generate detailed panel descriptions, camera angles, and context images for each panel in a comic layout.';

    this.config = this.loadPanelConfig();
  }

  /** ───────────────────────────────────────────────
   *  Load panel configuration (prompt modifiers etc.)
   *  ─────────────────────────────────────────────── */
  loadPanelConfig() {
    try {
      const configPath = path.join(__dirname, '../../config/panels.yaml');
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        const parsed = yaml.parse(configFile);
        return parsed.panel_config || {};
      }
    } catch (error) {
      console.warn('⚠️  Failed to load panel config:', error.message);
    }

    return {
      fixed_prompt_elements: ['comic book style', 'high quality', 'detailed'],
      template: { fields: ['panelid', 'description', 'cameraAngle', 'contextImages'] },
    };
  }

  /** ───────────────────────────────────────────────
   *  Load layouts.yaml
   *  ─────────────────────────────────────────────── */
  loadLayouts() {
    try {
      const layoutsPath = path.join(__dirname, '../../config/layouts.yaml');
      if (fs.existsSync(layoutsPath)) {
        const layoutsFile = fs.readFileSync(layoutsPath, 'utf8');
        const parsed = yaml.parse(layoutsFile);
        return parsed.layouts || {};
      }
    } catch (error) {
      console.warn('⚠️  Failed to load layouts:', error.message);
    }
    return {};
  }

  /** ───────────────────────────────────────────────
   *  Get hardcoded camera angles for each page layout
   *  ─────────────────────────────────────────────── */
  getHardcodedCameraAngles(pageCount) {
    const cameraAngleMap = {
      3: [
        'establishing-shot',  // panel1
        'medium-shot',        // panel2
        'close-up',           // panel3
        'two-shot',           // panel4
        'over-shoulder',      // panel5
        'low-angle',          // panel6
        'high-angle',         // panel7
        'wide-shot'           // panel8
      ],
      4: [
        'establishing-shot',  // panel1
        'medium-shot',        // panel2
        'close-up',           // panel3
        'two-shot',           // panel4
        'over-shoulder',      // panel5
        'low-angle',          // panel6
        'high-angle',         // panel7
        'dutch-angle',        // panel8
        'medium-shot',        // panel9
        'close-up',           // panel10
        'wide-shot',          // panel11
        'bird-eye-view'       // panel12
      ],
      5: [
        'establishing-shot',  // panel1
        'medium-shot',        // panel2
        'close-up',           // panel3
        'two-shot',           // panel4
        'over-shoulder',      // panel5
        'low-angle',          // panel6
        'high-angle',         // panel7
        'dutch-angle',        // panel8
        'medium-shot',        // panel9
        'close-up',           // panel10
        'wide-shot',          // panel11
        'bird-eye-view',      // panel12
        'low-angle',          // panel13
        'wide-shot'           // panel14
      ]
    };

    return cameraAngleMap[pageCount] || cameraAngleMap[3];
  }

  /** ───────────────────────────────────────────────
   *  Define LangChain Tool schema + handler
   *  ─────────────────────────────────────────────── */
  getTool() {
    return new DynamicStructuredTool({
      name: this.name,
      description: this.description,
      schema: z.object({
        storyContext: z.string().describe('Brief story or plot for panel generation'),
        genre: z.string().optional().describe('Comic genre (sci-fi, fantasy, etc.)'),
        pageCount: z.number().int().min(1).max(5).default(3),
      }),
      func: async ({ storyContext, genre, pageCount }) =>
        await this.execute(storyContext, genre, pageCount),
    });
  }

  /** ───────────────────────────────────────────────
   *  Execute: call Gemini to generate panel data
   *  ─────────────────────────────────────────────── */
  async execute(storyContext = '', genre = '', pageCount = 3) {
    try {
      const layouts = this.loadLayouts();
      const layoutKey =
        pageCount === 3
          ? 'three-page-story'
          : pageCount === 4
          ? 'four-page-story'
          : 'five-page-story';
      const selectedLayout = layouts[layoutKey];

      if (!selectedLayout) {
        return JSON.stringify({
          success: false,
          error: `Layout not found for ${pageCount} pages`,
          panels: [],
        });
      }

      const panelsPerPage = selectedLayout.panels_per_page || [];
      const totalPanels = panelsPerPage.reduce((sum, c) => sum + c, 0);

      // Get hardcoded camera angles for this layout
      const cameraAngles = this.getHardcodedCameraAngles(pageCount);

      console.log(`🧠  Calling Gemini to generate ${totalPanels} panels...`);

      const llm = new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash-lite',
        apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
        temperature: 0.9, // Higher temperature for more creative, detailed descriptions
      });

      const prompt = `
You are an expert Comic Panel Creator and Visual Storyteller. Create highly detailed, cinematic panel descriptions that bring the story to life.

STORY CONTEXT:
"${storyContext}"
Genre: ${genre || 'general fiction'}
Layout: ${pageCount}-page comic with ${totalPanels} total panels
Panels per page: ${panelsPerPage.join(', ')}

INSTRUCTIONS FOR EACH PANEL:
Create a vivid, detailed description (3-5 sentences) that includes:

1. VISUAL COMPOSITION:
   - What we see in the foreground, middle ground, and background
   - Spatial relationships between characters/objects
   - Framing and composition elements

2. ATMOSPHERE & MOOD:
   - Lighting conditions (harsh shadows, soft glow, neon, natural light, etc.)
   - Color palette and mood (warm, cold, vibrant, muted, etc.)
   - Emotional tone and atmosphere

3. CHARACTER DETAILS:
   - Facial expressions, body language, and poses
   - Clothing, appearance, and physical details
   - What characters are doing and their emotions

4. ENVIRONMENT & SETTING:
   - Detailed environment descriptions
   - Weather, time of day, architectural details
   - Background elements that add depth

5. ACTION & DYNAMICS:
   - Movement, motion, and action
   - Visual flow and pacing
   - Tension, energy, or stillness

6. CINEMATIC DETAILS:
   - Textures, surfaces, materials
   - Depth of field effects
   - Visual effects or stylistic elements

CAMERA ANGLES - **CRITICAL: You MUST use these EXACT camera angles in this EXACT order for each panel:**

${cameraAngles.map((angle, idx) => `panel${idx + 1}: ${angle}`).join('\n')}

**DO NOT choose or invent camera angles. Use ONLY the angles listed above in the exact order shown.**
**Each panel MUST use the camera angle assigned to it. This is non-negotiable.**

CONTEXT IMAGES - For visual continuity and consistency:
**CRITICAL RULES:**
1. **panel1 MUST include both characters**: ["char_1", "char_2"] - this is mandatory
2. **Subsequent panels** (panel2, panel3, etc.) should reference:
   - Previous generated panels: "panel_1", "panel_2", "panel_3", etc. (for visual continuity)
   - Characters as needed: "char_1", "char_2"
   - Include the most relevant previous panel(s) to maintain visual flow
   - No more than 4 context images per panel
3. **Context images reference previously generated panels** to ensure consistent art style and visual continuity

OUTPUT FORMAT - Return ONLY valid JSON array:
Each panel must follow this structure, using the camera angle assigned to it:

**panel1 example (MUST have char_1 and char_2):**
{
  "panelid": "panel1",
  "description": "A detailed 3-5 sentence description with all visual elements, atmosphere, lighting, character details, and cinematic qualities.",
  "cameraAngle": "${cameraAngles[0]}",
  "contextImages": ["char_1", "char_2"]
}

**panel2+ example (reference previous panels):**
{
  "panelid": "panel2",
  "description": "Another detailed description...",
  "cameraAngle": "${cameraAngles[1]}",
  "contextImages": ["panel_1", "char_1"]
}

Generate all ${totalPanels} panels with camera angles in this exact order:
${cameraAngles.map((angle, idx) => `- panel${idx + 1}: must use "${angle}"`).join('\n')}

CRITICAL REQUIREMENTS:
✓ Each description must be 3-5 detailed sentences minimum
✓ Include specific lighting, colors, textures, and atmosphere
✓ Describe character emotions, expressions, and body language clearly
✓ **MANDATORY: Use the exact camera angle assigned to each panel (listed above) - DO NOT change them**
✓ **MANDATORY: panel1 contextImages MUST be ["char_1", "char_2"] - no exceptions**
✓ **panel2+ should include previous panel references (e.g., ["panel_1", "char_1"]) for visual continuity**
✓ Build narrative flow between panels
✓ Make descriptions vivid enough that an artist could draw them
✓ Output ONLY the JSON array, no markdown, no code blocks, no explanations
✓ Ensure all ${totalPanels} panels are included in the array
✓ Panel camera angles must match exactly: ${cameraAngles.join(', ')}
`;

      const response = await llm.invoke(prompt);
      let text = response?.content?.trim() || response?.text?.trim() || '';

      // Try multiple parsing strategies
      let panels = [];
      
      // Strategy 1: Extract JSON from code blocks (```json ... ```)
      try {
        const codeBlockMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (codeBlockMatch) {
          panels = JSON.parse(codeBlockMatch[1]);
        }
      } catch (e) {
        // Continue to next strategy
      }

      // Strategy 2: Find JSON array in text
      if (panels.length === 0) {
        try {
          const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            panels = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          // Continue to next strategy
        }
      }

      // Strategy 3: Try parsing entire response as JSON
      if (panels.length === 0) {
        try {
          const parsed = JSON.parse(text.trim());
          if (Array.isArray(parsed)) {
            panels = parsed;
          } else if (parsed.panels && Array.isArray(parsed.panels)) {
            panels = parsed.panels;
          }
        } catch (e) {
          // Continue to fallback
        }
      }

      // Validate and clean panels - enforce hardcoded camera angles and context images
      if (panels.length > 0) {
        panels = panels
          .filter(p => p && typeof p === 'object')
          .map((p, index) => {
            let contextImages = Array.isArray(p.contextImages) ? p.contextImages : [];
            
            // Enforce panel1 must have char_1 and char_2
            if (index === 0) {
              // Ensure char_1 and char_2 are present (don't duplicate if already there)
              if (!contextImages.includes('char_1')) contextImages.push('char_1');
              if (!contextImages.includes('char_2')) contextImages.push('char_2');
            } else {
              // For subsequent panels, reference the immediately previous panel
              const prevPanelRef = `panel_${index}`; // panel_1 for panel2, panel_2 for panel3, etc.
              if (!contextImages.some(img => img === prevPanelRef)) {
                // Add reference to previous panel at the beginning for priority
                contextImages.unshift(prevPanelRef);
              }
            }
            
            return {
              panelid: p.panelid || `panel_${index + 1}`,
              description: (p.description || '').trim(),
              // Force correct camera angle based on position
              cameraAngle: cameraAngles[index] || p.cameraAngle || 'medium-shot',
              contextImages: contextImages
            };
          })
          .filter(p => p.description.length > 0);
        
        // Ensure all panels have correct camera angles
        if (panels.length !== cameraAngles.length) {
          console.warn(`⚠️  Panel count mismatch: expected ${cameraAngles.length}, got ${panels.length}`);
        }
        
        // Log context images for panel1
        if (panels[0] && (!panels[0].contextImages.includes('char_1') || !panels[0].contextImages.includes('char_2'))) {
          console.warn('⚠️  panel1 missing char_1 or char_2, enforcing...');
        }
      }

      if (panels.length === 0) {
        console.warn('⚠️  Failed to parse valid panels from Gemini response');
        console.warn('Raw response:', text.substring(0, 200) + '...');
      }

      // Save to comic.yaml (characters + panels with full data)
      if (panels.length > 0) {
        await this.saveComicYaml(panels, pageCount);
        // Clean panels.yaml to remove panels data (keep only config)
        await this.cleanPanelsYaml();
      } else {
        console.error('❌ No valid panels generated, cannot save to YAML');
        return JSON.stringify({
          success: false,
          error: 'Failed to generate valid panel descriptions from LLM',
          rawResponse: text.substring(0, 500),
          panels: []
        });
      }

      return JSON.stringify(
        {
          success: true,
          totalPanels,
          model: 'gemini-2.5-flash-lite',
          panels: panels.length > 0 ? panels : text,
        },
        null,
        2
      );
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Panel generation failed: ${error.message}`,
        panels: [],
      });
    }
  }

  /** ───────────────────────────────────────────────
   *  Get panel dimensions from layouts.yaml
   *  ─────────────────────────────────────────────── */
  getPanelDimensions(panelId, pageCount) {
    try {
      const layouts = this.loadLayouts();
      const layoutKey = pageCount === 3 ? 'three-page-story' :
                        pageCount === 4 ? 'four-page-story' :
                        'five-page-story';
      const selectedLayout = layouts[layoutKey];
      
      if (!selectedLayout || !selectedLayout.layouts) {
        return { width: 832, height: 1248 }; // Default fallback
      }

      // Search through all pages for the panel
      for (const [pageKey, pagePanels] of Object.entries(selectedLayout.layouts)) {
        if (Array.isArray(pagePanels)) {
          const panel = pagePanels.find(p => p.id === panelId);
          if (panel) {
            return {
              width: panel.width || 832,
              height: panel.height || 1248
            };
          }
        }
      }

      return { width: 832, height: 1248 }; // Default fallback
    } catch (error) {
      console.warn(`Failed to get dimensions for ${panelId}:`, error.message);
      return { width: 832, height: 1248 };
    }
  }

  /** ───────────────────────────────────────────────
   *  Generate prompt from panel description and camera angle
   *  ─────────────────────────────────────────────── */
  generatePanelPrompt(description, cameraAngle) {
    const fixedElements = this.config.fixed_prompt_elements.join(', ');
    return `${description}, ${cameraAngle} camera angle, ${fixedElements}`;
  }

  /** ───────────────────────────────────────────────
   *  Save to comic.yaml (characters + panels with full data)
   *  ─────────────────────────────────────────────── */
  async saveComicYaml(panels, pageCount) {
    try {
      const comicPath = path.join(__dirname, '../../config/comic.yaml');
      
      // Load characters from characters.yaml or existing comic.yaml
      let characters = [];
      let charConfig = {
        image_specs: { width: 832, height: 1248 },
        fixed_prompt_elements: ['full body pose, center, white background, comic book style']
      };
      
      // First try to load from characters.yaml
      try {
        const charPath = path.join(__dirname, '../../config/characters.yaml');
        if (fs.existsSync(charPath)) {
          const charFile = fs.readFileSync(charPath, 'utf8');
          const parsed = yaml.parse(charFile);
          
          if (parsed.character_config) {
            charConfig = {
              image_specs: parsed.character_config.image_specs || charConfig.image_specs,
              fixed_prompt_elements: parsed.character_config.fixed_prompt_elements || charConfig.fixed_prompt_elements
            };
          }
          
          if (parsed.characters && Array.isArray(parsed.characters) && parsed.characters.length > 0) {
            characters = parsed.characters;
          }
        }
      } catch (e) {
        console.warn('Could not load characters from characters.yaml:', e.message);
      }

      // If no characters found, try to load from existing comic.yaml
      if (characters.length === 0) {
        try {
          const comicPath = path.join(__dirname, '../../config/comic.yaml');
          if (fs.existsSync(comicPath)) {
            const comicFile = fs.readFileSync(comicPath, 'utf8');
            const parsed = yaml.parse(comicFile);
            
            if (parsed.characters && Array.isArray(parsed.characters) && parsed.characters.length > 0) {
              // Extract character data from comic.yaml format (preserve all fields)
              characters = parsed.characters.map(char => ({
                id: char.id,
                name: char.name || char.id,
                description: char.description || '',
                width: char.width,
                height: char.height,
                contextImages: char.contextImages,
                prompt: char.prompt
              })).filter(c => c.description.length > 0);
            }
          }
        } catch (e) {
          console.warn('Could not load characters from comic.yaml:', e.message);
        }
      }

      // Format characters with: id, width, height, description, contextImages, prompt
      const formattedCharacters = characters.map((char, index) => {
        const charId = char.id || `char_${index + 1}`;
        const description = char.description || '';
        const prompt = `${description}, ${charConfig.fixed_prompt_elements.join(', ')}`;
        
        // If character already has prompt/width/height (from comic.yaml), preserve them
        return {
          id: charId,
          width: char.width || charConfig.image_specs.width || 832,
          height: char.height || charConfig.image_specs.height || 1248,
          description: description,
          contextImages: char.contextImages || [],
          prompt: char.prompt || prompt
        };
      });

      // Format panels with: id, width, height, description, contextImages, prompt
      const formattedPanels = panels.map((panel) => {
        const dimensions = this.getPanelDimensions(panel.panelid, pageCount);
        const prompt = this.generatePanelPrompt(panel.description, panel.cameraAngle);
        
        // Limit context images to max 4
        let contextImages = Array.isArray(panel.contextImages) ? panel.contextImages : [];
        if (contextImages.length > 4) {
          contextImages = contextImages.slice(0, 4);
        }
        
        return {
          id: panel.panelid,
          width: dimensions.width,
          height: dimensions.height,
          description: panel.description,
          contextImages: contextImages,
          prompt: prompt
        };
      });

      const comicData = {
        characters: formattedCharacters,
        panels: formattedPanels
      };
      
      const yamlContent = yaml.stringify(comicData, {
        indent: 2,
        lineWidth: 120,
        simpleKeys: false
      });
      
      await fs.writeFile(comicPath, yamlContent, 'utf8');
      console.log(`✓ Saved ${formattedPanels.length} panels to comic.yaml`);
    } catch (error) {
      console.error('Failed to save comic.yaml:', error.message);
      throw error;
    }
  }

  /** ───────────────────────────────────────────────
   *  Clean panels.yaml (remove panels, keep only config)
   *  ─────────────────────────────────────────────── */
  async cleanPanelsYaml() {
    try {
      const configPath = path.join(__dirname, '../../config/panels.yaml');
      
      // Preserve existing panel_config if it exists
      let existingConfig = {};
      try {
        if (fs.existsSync(configPath)) {
          const existingFile = fs.readFileSync(configPath, 'utf8');
          existingConfig = yaml.parse(existingFile) || {};
        }
      } catch (e) {
        // Ignore if file doesn't exist or can't be parsed
      }

      const panelConfig = {
        panel_config: existingConfig.panel_config || this.config
      };
      
      const yamlContent = yaml.stringify(panelConfig, {
        indent: 2,
        lineWidth: 120,
        simpleKeys: false
      });
      
      await fs.writeFile(configPath, yamlContent, 'utf8');
    } catch (error) {
      console.error('Failed to clean panels.yaml:', error.message);
      // Don't throw - this is cleanup
    }
  }
}