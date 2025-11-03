import { OllamaService } from '../services/ollama.js';

/**
 * Story Structure Generation Tool
 * Generates detailed story structure from user prompt using Ollama AI
 */
class StoryStructureGenerationTool {
  constructor() {
    this.name = 'story-structure-generation';
    this.description = 'Generate detailed story structure from user prompt using Ollama AI';
    this.requiredParams = ['userPrompt'];
    this.optionalParams = ['genre', 'style', 'pageCount', 'targetAudience'];
    this.ollama = new OllamaService();
  }

  /**
   * Execute story structure generation
   * @param {object} params - Parameters
   * @param {ContextMemory} context - Context memory
   * @returns {Promise<object>} Generation result
   */
  async execute(params, context) {
    const { 
      userPrompt, 
      genre = 'adventure', 
      style = 'cinematic',
      pageCount = 3,
      targetAudience = 'general'
    } = params;
    
    try {
      // Check if Ollama service is available
      if (!this.ollama.isAvailable()) {
        throw new Error('Ollama not available. Please ensure Ollama is running locally.');
      }

      // Generate detailed story structure using Ollama
      const storyStructure = await this.ollama.generateStoryStructure(
        userPrompt, 
        genre, 
        style, 
        pageCount, 
        targetAudience
      );
      
      // Enhance story structure with additional metadata
      const enhancedStory = {
        ...storyStructure,
        id: `story_${Date.now()}`,
        created: new Date().toISOString(),
        userPrompt,
        genre,
        style,
        pageCount,
        targetAudience,
        status: 'structure_complete'
      };

      // Store in context
      context.setContext('story', enhancedStory, 'project');
      context.setContext('userPrompt', userPrompt, 'project');
      context.addAction('story-structure-generation', params, { story: enhancedStory });
      
      return {
        success: true,
        story: enhancedStory,
        message: `Generated detailed story structure with ${enhancedStory.scenes.length} scenes`
      };
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        story: null
      };
      
      context.addAction('story-structure-generation', params, errorResult);
      return errorResult;
    }
  }

  /**
   * Generate story structure based on specific requirements
   * @param {string} userPrompt - User's initial prompt
   * @param {string} genre - Story genre
   * @param {string} style - Art style
   * @param {number} pageCount - Number of pages
   * @param {string} targetAudience - Target audience
   * @returns {Promise<object>} Generated story structure
   */
  async generateSpecificStructure(userPrompt, genre, style, pageCount, targetAudience) {
    if (!this.ollama.isAvailable()) {
      throw new Error('Ollama not available. Please ensure Ollama is running locally.');
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

      const response = await this.ollama.client.generate({
        model: this.ollama.model,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 3000
        }
      });

      const content = response.response;
      
      try {
        const storyStructure = JSON.parse(content);
        return {
          ...storyStructure,
          id: `story_${Date.now()}`,
          created: new Date().toISOString(),
          userPrompt,
          status: 'structure_complete'
        };
      } catch (parseError) {
        // Fallback story structure
        return this.createFallbackStory(userPrompt, genre, style, pageCount, targetAudience);
      }

    } catch (error) {
      throw new Error(`Failed to generate story structure: ${error.message}`);
    }
  }

  /**
   * Create fallback story structure when AI generation fails
   * @param {string} userPrompt - User's initial prompt
   * @param {string} genre - Story genre
   * @param {string} style - Art style
   * @param {number} pageCount - Number of pages
   * @param {string} targetAudience - Target audience
   * @returns {object} Fallback story structure
   */
  createFallbackStory(userPrompt, genre, style, pageCount, targetAudience) {
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
      visualStyle: `${style} comic art style`,
      id: `story_${Date.now()}`,
      created: new Date().toISOString(),
      userPrompt,
      status: 'structure_complete'
    };
  }

  /**
   * Validate story structure
   * @param {object} story - Story to validate
   * @returns {object} Validation result
   */
  validateStoryStructure(story) {
    const errors = [];
    const warnings = [];

    if (!story.title) warnings.push('Story missing title');
    if (!story.synopsis) warnings.push('Story missing synopsis');
    if (!story.scenes || !Array.isArray(story.scenes)) {
      errors.push('Story must have scenes array');
    } else {
      story.scenes.forEach((scene, index) => {
        if (!scene.description) {
          warnings.push(`Scene ${index + 1} missing description`);
        }
        if (!scene.page) {
          warnings.push(`Scene ${index + 1} missing page number`);
        }
        if (!scene.panel) {
          warnings.push(`Scene ${index + 1} missing panel number`);
        }
      });
    }

    if (!story.pages) warnings.push('Story missing pages count');

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get available genres
   * @returns {Array} Available genres
   */
  getAvailableGenres() {
    return [
      'adventure',
      'fantasy',
      'sci-fi',
      'mystery',
      'horror',
      'comedy',
      'drama',
      'action',
      'romance',
      'superhero',
      'noir',
      'western'
    ];
  }

  /**
   * Get available art styles
   * @returns {Array} Available styles
   */
  getAvailableStyles() {
    return [
      'cinematic',
      'anime',
      'manga',
      'western',
      'realistic',
      'cartoon',
      'noir',
      'fantasy',
      'sci-fi',
      'horror',
      'watercolor',
      'sketch'
    ];
  }

  /**
   * Get available target audiences
   * @returns {Array} Available audiences
   */
  getAvailableAudiences() {
    return [
      'children',
      'teen',
      'young-adult',
      'adult',
      'general',
      'family'
    ];
  }

  /**
   * Estimate generation time
   * @param {number} pageCount - Number of pages
   * @returns {number} Estimated time in seconds
   */
  estimateGenerationTime(pageCount) {
    // Rough estimate: 15 seconds per page
    return pageCount * 15;
  }
}

export { StoryStructureGenerationTool };
