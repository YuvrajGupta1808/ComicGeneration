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
 * Dialogue Generation Tool for LangChain
 * Uses Gemini to generate dialogue, narration, and titles based on character and panel descriptions.
 */
export class DialogueGenerationLangChainTool {
  constructor() {
    this.name = 'generate_dialogue';
    this.description =
      'Uses Gemini to generate dialogue, narration, and titles for comic panels based on character descriptions and panel visuals. First page is a cover page with a title.';
    
    this.config = this.loadDialogueConfig();
  }

  /** ───────────────────────────────────────────────
   *  Load dialogue configuration
   *  ─────────────────────────────────────────────── */
  loadDialogueConfig() {
    try {
      const configPath = path.join(__dirname, '../../config/dialogue.yaml');
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        const parsed = yaml.parse(configFile);
        return parsed.dialogue_config || {};
      }
    } catch (error) {
      console.warn('⚠️  Failed to load dialogue config:', error.message);
    }

    return {
      template: {
        fields: ['title', 'dialogue', 'narration']
      },
      cover_page: {
        panel_id: 'panel1',
        has_title: true,
        has_dialogue: false
      }
    };
  }

  /** ───────────────────────────────────────────────
   *  Load comic.yaml (characters + panels)
   *  ─────────────────────────────────────────────── */
  loadComicData() {
    try {
      const comicPath = path.join(__dirname, '../../config/comic.yaml');
      if (fs.existsSync(comicPath)) {
        const comicFile = fs.readFileSync(comicPath, 'utf8');
        const parsed = yaml.parse(comicFile);
        return {
          characters: parsed.characters || [],
          panels: parsed.panels || []
        };
      }
    } catch (error) {
      console.warn('⚠️  Failed to load comic.yaml:', error.message);
    }
    return { characters: [], panels: [] };
  }

  /** ───────────────────────────────────────────────
   *  Define LangChain Tool schema + handler
   *  ─────────────────────────────────────────────── */
  getTool() {
    return new DynamicStructuredTool({
      name: this.name,
      description: this.description,
      schema: z.object({
        genre: z.string().optional().describe('Comic genre (sci-fi, fantasy, etc.)'),
        tone: z.string().optional().describe('Tone of dialogue (dramatic, humorous, dark, etc.)'),
        storyContext: z.string().optional().describe('Additional story context for dialogue generation')
      }),
      func: async ({ genre, tone, storyContext }) =>
        await this.execute(genre, tone, storyContext),
    });
  }

  /** ───────────────────────────────────────────────
   *  Execute: call Gemini to generate dialogue
   *  ─────────────────────────────────────────────── */
  async execute(genre = 'general fiction', tone = 'dramatic', storyContext = '') {
    try {
      const { characters, panels } = this.loadComicData();

      if (characters.length === 0 || panels.length === 0) {
        return JSON.stringify({
          success: false,
          error: 'No characters or panels found in comic.yaml. Generate characters and panels first.',
          dialogue: []
        });
      }

      console.log(`🧠  Calling Gemini to generate dialogue for ${panels.length} panels...`);

      const llm = new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash-lite',
        apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 4096,
      });

      // Format character info for prompt
      const characterInfo = characters.map((char, idx) => 
        `${char.id} (${char.name || `Character ${idx + 1}`}): ${char.description}`
      ).join('\n\n');

      // Format panel info for prompt
      const panelInfo = panels.map((panel, idx) => 
        `${panel.id}: ${panel.description}`
      ).join('\n\n');

      // Build story sequence for temporal context
      const storySequence = panels.map((panel, idx) => 
        `Panel ${idx + 1}: ${panel.description}`
      ).join('\n\n');

      const prompt = `
You are a DUAL-ROLE expert:
1. **Cinematic Screenwriter** — You craft dialogue that reveals character, emotion, and tension through subtext.
2. **Comic Book Dialogue Specialist** — You understand visual storytelling, pacing, and the power of silence.

Your mission: Generate emotionally authentic, cinematic dialogue, narration, and titles for comic panels while respecting visual pacing and minimal text constraints.

GENRE: ${genre}
TONE: ${tone}
${storyContext ? `STORY CONTEXT: ${storyContext}` : ''}

CHARACTERS:
${characterInfo}

STORY SEQUENCE (Panel Flow — read carefully):
${storySequence}

---

### INSTRUCTIONS

#### **COVER PAGE (panel1)**
- Panel1 is the **COVER PAGE**
- Generate a **dramatic title** (3–5 words) that captures the essence of the story.
- NO dialogue or narration on the cover.
- The title must set tone and theme.

#### **SUBSEQUENT PANELS (panel2+)**
Follow these principles carefully to produce cinematic comic dialogue:

---

### 🎭 DIALOGUE RULES
1. Maximum **2 dialogue lines per panel** (prefer 1 line for rhythm and focus).
2. Use **only existing character IDs**: ${characters.map(c => c.id).join(', ')}
3. **Do NOT invent** new characters or identifiers.
4. Each line length varies by emotional intensity:
   - **Normal moments**: 8–10 words (quick, natural)
   - **Tension/emotion peaks**: 10–14 words (let the thought breathe)
   - Make each line feel like **a thought in motion**, not a sound bite
5. Let visuals carry part of the meaning — avoid over-explaining.
6. Use pauses, fragments, and natural speech patterns (“…”, “—”, “yeah,” “no.”) when fitting.
7. Vary tone — mix quiet tension, revelation, and emotional payoff across panels.

---

### 📜 NARRATION RULES
1. Use **either dialogue OR narration**, never both in the same panel.
2. Only **1 narration box** per panel (max 15 words).
3. Narration is used for **scene transitions, emotion, or inner thoughts** — not exposition.
4. Keep narration poetic, cinematic, and concise.

---


### ⚖️ BALANCE & PACING
1. Some panels must remain **silent** for dramatic weight.
2. Use **contrast** — dialogue-heavy → silent → narration → dialogue.
3. Maintain clear emotional escalation:
   - **Panel 1–2:** Setup / mystery
   - **Panel 3–5:** Conflict / discovery
   - **Panel 6–8:** Climax / resolution / quiet release

---

### 💬 QUALITY EXAMPLES

✅ **GOOD (Subtext & Emotion)**
Panel 2:
{
  "dialogue": [
    {"speaker": "char_1", "text": "You said it was cargo. Why does it breathe?"}
  ]
}

Panel 3:
{
  "dialogue": [
    {"speaker": "char_2", "text": "Some things aren't meant to be opened."}
  ]
}

Panel 5:
{
  "dialogue": [
    {"speaker": "char_1", "text": "Hold on. I’m not leaving you here."}
  ]
}

❌ **BAD (Flat or Expository)**
Panel 2:
{
  "dialogue": [
    {"speaker": "char_1", "text": "Tell me more about this situation."}
  ]
}

Panel 3:
{
  "dialogue": [
    {"speaker": "char_2", "text": "I will explain everything now."}
  ]
}

---

### 🎬 CINEMATIC EXPECTATIONS
✓ Dialogue should **imply** relationships and internal states, not describe them.  
✓ Let **subtext and silence** reveal character emotion.  
✓ Match the **${tone}** tone but vary intensity per panel.  
✓ Every panel should push the story forward — no filler lines.  
✓ Avoid repetition — give each speaker a unique rhythm.  

---

### 🎨 OUTPUT FORMAT
Return ONLY a **valid JSON array** — no Markdown, no prose.

Each entry:
{
  "panelId": "panelX",
  "title": "string or null",
  "dialogue": [{"speaker": "char_id", "text": "short cinematic line"}],
  "narration": "string or null"
}

---

Generate dialogue for all ${panels.length} panels now.
Ensure emotional flow and cinematic rhythm across the story.
Output ONLY the JSON array.
`;

      const response = await llm.invoke(prompt);
      let text = response?.content?.trim() || response?.text?.trim() || '';

      // Parse response
      let dialogueData = [];
      
      // Strategy 1: Extract JSON from code blocks
      try {
        const codeBlockMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (codeBlockMatch) {
          dialogueData = JSON.parse(codeBlockMatch[1]);
        }
      } catch (e) {
        // Continue to next strategy
      }

      // Strategy 2: Find JSON array in text
      if (dialogueData.length === 0) {
        try {
          const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            dialogueData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          // Continue to next strategy
        }
      }

      // Strategy 3: Try parsing entire response as JSON
      if (dialogueData.length === 0) {
        try {
          const parsed = JSON.parse(text.trim());
          if (Array.isArray(parsed)) {
            dialogueData = parsed;
          } else if (parsed.dialogue && Array.isArray(parsed.dialogue)) {
            dialogueData = parsed.dialogue;
          }
        } catch (e) {
          // Continue to fallback
        }
      }

      // Validate and clean dialogue data
      if (dialogueData.length > 0) {
        dialogueData = dialogueData
          .filter(d => d && typeof d === 'object')
          .map((d, index) => ({
            panelId: d.panelId || panels[index]?.id || `panel${index + 1}`,
            title: d.title || null,
            dialogue: Array.isArray(d.dialogue) ? d.dialogue.filter(line => 
              line && line.speaker && line.text
            ) : [],
            narration: d.narration || null
          }));

        // Ensure panel1 has title and no dialogue
        if (dialogueData[0]) {
          if (!dialogueData[0].title) {
            dialogueData[0].title = "Untitled Comic";
          }
          dialogueData[0].dialogue = [];
          dialogueData[0].narration = null;
        }
      }

      if (dialogueData.length === 0) {
        console.warn('⚠️  Failed to parse valid dialogue from Gemini response');
        console.warn('Raw response:', text.substring(0, 200) + '...');
        return JSON.stringify({
          success: false,
          error: 'Failed to generate valid dialogue from LLM',
          rawResponse: text.substring(0, 500),
          dialogue: []
        });
      }

      // Save to comic.yaml (merge with existing panels)
      await this.saveDialogueToComicYaml(dialogueData);

      return JSON.stringify(
        {
          success: true,
          totalPanels: dialogueData.length,
          model: 'gemini-2.5-flash-lite',
          dialogue: dialogueData
        },
        null,
        2
      );
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Dialogue generation failed: ${error.message}`,
        dialogue: []
      });
    }
  }

  /** ───────────────────────────────────────────────
   *  Save dialogue to comic.yaml (merge with existing panels)
   *  ─────────────────────────────────────────────── */
  async saveDialogueToComicYaml(dialogueData) {
    try {
      const comicPath = path.join(__dirname, '../../config/comic.yaml');
      
      // Load existing comic.yaml
      let comicData = { characters: [], panels: [] };
      if (fs.existsSync(comicPath)) {
        const comicFile = fs.readFileSync(comicPath, 'utf8');
        comicData = yaml.parse(comicFile) || comicData;
      }

      // Merge dialogue data into panels
      if (comicData.panels && Array.isArray(comicData.panels)) {
        comicData.panels = comicData.panels.map(panel => {
          // Find matching dialogue for this panel
          const dialogue = dialogueData.find(d => d.panelId === panel.id);
          
          if (dialogue) {
            return {
              ...panel,
              title: dialogue.title || null,
              dialogue: dialogue.dialogue || [],
              narration: dialogue.narration || null
            };
          }
          
          return panel;
        });
      }

      // Save updated comic.yaml
      const yamlContent = yaml.stringify(comicData, {
        indent: 2,
        lineWidth: 120,
        simpleKeys: false
      });
      
      await fs.writeFile(comicPath, yamlContent, 'utf8');
      console.log(`✓ Added dialogue to ${dialogueData.length} panels in comic.yaml`);
    } catch (error) {
      console.error('Failed to save dialogue to comic.yaml:', error.message);
      throw error;
    }
  }
}
