import { AnthropicService } from '../services/anthropic.js';

/**
 * Character Generation Tool
 * Generates characters using Anthropic Claude AI
 */
class CharacterGenerationTool {
  constructor() {
    this.name = 'character-generation';
    this.description = 'Generate characters using Anthropic Claude AI';
    this.requiredParams = ['story'];
    this.optionalParams = ['characterCount', 'style', 'genre'];
    this.anthropic = new AnthropicService();
  }

  /**
   * Execute character generation
   * @param {object} params - Parameters
   * @param {ContextMemory} context - Context memory
   * @returns {Promise<object>} Generation result
   */
  async execute(params, context) {
    const { 
      story, 
      characterCount = 2, 
      style = 'modern', 
      genre = 'adventure' 
    } = params;
    
    try {
      // Check if Anthropic service is available
      if (!this.anthropic.isAvailable()) {
        throw new Error('Anthropic API not available. Please set ANTHROPIC_API_KEY environment variable.');
      }

      // Enhance story with additional context
      const enhancedStory = {
        ...story,
        genre,
        style
      };

      // Generate characters using Anthropic
      const characters = await this.anthropic.generateCharacters(enhancedStory, characterCount);
      
      // Enhance characters with additional metadata
      const enhancedCharacters = characters.map((char, index) => ({
        ...char,
        id: `char_${index + 1}`,
        created: new Date().toISOString(),
        visualStyle: char.visualStyle || style,
        role: char.role || (index === 0 ? 'Protagonist' : 'Supporting')
      }));

      // Store in context
      context.setContext('generatedCharacters', enhancedCharacters, 'project');
      context.addAction('character-generation', params, { characters: enhancedCharacters });
      
      return {
        success: true,
        characters: enhancedCharacters,
        message: `Generated ${enhancedCharacters.length} characters successfully`
      };
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        characters: []
      };
      
      context.addAction('character-generation', params, errorResult);
      return errorResult;
    }
  }

  /**
   * Generate character based on specific requirements
   * @param {object} requirements - Character requirements
   * @param {object} story - Story context
   * @returns {Promise<object>} Generated character
   */
  async generateSpecificCharacter(requirements, story) {
    if (!this.anthropic.isAvailable()) {
      throw new Error('Anthropic API not available. Please set ANTHROPIC_API_KEY environment variable.');
    }

    try {
      const prompt = `Generate a specific character based on these requirements:

REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

STORY CONTEXT:
Title: ${story.title || 'Untitled Story'}
Type: ${story.type || 'general'}
Genre: ${story.genre || 'adventure'}

Create a detailed character that meets the requirements. Return as JSON:
{
  "name": "Character Name",
  "description": "Detailed physical description",
  "personality": "Personality traits",
  "role": "Specific role",
  "visualStyle": "Style notes",
  "backstory": "Character background",
  "motivations": "What drives this character"
}`;

      const response = await this.anthropic.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0.8,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0].text;
      
      try {
        const character = JSON.parse(content);
        return {
          ...character,
          id: `char_${Date.now()}`,
          created: new Date().toISOString()
        };
      } catch (parseError) {
        // Fallback character
        return {
          id: `char_${Date.now()}`,
          name: requirements.name || 'Generated Character',
          description: requirements.description || 'A character in the story',
          personality: requirements.personality || 'Friendly and helpful',
          role: requirements.role || 'Supporting',
          visualStyle: requirements.style || 'Modern comic style',
          backstory: 'Character background',
          motivations: 'Story-driven motivations',
          created: new Date().toISOString()
        };
      }

    } catch (error) {
      throw new Error(`Failed to generate specific character: ${error.message}`);
    }
  }

  /**
   * Enhance existing characters with AI-generated details
   * @param {Array} characters - Existing characters
   * @param {object} story - Story context
   * @returns {Promise<Array>} Enhanced characters
   */
  async enhanceCharacters(characters, story) {
    if (!this.anthropic.isAvailable()) {
      throw new Error('Anthropic API not available. Please set ANTHROPIC_API_KEY environment variable.');
    }

    try {
      const enhancedCharacters = [];

      for (const character of characters) {
        const prompt = `Enhance this character with more details:

EXISTING CHARACTER:
Name: ${character.name}
Description: ${character.description || 'Basic description'}
Role: ${character.role || 'Unknown'}

STORY CONTEXT:
Title: ${story.title || 'Untitled Story'}
Type: ${story.type || 'general'}

Add:
1. More detailed personality traits
2. Character motivations
3. Backstory elements
4. Visual style notes
5. Character arc suggestions

Return as JSON with enhanced details.`;

        const response = await this.anthropic.client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 800,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });

        const content = response.content[0].text;
        
        try {
          const enhanced = JSON.parse(content);
          enhancedCharacters.push({
            ...character,
            ...enhanced,
            enhanced: true,
            enhancedAt: new Date().toISOString()
          });
        } catch (parseError) {
          // Keep original character if parsing fails
          enhancedCharacters.push({
            ...character,
            enhanced: false,
            enhancedAt: new Date().toISOString()
          });
        }
      }

      return enhancedCharacters;

    } catch (error) {
      throw new Error(`Failed to enhance characters: ${error.message}`);
    }
  }

  /**
   * Validate character structure
   * @param {object} character - Character to validate
   * @returns {object} Validation result
   */
  validateCharacter(character) {
    const errors = [];
    const warnings = [];

    if (!character.name) errors.push('Missing character name');
    if (!character.description) warnings.push('Missing character description');
    if (!character.personality) warnings.push('Missing personality traits');
    if (!character.role) warnings.push('Missing character role');

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get character templates by genre
   * @param {string} genre - Story genre
   * @returns {Array} Character templates
   */
  getCharacterTemplates(genre) {
    const templates = {
      'fantasy': [
        { name: 'Hero', role: 'Protagonist', personality: 'Brave and noble' },
        { name: 'Wizard', role: 'Mentor', personality: 'Wise and mysterious' },
        { name: 'Dragon', role: 'Antagonist', personality: 'Powerful and ancient' }
      ],
      'sci-fi': [
        { name: 'Captain', role: 'Protagonist', personality: 'Commanding and decisive' },
        { name: 'Scientist', role: 'Supporting', personality: 'Brilliant and curious' },
        { name: 'Android', role: 'Supporting', personality: 'Logical and loyal' }
      ],
      'mystery': [
        { name: 'Detective', role: 'Protagonist', personality: 'Observant and persistent' },
        { name: 'Suspect', role: 'Antagonist', personality: 'Mysterious and deceptive' },
        { name: 'Witness', role: 'Supporting', personality: 'Nervous and helpful' }
      ],
      'adventure': [
        { name: 'Explorer', role: 'Protagonist', personality: 'Curious and adventurous' },
        { name: 'Guide', role: 'Supporting', personality: 'Knowledgeable and helpful' },
        { name: 'Villain', role: 'Antagonist', personality: 'Cunning and ruthless' }
      ]
    };

    return templates[genre] || templates['adventure'];
  }

  /**
   * Estimate generation time
   * @param {number} characterCount - Number of characters
   * @returns {number} Estimated time in seconds
   */
  estimateGenerationTime(characterCount) {
    // Rough estimate: 10 seconds per character
    return characterCount * 10;
  }
}

export { CharacterGenerationTool };
