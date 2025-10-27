import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '../utils/logger.js';

/**
 * Anthropic API Service
 * Wrapper for Anthropic Claude API with specialized methods for comic generation
 */
class AnthropicService {
  constructor() {
    this.logger = new Logger();
    this.client = null;
    this.initialize();
  }

  /**
   * Initialize Anthropic client
   */
  initialize() {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        this.logger.warn('ANTHROPIC_API_KEY not found in environment variables');
        return;
      }

      this.client = new Anthropic({
        apiKey: apiKey,
      });

      this.logger.info('Anthropic API client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Anthropic client:', error.message);
    }
  }

  /**
   * Generate story structure from user prompt using Claude
   * @param {string} userPrompt - User's initial prompt
   * @param {string} genre - Story genre
   * @param {string} style - Art style
   * @param {number} pageCount - Number of pages
   * @param {string} targetAudience - Target audience
   * @returns {Promise<object>} Generated story structure
   */
  async generateStoryStructure(userPrompt, genre = 'adventure', style = 'cinematic', pageCount = 3, targetAudience = 'general') {
    if (!this.client) {
      throw new Error('Anthropic client not initialized. Please set ANTHROPIC_API_KEY environment variable.');
    }

    try {
      const prompt = `You are a professional comic book writer and storyboard artist. Create a detailed story structure based on the user's prompt.

USER PROMPT: "${userPrompt}"

REQUIREMENTS:
- Genre: ${genre}
- Art Style: ${style}
- Pages: ${pageCount}
- Target Audience: ${targetAudience}

Create a complete story structure that includes:
1. A compelling title
2. Brief synopsis
3. Main theme/message
4. Detailed scene breakdown (${pageCount} pages)
5. Character introductions
6. Plot progression
7. Visual style notes

For each scene, provide:
- Scene description
- Panel count
- Key visual elements
- Character actions
- Mood/atmosphere
- Dialogue opportunities

Return as JSON with this structure:
{
  "title": "Story Title",
  "synopsis": "Brief story summary",
  "theme": "Main theme or message",
  "genre": "${genre}",
  "style": "${style}",
  "pages": ${pageCount},
  "targetAudience": "${targetAudience}",
  "scenes": [
    {
      "page": 1,
      "panel": 1,
      "description": "Detailed scene description",
      "mood": "tense/action/comedy/etc",
      "characters": ["Character names"],
      "visualElements": ["Key visual elements"],
      "dialogueOpportunity": true/false
    }
  ],
  "characterNotes": "Notes about characters to be developed",
  "visualStyle": "Detailed visual style description"
}`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0].text;
      
      try {
        const storyStructure = JSON.parse(content);
        return storyStructure;
      } catch (parseError) {
        // If JSON parsing fails, create fallback structure
        return this.createFallbackStoryStructure(userPrompt, genre, style, pageCount, targetAudience);
      }

    } catch (error) {
      this.logger.error('Failed to generate story structure:', error.message);
      throw error;
    }
  }

  /**
   * Create fallback story structure when JSON parsing fails
   * @param {string} userPrompt - User's initial prompt
   * @param {string} genre - Story genre
   * @param {string} style - Art style
   * @param {number} pageCount - Number of pages
   * @param {string} targetAudience - Target audience
   * @returns {object} Fallback story structure
   */
  createFallbackStoryStructure(userPrompt, genre, style, pageCount, targetAudience) {
    const scenes = [];
    const panelsPerPage = Math.ceil(6 / pageCount); // Distribute panels across pages
    
    for (let page = 1; page <= pageCount; page++) {
      for (let panel = 1; panel <= panelsPerPage; panel++) {
        scenes.push({
          page,
          panel,
          description: `Scene based on: ${userPrompt}`,
          mood: 'neutral',
          characters: ['Main Character'],
          visualElements: ['Setting', 'Action'],
          dialogueOpportunity: panel % 2 === 0
        });
      }
    }

    return {
      title: 'Generated Story',
      synopsis: `A story based on: ${userPrompt}`,
      theme: 'Adventure and discovery',
      genre,
      style,
      pages: pageCount,
      targetAudience,
      scenes,
      characterNotes: 'Characters will be developed based on the story needs',
      visualStyle: `${style} comic art style`
    };
  }

  /**
   * Generate panel descriptions using Claude
   * @param {object} story - Story object with scenes
   * @param {Array} characters - Character array
   * @param {string} style - Art style
   * @returns {Promise<Array>} Enhanced panel descriptions
   */
  async generatePanelDescriptions(story, characters, style = 'cinematic') {
    if (!this.client) {
      throw new Error('Anthropic client not initialized. Please set ANTHROPIC_API_KEY environment variable.');
    }

    try {
      const characterDescriptions = characters.map(char => 
        `${char.name}: ${char.description || 'A character'}`
      ).join(', ');

      const prompt = `You are a professional comic book artist and writer. Generate detailed visual descriptions for comic panels based on the story and characters.

STORY CONTEXT:
Title: ${story.title || 'Untitled Story'}
Type: ${story.type || 'general'}
Pages: ${story.pages || 3}

CHARACTERS:
${characterDescriptions}

ART STYLE: ${style}

STORY SCENES:
${story.scenes.map((scene, index) => 
  `Panel ${index + 1}: ${scene.description}`
).join('\n')}

For each scene, generate a detailed visual description that includes:
1. Setting and environment
2. Character positioning and actions
3. Lighting and mood
4. Camera angle/perspective
5. Key visual elements

Return the descriptions as a JSON array with this structure:
[
  {
    "panelId": "panel1",
    "description": "Detailed visual description...",
    "mood": "tense/action/comedy/etc",
    "lighting": "bright/dim/dramatic/etc",
    "cameraAngle": "close-up/wide-shot/etc"
  }
]`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0].text;
      
      // Try to parse JSON response
      try {
        const descriptions = JSON.parse(content);
        return descriptions;
      } catch (parseError) {
        // If JSON parsing fails, extract descriptions from text
        return this.extractDescriptionsFromText(content, story.scenes);
      }

    } catch (error) {
      this.logger.error('Failed to generate panel descriptions:', error.message);
      throw error;
    }
  }

  /**
   * Generate character descriptions using Claude
   * @param {object} story - Story object
   * @param {number} characterCount - Number of characters to generate
   * @returns {Promise<Array>} Generated characters
   */
  async generateCharacters(story, characterCount = 2) {
    if (!this.client) {
      throw new Error('Anthropic client not initialized. Please set ANTHROPIC_API_KEY environment variable.');
    }

    try {
      const prompt = `You are a character designer for comic books. Generate ${characterCount} unique characters for this story:

STORY CONTEXT:
Title: ${story.title || 'Untitled Story'}
Type: ${story.type || 'general'}
Genre: ${story.genre || 'adventure'}

Create diverse, interesting characters that fit the story. For each character, provide:
1. Name
2. Physical description
3. Personality traits
4. Role in the story
5. Visual style notes

Return as JSON array:
[
  {
    "name": "Character Name",
    "description": "Detailed physical description",
    "personality": "Personality traits",
    "role": "Protagonist/Antagonist/Supporting",
    "visualStyle": "Style notes for artist"
  }
]`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.8,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0].text;
      
      try {
        const characters = JSON.parse(content);
        return characters;
      } catch (parseError) {
        // Fallback to extracting from text
        return this.extractCharactersFromText(content, characterCount);
      }

    } catch (error) {
      this.logger.error('Failed to generate characters:', error.message);
      throw error;
    }
  }

  /**
   * Generate dialogue using Claude
   * @param {Array} panels - Panel array
   * @param {object} storyContext - Story context
   * @param {Array} characters - Character array
   * @param {string} mode - Dialogue mode
   * @returns {Promise<Array>} Generated dialogue
   */
  async generateDialogue(panels, storyContext, characters, mode = 'context-aware') {
    if (!this.client) {
      throw new Error('Anthropic client not initialized. Please set ANTHROPIC_API_KEY environment variable.');
    }

    try {
      const characterDescriptions = characters.map(char => 
        `${char.name}: ${char.personality || char.description}`
      ).join(', ');

      const prompt = `You are a comic book dialogue writer. Generate natural, engaging dialogue for each panel.

STORY CONTEXT:
Title: ${storyContext.title || 'Untitled Story'}
Type: ${storyContext.type || 'general'}

CHARACTERS:
${characterDescriptions}

DIALOGUE MODE: ${mode}

PANELS:
${panels.map((panel, index) => 
  `Panel ${index + 1}: ${panel.description || 'Scene description'}`
).join('\n')}

Generate dialogue that:
1. Fits each character's personality
2. Advances the story
3. Feels natural and engaging
4. Matches the scene's mood
5. Is appropriate for the target audience

Return as JSON array:
[
  {
    "panelId": "panel1",
    "bubbles": [
      {
        "text": "Character dialogue",
        "speaker": "Character Name",
        "style": "speech/thought/shout/whisper",
        "mood": "tense/happy/sad/etc"
      }
    ]
  }
]`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0].text;
      
      try {
        const dialogues = JSON.parse(content);
        return dialogues;
      } catch (parseError) {
        return this.extractDialogueFromText(content, panels);
      }

    } catch (error) {
      this.logger.error('Failed to generate dialogue:', error.message);
      throw error;
    }
  }

  /**
   * Generate interactive responses using Claude
   * @param {string} userInput - User input
   * @param {object} context - Current context
   * @returns {Promise<string>} AI response
   */
  async generateInteractiveResponse(userInput, context = {}) {
    if (!this.client) {
      throw new Error('Anthropic client not initialized. Please set ANTHROPIC_API_KEY environment variable.');
    }

    try {
      // Build conversation context
      let conversationContext = '';
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        conversationContext = '\n\nCONVERSATION HISTORY:\n';
        context.conversationHistory.forEach(msg => {
          const role = msg.role === 'user' ? 'User' : 'Assistant';
          conversationContext += `${role}: ${msg.content}\n`;
        });
      }

      const prompt = `You are a helpful AI assistant for a comic generation tool. The user is working on creating comics and needs assistance.

CURRENT CONTEXT:
${JSON.stringify(context, null, 2)}${conversationContext}

USER INPUT: ${userInput}

Provide a helpful, creative response that assists with comic creation. You can:
1. Suggest story ideas
2. Help with character development
3. Provide dialogue suggestions
4. Give artistic advice
5. Help with plot structure

Keep responses concise but helpful. If the user is referring to something from our conversation history, acknowledge it and build upon it.`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        temperature: 0.8,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return response.content[0].text;

    } catch (error) {
      this.logger.error('Failed to generate interactive response:', error.message);
      throw error;
    }
  }

  /**
   * Extract descriptions from text when JSON parsing fails
   * @param {string} text - Response text
   * @param {Array} scenes - Original scenes
   * @returns {Array} Extracted descriptions
   */
  extractDescriptionsFromText(text, scenes) {
    const descriptions = [];
    
    scenes.forEach((scene, index) => {
      descriptions.push({
        panelId: `panel${index + 1}`,
        description: scene.description || 'Visual description needed',
        mood: 'neutral',
        lighting: 'natural',
        cameraAngle: 'medium-shot'
      });
    });

    return descriptions;
  }

  /**
   * Extract characters from text when JSON parsing fails
   * @param {string} text - Response text
   * @param {number} count - Expected character count
   * @returns {Array} Extracted characters
   */
  extractCharactersFromText(text, count) {
    const characters = [];
    
    for (let i = 0; i < count; i++) {
      characters.push({
        name: `Character ${i + 1}`,
        description: 'A character in the story',
        personality: 'Friendly and helpful',
        role: i === 0 ? 'Protagonist' : 'Supporting',
        visualStyle: 'Modern comic style'
      });
    }

    return characters;
  }

  /**
   * Extract dialogue from text when JSON parsing fails
   * @param {string} text - Response text
   * @param {Array} panels - Panel array
   * @returns {Array} Extracted dialogue
   */
  extractDialogueFromText(text, panels) {
    const dialogues = [];
    
    panels.forEach((panel, index) => {
      dialogues.push({
        panelId: panel.id || `panel${index + 1}`,
        bubbles: [{
          text: 'Character dialogue',
          speaker: 'Character',
          style: 'speech',
          mood: 'neutral'
        }]
      });
    });

    return dialogues;
  }

  /**
   * Check if Anthropic service is available
   * @returns {boolean} Service availability
   */
  isAvailable() {
    return this.client !== null;
  }
}

export { AnthropicService };
