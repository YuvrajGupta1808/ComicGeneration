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
 * Character Generation Tool for LangChain
 * Generates character descriptions using Gemini AI with fixed image specifications
 */
export class CharacterGenerationLangChainTool {
  constructor() {
    this.name = 'generate_characters';
    this.description = 'Generates up to two character descriptions for a comic story. Each character includes a unique name and a detailed visual description suitable for image generation. Use this tool when the user requests characters for a story. The output must follow the fixed visual standards: 832x1248 size, full-body pose, centered composition, white background, comic-book style.';
    this.config = this.loadCharacterConfig();
  }

  /**
   * Load character configuration from YAML file
   * @returns {object} Character configuration
   */
  loadCharacterConfig() {
    try {
      const configPath = path.join(__dirname, '../../config/characters.yaml');
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        const parsed = yaml.parse(configFile);
        return parsed.character_config || {};
      }
    } catch (error) {
      console.warn('Failed to load character config:', error.message);
    }
    
    // Fallback defaults
    return {
      default_count: 2,
      image_specs: {
        size: "832x1248",
        width: 832,
        height: 1248
      },
      fixed_prompt_elements: ["full body pose, center, white background, comic book style"],
      template: {
        fields: ["id", "name", "description"]
      }
    };
  }

  /**
   * Get the tool definition for LangChain
   */
  getTool() {
    return new DynamicStructuredTool({
      name: this.name,
      description: this.description,
      schema: z.object({
        storyContext: z.string()
          .optional()
          .describe('Brief description of the story or genre to inform character generation'),
        genre: z.string()
          .optional()
          .describe('Genre of the comic (e.g., sci-fi, fantasy, mystery, adventure)')
      }),
      func: async ({ storyContext, genre }) => {
        return await this.execute(storyContext, genre);
      }
    });
  }

  /**
   * Load panels from comic.yaml
   */
  loadPanelsFromComic() {
    try {
      const comicPath = path.join(__dirname, '../../config/comic.yaml');
      if (fs.existsSync(comicPath)) {
        const comicFile = fs.readFileSync(comicPath, 'utf8');
        const parsed = yaml.parse(comicFile);
        return parsed.panels || [];
      }
    } catch (error) {
      console.warn('Could not load panels from comic.yaml:', error.message);
    }
    return [];
  }

  /**
   * Execute character generation based on panels
   * @param {string} storyContext - Optional story context
   * @param {string} genre - Optional genre
   * @returns {Promise<string>} JSON string with formatted character data
   */
  async execute(storyContext = '', genre = '') {
    try {
      const characterCount = this.config.default_count || 2;

      // Load panels from comic.yaml first
      const panels = this.loadPanelsFromComic();
      
      if (panels.length === 0) {
        return JSON.stringify({
          success: false,
          error: 'No panels found. Please generate panels first before generating characters.',
          characters: []
        });
      }

      console.log(`🧠  Calling Gemini to generate ${characterCount} characters based on ${panels.length} panels...`);

      const llm = new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash-lite',
        apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
        temperature: 0.9,
      });

      // Extract panel descriptions for context
      const panelDescriptions = panels.map((p, idx) => 
        `Panel ${idx + 1}: ${p.description}`
      ).join('\n');

      const prompt = `
You are a Character Creator for comics.
Generate exactly ${characterCount} unique characters based on the comic panels that have already been created.

Story Context: "${storyContext || 'general comic story'}"
Genre: ${genre || 'general fiction'}

EXISTING PANEL DESCRIPTIONS (use these to inform character creation):
${panelDescriptions}

INSTRUCTIONS:
- Analyze the panel descriptions above to identify the main characters mentioned
- Generate exactly ${characterCount} characters that appear in these panels
- Each character should be consistent with how they are described in the panels
- Extract character names and details from panel descriptions where mentioned
- If panels mention generic terms like "CHAR_1" or "Character1", create proper names and detailed descriptions

For each character, create:
- A unique, memorable name (extract from panels if mentioned)
- A detailed visual description (3-5 sentences) that includes:
  * Physical appearance (age, build, features, clothing)
  * Personality traits visible in appearance
  * Distinctive characteristics or features
  * Style and visual details that make them unique
  * Details that match how they appear in the panels

IMPORTANT: 
- Characters must be consistent with panel descriptions
- Use character IDs: char_1, char_2, etc.
- Each description should be vivid and detailed enough for image generation
- Output ONLY a JSON array in this format:

[
  {
    "id": "char_1",
    "name": "Character Name",
    "description": "Detailed 3-5 sentence visual description based on panel descriptions..."
  },
  {
    "id": "char_2",
    "name": "Character Name",
    "description": "Detailed 3-5 sentence visual description based on panel descriptions..."
  }
]

Output ONLY the JSON array, no explanations, no markdown.
`;

      const response = await llm.invoke(prompt);
      let text = response?.content?.trim() || response?.text?.trim() || '';

      // Parse JSON from Gemini response
      let characters = [];
      
      // Strategy 1: Extract from code blocks
      try {
        const codeBlockMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (codeBlockMatch) {
          characters = JSON.parse(codeBlockMatch[1]);
        }
      } catch (e) {
        // Continue to next strategy
      }

      // Strategy 2: Find JSON array in text
      if (characters.length === 0) {
        try {
          const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            characters = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          // Continue to next strategy
        }
      }

      // Strategy 3: Try parsing entire response
      if (characters.length === 0) {
        try {
          const parsed = JSON.parse(text.trim());
          if (Array.isArray(parsed)) {
            characters = parsed;
          } else if (parsed.characters && Array.isArray(parsed.characters)) {
            characters = parsed.characters;
          }
        } catch (e) {
          // Not valid JSON
        }
      }

      // Validate and format characters
      if (characters.length > 0) {
        characters = characters
          .filter(c => c && typeof c === 'object')
          .map((c, index) => ({
            id: c.id || `char_${index + 1}`,
            name: c.name || `Character ${index + 1}`,
            description: (c.description || '').trim()
          }))
          .filter(c => c.description.length > 0 && c.name.length > 0);
      }

      if (characters.length === 0) {
        console.warn('⚠️  Failed to parse valid characters from Gemini response');
        return JSON.stringify({
          success: false,
          error: 'Failed to generate valid characters from LLM',
          rawResponse: text.substring(0, 500),
          characters: []
        });
      }

      // Save to characters.yaml
      await this.saveCharactersToYaml(characters);

      // Also update comic.yaml if it exists
      await this.updateComicYaml(characters);

      return JSON.stringify({
        success: true,
        characterCount: characters.length,
        model: 'gemini-2.5-flash-lite',
        characters: characters
      }, null, 2);

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Failed to generate characters: ${error.message}`,
        characters: []
      });
    }
  }

  /**
   * Save characters to characters.yaml
   */
  async saveCharactersToYaml(characters) {
    try {
      const charPath = path.join(__dirname, '../../config/characters.yaml');
      
      // Load existing config
      let existingConfig = {};
      try {
        if (fs.existsSync(charPath)) {
          const existingFile = fs.readFileSync(charPath, 'utf8');
          existingConfig = yaml.parse(existingFile) || {};
        }
      } catch (e) {
        // Ignore if file doesn't exist
      }

      const charData = {
        character_config: existingConfig.character_config || this.config,
        characters: characters
      };
      
      const yamlContent = yaml.stringify(charData, {
        indent: 2,
        lineWidth: 120,
        simpleKeys: false
      });
      
      await fs.writeFile(charPath, yamlContent, 'utf8');
      console.log(`✓ Saved ${characters.length} characters to characters.yaml`);
    } catch (error) {
      console.error('Failed to save characters to YAML:', error.message);
      throw error;
    }
  }

  /**
   * Update comic.yaml with characters
   */
  async updateComicYaml(characters) {
    try {
      const comicPath = path.join(__dirname, '../../config/comic.yaml');
      
      // Load existing comic.yaml or create new structure
      let comicData = { characters: [], panels: [] };
      try {
        if (fs.existsSync(comicPath)) {
          const existingFile = fs.readFileSync(comicPath, 'utf8');
          comicData = yaml.parse(existingFile) || comicData;
        }
      } catch (e) {
        // Start fresh if file doesn't exist or can't be parsed
      }

      // Get character config
      const charConfig = this.config;
      const fixedElements = Array.isArray(charConfig.fixed_prompt_elements) 
        ? charConfig.fixed_prompt_elements 
        : [charConfig.fixed_prompt_elements];

      // Format characters for comic.yaml
      const formattedCharacters = characters.map((char) => {
        const prompt = `${char.description}, ${fixedElements.join(', ')}`;
        
        return {
          id: char.id,
          width: charConfig.image_specs?.width || 832,
          height: charConfig.image_specs?.height || 1248,
          description: char.description,
          contextImages: [],
          prompt: prompt
        };
      });

      // Update comic.yaml with new characters (preserve existing panels)
      comicData.characters = formattedCharacters;

      const yamlContent = yaml.stringify(comicData, {
        indent: 2,
        lineWidth: 120,
        simpleKeys: false
      });
      
      await fs.writeFile(comicPath, yamlContent, 'utf8');
      console.log(`✓ Updated comic.yaml with ${formattedCharacters.length} characters`);
    } catch (error) {
      console.warn('Could not update comic.yaml:', error.message);
      // Don't throw - this is secondary save
    }
  }
  
  /**
   * Format characters for console display
   * @param {Array} characters - Character objects with name and description
   * @returns {string} Formatted console output
   */
  formatConsoleOutput(characters) {
    const fixedElements = this.config.fixed_prompt_elements.join(', ');
    
    let output = '\nGenerated Characters:\n';
    output += '━'.repeat(23) + '\n';
    
    characters.forEach((char, index) => {
      const fullDescription = char.description ? 
        `${char.description}, ${fixedElements}` : 
        fixedElements;
      
      output += `Character ${index + 1}:\n`;
      output += `  ID: ${char.id}\n`;
      output += `  Name: ${char.name}\n`;
      output += `  Description: ${fullDescription}\n`;
      output += `  Width: ${this.config.image_specs.width}\n`;
      output += `  Height: ${this.config.image_specs.height}\n`;
      
      if (index < characters.length - 1) {
        output += '\n';
      }
    });
    
    output += '━'.repeat(23) + '\n';
    
    return output;
  }
}
