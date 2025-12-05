import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { z } from 'zod';
import prisma from '../db/client.js';
import comicService from '../services/comic-service.js';

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
        projectId: z.string().optional().describe('Project ID (if not provided, creates new project)'),
        storyContext: z.string().describe('Brief story or plot for panel generation'),
        genre: z.string().optional().describe('Comic genre (sci-fi, fantasy, etc.)'),
        pageCount: z.number().int().min(1).max(5).default(3),
      }),
      func: async ({ projectId, storyContext, genre, pageCount }) =>
        await this.execute(projectId, storyContext, genre, pageCount),
    });
  }

  /** ───────────────────────────────────────────────
   *  Execute: call Gemini to generate panel data
   *  ─────────────────────────────────────────────── */
  async execute(projectId = null, storyContext = '', genre = '', pageCount = 3) {
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

      // Save to database
      if (panels.length > 0) {
        // Create or get project
        if (!projectId) {
          const userId = await this.getDefaultUserId();
          const project = await comicService.createProject(userId, {
            title: 'New Comic Project',
            genre: genre || null,
            storyContext: storyContext,
            pageCount: pageCount
          });
          projectId = project.id;
          console.log(`✓ Created new project: ${projectId}`);
        }
        
        await this.savePanelsToDatabase(projectId, panels, pageCount);
      } else {
        console.error('❌ No valid panels generated, cannot save');
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
          projectId: projectId,
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
   *  Get default user ID (for CLI usage)
   *  ─────────────────────────────────────────────── */
  async getDefaultUserId() {
    const user = await prisma.user.findFirst({
      where: { email: 'admin@comic-backend.local' }
    });
    return user?.id || (await prisma.user.create({
      data: {
        email: 'admin@comic-backend.local',
        passwordHash: 'temp',
        name: 'Admin User'
      }
    })).id;
  }

  /** ───────────────────────────────────────────────
   *  Save panels to database
   *  ─────────────────────────────────────────────── */
  async savePanelsToDatabase(projectId, panels, pageCount) {
    try {
      const formattedPanels = panels.map((panel, index) => {
        const dimensions = this.getPanelDimensions(panel.panelid, pageCount);
        const prompt = this.generatePanelPrompt(panel.description, panel.cameraAngle);
        
        return {
          panelId: panel.panelid,
          pageNumber: this.getPageNumber(index, pageCount),
          panelNumber: this.getPanelNumberOnPage(index, pageCount),
          description: panel.description,
          prompt: prompt,
          cameraAngle: panel.cameraAngle,
          width: dimensions.width,
          height: dimensions.height,
          contextImages: panel.contextImages || []
        };
      });

      await comicService.savePanels(projectId, formattedPanels);
      console.log(`✓ Saved ${formattedPanels.length} panels to database (project: ${projectId})`);
    } catch (error) {
      console.error('Failed to save panels to database:', error.message);
      throw error;
    }
  }

  /** ───────────────────────────────────────────────
   *  Get page number for panel index
   *  ─────────────────────────────────────────────── */
  getPageNumber(panelIndex, pageCount) {
    const panelsPerPage = pageCount === 3 ? [3, 3, 2] : pageCount === 4 ? [3, 3, 3, 3] : [3, 3, 3, 3, 2];
    let currentPanelCount = 0;
    
    for (let p = 0; p < panelsPerPage.length; p++) {
      if (panelIndex < currentPanelCount + panelsPerPage[p]) {
        return p + 1;
      }
      currentPanelCount += panelsPerPage[p];
    }
    return 1;
  }

  /** ───────────────────────────────────────────────
   *  Get panel number on its page
   *  ─────────────────────────────────────────────── */
  getPanelNumberOnPage(panelIndex, pageCount) {
    const panelsPerPage = pageCount === 3 ? [3, 3, 2] : pageCount === 4 ? [3, 3, 3, 3] : [3, 3, 3, 3, 2];
    let currentPanelCount = 0;
    
    for (let p = 0; p < panelsPerPage.length; p++) {
      if (panelIndex < currentPanelCount + panelsPerPage[p]) {
        return panelIndex - currentPanelCount + 1;
      }
      currentPanelCount += panelsPerPage[p];
    }
    return 1;
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


}