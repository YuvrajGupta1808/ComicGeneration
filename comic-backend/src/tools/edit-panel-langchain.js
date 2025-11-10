import { DynamicStructuredTool } from '@langchain/core/tools';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Edit Panel Tool for LangChain
 * Allows editing specific fields of panels or characters in comic.yaml
 */
export class EditPanelLangChainTool {
  constructor() {
    this.name = 'edit_panel';
    this.description =
      'Edit specific fields of a panel or character in comic.yaml. Can update description, dialogue, narration, title, or any other field.';
  }

  /** ───────────────────────────────────────────────
   *  Define LangChain Tool schema + handler
   *  ─────────────────────────────────────────────── */
  getTool() {
    return new DynamicStructuredTool({
      name: this.name,
      description: this.description,
      schema: z.object({
        targetType: z.enum(['panel', 'character']).describe('Type of target to edit: "panel" or "character"'),
        targetId: z.string().describe('ID of the panel or character to edit (e.g., "panel1", "char_1")'),
        field: z.string().describe('Field to edit (e.g., "description", "dialogue", "narration", "title", "soundEffects")'),
        value: z.union([z.string(), z.array(z.any()), z.null()]).describe('New value for the field. Can be string, array, or null'),
      }),
      func: async ({ targetType, targetId, field, value }) =>
        await this.execute(targetType, targetId, field, value),
    });
  }

  /** ───────────────────────────────────────────────
   *  Execute: edit a specific field in comic.yaml
   *  ─────────────────────────────────────────────── */
  async execute(targetType, targetId, field, value) {
    try {
      const comicPath = path.join(__dirname, '../../config/comic.yaml');
      
      // Load existing comic.yaml
      if (!fs.existsSync(comicPath)) {
        return JSON.stringify({
          success: false,
          error: 'comic.yaml not found. Generate panels and characters first.',
        });
      }

      const comicFile = fs.readFileSync(comicPath, 'utf8');
      const comicData = yaml.parse(comicFile);

      if (!comicData) {
        return JSON.stringify({
          success: false,
          error: 'Failed to parse comic.yaml',
        });
      }

      // Find and update the target
      let found = false;
      let oldValue = null;

      if (targetType === 'panel') {
        if (!comicData.panels || !Array.isArray(comicData.panels)) {
          return JSON.stringify({
            success: false,
            error: 'No panels found in comic.yaml',
          });
        }

        const panelIndex = comicData.panels.findIndex(p => p.id === targetId);
        if (panelIndex === -1) {
          return JSON.stringify({
            success: false,
            error: `Panel "${targetId}" not found`,
            availablePanels: comicData.panels.map(p => p.id),
          });
        }

        oldValue = comicData.panels[panelIndex][field];
        comicData.panels[panelIndex][field] = value;
        found = true;

        console.log(`✓ Updated ${targetId}.${field}`);
      } else if (targetType === 'character') {
        if (!comicData.characters || !Array.isArray(comicData.characters)) {
          return JSON.stringify({
            success: false,
            error: 'No characters found in comic.yaml',
          });
        }

        const charIndex = comicData.characters.findIndex(c => c.id === targetId);
        if (charIndex === -1) {
          return JSON.stringify({
            success: false,
            error: `Character "${targetId}" not found`,
            availableCharacters: comicData.characters.map(c => c.id),
          });
        }

        oldValue = comicData.characters[charIndex][field];
        comicData.characters[charIndex][field] = value;
        found = true;

        console.log(`✓ Updated ${targetId}.${field}`);
      }

      if (!found) {
        return JSON.stringify({
          success: false,
          error: `Failed to update ${targetType} "${targetId}"`,
        });
      }

      // Save updated comic.yaml
      const yamlContent = yaml.stringify(comicData, {
        indent: 2,
        lineWidth: 120,
        simpleKeys: false,
      });

      await fs.writeFile(comicPath, yamlContent, 'utf8');

      return JSON.stringify(
        {
          success: true,
          targetType,
          targetId,
          field,
          oldValue,
          newValue: value,
          message: `Successfully updated ${targetId}.${field}`,
        },
        null,
        2
      );
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Edit failed: ${error.message}`,
      });
    }
  }
}
