#!/usr/bin/env node

/**
 * LangChain Comic Agent
 * AI-powered comic generation assistant using LangChain and Gemini
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import chalk from 'chalk';
import readline from 'readline';
import { CharacterGenerationLangChainTool } from '../tools/character-generation-langchain.js';
import { ComposePagesLangChainTool } from '../tools/compose-pages-langchain.js';
import { DialogueGenerationLangChainTool } from '../tools/dialogue-generation-langchain.js';
import { EditPanelLangChainTool } from '../tools/edit-panel-langchain.js';
import { LayoutSelectionLangChainTool } from '../tools/layout-selection-langchain.js';
import { LeonardoImageGenerationLangChainTool } from '../tools/leonardo-image-generation-langchain.js';
import { PanelGenerationLangChainTool } from '../tools/panel-generation-langchain.js';

class LangChainComicAgent {
  constructor() {
    this.llm = null;
    this.baseModel = null;
    this.rl = null;
    this.conversationHistory = [];
    this.selectedLayout = null;
    this.generatedPanels = null;
    this.panelRequestInfo = null;
    this.lastLeonardoOutput = null; // Store last Leonardo tool output for compose_pages
    this.setupTools();
    this.setupModel();
  }
  
  /**
   * Setup tools for the agent
   */
  setupTools() {
    try {
      const layoutTool = new LayoutSelectionLangChainTool();
      this.layoutToolInstance = layoutTool;
      this.layoutTool = layoutTool.getTool();
      console.log(chalk.green('✓ Layout selection tool initialized'));
      
      const panelTool = new PanelGenerationLangChainTool();
      this.panelToolInstance = panelTool;
      this.panelTool = panelTool.getTool();
      console.log(chalk.green('✓ Panel generation tool initialized'));
      
      const characterTool = new CharacterGenerationLangChainTool();
      this.characterToolInstance = characterTool;
      this.characterTool = characterTool.getTool();
      console.log(chalk.green('✓ Character generation tool initialized'));
      
      const leonardoTool = new LeonardoImageGenerationLangChainTool();
      this.leonardoToolInstance = leonardoTool;
      this.leonardoTool = leonardoTool.getTool();
      console.log(chalk.green('✓ Leonardo image generation tool initialized'));
      
      const composeTool = new ComposePagesLangChainTool();
      this.composeToolInstance = composeTool;
      this.composeTool = composeTool.getTool();
      console.log(chalk.green('✓ Compose pages tool initialized'));
      
      const dialogueTool = new DialogueGenerationLangChainTool();
      this.dialogueToolInstance = dialogueTool;
      this.dialogueTool = dialogueTool.getTool();
      console.log(chalk.green('✓ Dialogue generation tool initialized'));
      
      const editTool = new EditPanelLangChainTool();
      this.editToolInstance = editTool;
      this.editTool = editTool.getTool();
      console.log(chalk.green('✓ Edit panel tool initialized'));
    } catch (error) {
      console.error(chalk.red('Failed to initialize tools:'), error.message);
      throw error;
    }
  }

  /**
   * Setup the Gemini model
   */
  setupModel() {
    try {
      this.baseModel = new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash-lite',
        apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
        temperature: 0.7,
      });
      
      // Bind tools to the model (panels first, then characters, then layout, then leonardo, then dialogue, then edit, then compose)
      this.llm = this.baseModel.bindTools([this.panelTool, this.characterTool, this.layoutTool, this.leonardoTool, this.dialogueTool, this.editTool, this.composeTool]);
      
      console.log(chalk.green('✓ Gemini model initialized successfully'));
    } catch (error) {
      console.error(chalk.red('Failed to initialize Gemini model:'), error.message);
      throw error;
    }
  }

  /**
   * Initialize the agent
   */
  async initialize() {
    try {
      if (!this.llm) {
        throw new Error('Model not initialized');
      }
      
      // Display welcome message
      console.log(chalk.cyan.bold('═'.repeat(60)));
      console.log(chalk.cyan.bold('  🎨 Comic Assistant CLI'));
      console.log(chalk.cyan.bold('  (Gemini Flash 2.5 Lite Latest)'));
      console.log(chalk.cyan.bold('═'.repeat(60)));
      console.log('');
      console.log(chalk.gray('Type your prompt below — press Ctrl+C or "exit" to exit.\n'));
      
      return true;
    } catch (error) {
      console.error(chalk.red('Failed to initialize agent:'), error);
      throw error;
    }
  }

  /**
   * Start interactive CLI session
   */
  async startInteractive() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.rl.on('line', async (input) => {
      const trimmedInput = input.trim();
      
      if (!trimmedInput) {
        console.log(chalk.gray('Please enter a prompt.'));
        this.rl.prompt();
        return;
      }

      // Check for exit commands
      if (trimmedInput.toLowerCase() === 'exit' || trimmedInput.toLowerCase() === 'quit') {
        console.log(chalk.green('\n👋 Goodbye! Happy comic creating!'));
        this.rl.close();
        return;
      }

      // Process the input
      await this.processInput(trimmedInput);
      
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log(chalk.gray('\nSession ended.'));
      process.exit(0);
    });

    this.rl.prompt();
  }

  /**
   * Process user input and generate response
   */
  async processInput(userInput) {
    try {
      // Show thinking indicator
      const thinking = chalk.yellow('🤔 Thinking...');
      process.stdout.write(thinking);

      // Generate response using Gemini
      const response = await this.generateResponse(userInput);
      
      // Clear thinking indicator
      process.stdout.write('\r' + ' '.repeat(thinking.length) + '\r');

      // Display response
      console.log(chalk.cyan('\n🗨️  ' + response + '\n'));
      
    } catch (error) {
      console.log(chalk.red('\n❌ Error: ' + error.message));
    }
  }

  /**
   * Generate response using Gemini
   */
  async generateResponse(userInput) {
    try {
      // Build conversation messages - system message must be first
      const systemMessage = {
        role: 'system',
        content: `
        You are **Comic Assistant**, an AI that helps users create comics — from idea to final layout.  
        You assist with:
        - Story ideas and expansion  
        - Panel descriptions and generation  
        - Character creation using predefined templates  
        - Layout and page selection  
        - Showing comic details and pages  
        
        ---
        
        🎨 **Story Ideas**
        - When users ask for story ideas, provide **3 short ideas** only.  
        - Each idea should involve **no more than 2 main characters**.  
        - After showing ideas, ask:  
          "Would you like me to generate panels for one of these ideas?"  
        - If the user agrees, expand on the chosen idea and proceed to panel generation.
        
        ---
        
        📐 **Layouts**
        - When users mention pages, panel counts, or ask about layouts,
          automatically use the \`select_comic_layout\` tool FIRST.  
        - Use the \`pageCount\` from user input (default = 3).  
        - The tool should return panel structures and dimensions from **layouts.yaml**.
        
        ---
        
        🎬 **Panel Generation (PRIORITY: Generate FIRST)**
        - **IMPORTANT**: Always generate panels BEFORE characters.
        - Use the \`generate_panels\` tool when the user wants to create comic panels.  
        - When the tool returns panel requests with camera angles, you MUST generate creative, vivid descriptions for EACH panel.
        - Generate descriptions that match the story context and genre. Include the specified camera angle in each description.
        - Also determine appropriate context images (previous panels, character references, backgrounds) for visual continuity.
        - **CRITICAL**: Return panel data as a JSON array in this exact format:
          [
            {"panelid": "panel1", "description": "your vivid description with camera angle", "contextImages": ["background", "Character1"]},
            {"panelid": "panel2", "description": "your vivid description with camera angle", "contextImages": ["panel1", "Character1"]},
            ...
          ]
        - Each description should be creative and story-specific, NOT generic or hardcoded.
        - Panels will be automatically saved to **comic.yaml** after generation.
        - After panel generation, suggest character generation.
        
        ---
        
        👥 **Character Generation (Generate AFTER panels)**
        - **CRITICAL**: Characters MUST be generated AFTER panels have been created.
        - The \`generate_characters\` tool will automatically load panels from comic.yaml.
        - Characters are generated based on the panel descriptions - the tool analyzes panels to create consistent characters.
        - Use the \`generate_characters\` tool ONLY after panels have been generated and saved.
        - Characters will automatically be saved to both characters.yaml and comic.yaml.
        
        ---
        
        💬 **Dialogue Generation (Generate AFTER characters and panels)**
        - **WHEN TO USE**: After both characters and panels have been generated and saved to comic.yaml.
        - Use the \`generate_dialogue\` tool to create dialogue, narration, and titles for the comic.
        - The tool reads character descriptions and panel descriptions from comic.yaml.
        - **COVER PAGE**: panel1 is automatically treated as the cover page with a title and NO dialogue.
        - **Parameters**:
          - \`genre\`: Optional - Comic genre (sci-fi, fantasy, etc.)
          - \`tone\`: Optional - Tone of dialogue (dramatic, humorous, dark, etc.)
          - \`storyContext\`: Optional - Additional story context
        - **Output**: The tool returns dialogue data AND saves it to comic.yaml:
          - \`title\`: Title for the cover page (panel1 only)
          - \`dialogue\`: Array of dialogue lines with speaker and text
          - \`narration\`: Narration text (optional, used sparingly)
          - \`soundEffects\`: Array of sound effects (optional, for action scenes)
        - **IMPORTANT - After dialogue generation**:
          1. Parse the tool's JSON response to extract the dialogue array
          2. Display the dialogue details to the user in a readable format:
             - Show the cover page title
             - For each panel, show: panel ID, dialogue lines (speaker + text), narration, and sound effects
             - Format it nicely with emojis and structure
          3. Suggest next steps (generate images)
        - **Example response format**:
          "✓ Dialogue generated successfully!
          
          📖 Cover Page (panel1):
          Title: 'The Last Starlight'
          
          💬 Panel 2:
          - Jax: 'I've been tracking this cargo for weeks.'
          - Flicker: 'You don't know what you're getting into.'
          Narration: The twin suns cast long shadows...
          SFX: WHOOSH
          
          ... (show all panels)
          
          Next: Generate images with Leonardo AI?"
        
        ---
        
        🎨 **Image Generation with Leonardo AI**
        - **WHEN TO USE**: After characters and panels have been generated and saved to comic.yaml.
        - Use the \`generate_leonardo_images\` tool to generate actual images using Leonardo AI.
        - The tool reads from **comic.yaml** and generates:
          - Character images (full body poses on white background)
          - Panel images (with context images for visual continuity)
        - All images are automatically uploaded to Cloudinary and URLs are returned.
        - **Parameters**: 
          - \`generateType\`: "characters" (only characters), "panels" (only panels), or "both" (default, generates characters first, then panels)
        - **Typical workflow**: 
          1. User requests to generate images → use \`generate_leonardo_images\` with \`generateType: "both"\`
          2. Tool generates characters first, then panels (using characters as context)
          3. Returns Cloudinary URLs for all generated images (sourceMap)
        - **After generation**: Inform the user that images are ready with their Cloudinary URLs.
        
        ---
        
        📖 **Page Composition (Final Step)**
        - **WHEN TO USE**: After Leonardo images have been generated.
        - Use the \`compose_pages\` tool to combine panel images into A4 comic pages.
        - The tool:
          - Reads panel URLs from sourceMap (from Leonardo tool output) or comic.yaml
          - Automatically determines layout based on panel count (3-page, 4-page, 5-page story)
          - Composes panels onto A4 pages using layouts from layouts.yaml
          - Uploads composed pages to Cloudinary
        - **Parameters**:
          - \`sourceMap\`: Optional - Can be:
            - The full JSON response from Leonardo tool (tool will extract sourceMap automatically)
            - Just the sourceMap object: \`{"panel1": "url1", "panel2": "url2", ...}\`
            - If omitted, tool will try to construct from comic.yaml
          - \`includeText\`: Boolean (default: false) - whether to add text/dialogue
          - \`pageCount\`: Optional override for page count detection
        - **How to get sourceMap from Leonardo output**:
          - When Leonardo tool returns JSON, it includes a \`sourceMap\` field
          - You can pass the entire Leonardo tool response as sourceMap parameter
          - Or extract just the sourceMap: \`JSON.parse(leonardoOutput).sourceMap\`
          - Example: If Leonardo returns \`{"success": true, "sourceMap": {"panel1": "url"...}}\`, pass the whole response
        - **Typical workflow**:
          1. User requests to compose pages → call \`compose_pages\` tool
          2. If Leonardo tool was just called, pass its full output as sourceMap parameter
          3. Tool extracts panel URLs, matches layout, composes pages
          4. Returns page URLs ready for viewing/sharing
        - **Note**: If sourceMap is not provided, tool will attempt to construct URLs from comic.yaml automatically.
        
        ---
        
        ✏️ **Edit Panel/Character (Anytime after generation)**
        - **WHEN TO USE**: When user wants to modify a specific panel or character field.
        - Use the \`edit_panel\` tool to update any field in comic.yaml.
        - **Parameters**:
          - \`targetType\`: "panel" or "character"
          - \`targetId\`: ID of the target (e.g., "panel7", "char_1")
          - \`field\`: Field to edit (e.g., "description", "dialogue", "narration", "title")
          - \`value\`: New value (string, array, or null)
        - **Common use cases**:
          - Change panel description: \`targetType: "panel", targetId: "panel7", field: "description", value: "new description"\`
          - Update dialogue: \`targetType: "panel", targetId: "panel2", field: "dialogue", value: [{"speaker": "char_1", "text": "new line"}]\`
          - Change narration: \`targetType: "panel", targetId: "panel3", field: "narration", value: "new narration"\`
          - Update title: \`targetType: "panel", targetId: "panel1", field: "title", value: "New Title"\`
        - **After editing**: Confirm the change to the user and show old vs new value.
        
        ---
        
        💬 **Style**
        - Be concise, structured, and friendly.  
        - Use simple section headers and emojis for clarity (🎨 Story • 👥 Characters • 📐 Layout • 💬 Dialogue • ✏️ Edit • 🖼️ Images • 📖 Pages).  
        - Always maintain a creative but professional tone.
        - **Typical full workflow**: Panels → Characters → Dialogue → (Edit if needed) → Images → Pages
        `
      };

      // Start with system message
      const messages = [systemMessage];

      // Add conversation history after system message if available
      if (this.conversationHistory.length > 0) {
        const historyMessages = this.conversationHistory.slice(-6); // Last 3 exchanges
        messages.push(...historyMessages);
      }

      // Add current user input
      messages.push({ role: 'user', content: userInput });

      // Invoke the model
      const result = await this.llm.invoke(messages);

      // Check if the model wants to use tools
      if (result.tool_calls && result.tool_calls.length > 0) {
        // Handle tool calls
        let toolResults = '';
        for (const toolCall of result.tool_calls) {
            console.log(chalk.yellow(
        `\n🔧 Gemini is calling tool: ${chalk.bold(toolCall.name)}`
      )
    );
          if (toolCall.name === 'select_comic_layout') {
            const toolResult = await this.layoutTool.invoke(toolCall.args);
            toolResults += toolResult;
            this.selectedLayout = toolResult;
          } else if (toolCall.name === 'generate_panels') {
            const toolResult = await this.panelTool.invoke(toolCall.args);
            toolResults += toolResult;
            this.generatedPanels = toolResult;
            // Store panel request info for later parsing
            try {
              const parsed = JSON.parse(toolResult);
              this.panelRequestInfo = parsed;
            } catch (e) {
              // Ignore parse errors
            }
          } else if (toolCall.name === 'generate_characters') {
            const toolResult = await this.characterTool.invoke(toolCall.args);
            toolResults += toolResult;
          } else if (toolCall.name === 'generate_leonardo_images') {
            const toolResult = await this.leonardoTool.invoke(toolCall.args);
            toolResults += toolResult;
            // Store Leonardo output for potential use by compose_pages tool
            this.lastLeonardoOutput = toolResult;
          } else if (toolCall.name === 'generate_dialogue') {
            const toolResult = await this.dialogueTool.invoke(toolCall.args);
            toolResults += toolResult;
          } else if (toolCall.name === 'edit_panel') {
            const toolResult = await this.editTool.invoke(toolCall.args);
            toolResults += toolResult;
          } else if (toolCall.name === 'compose_pages') {
            // If sourceMap not provided and we have last Leonardo output, use it
            if (!toolCall.args.sourceMap && this.lastLeonardoOutput) {
              toolCall.args.sourceMap = this.lastLeonardoOutput;
            }
            const toolResult = await this.composeTool.invoke(toolCall.args);
            toolResults += toolResult;
          }
        }

        // Get final response with tool results
        messages.push(result);
        messages.push({ 
          role: 'tool', 
          content: toolResults || 'Tool executed successfully',
          tool_call_id: result.tool_calls[0].id 
        });

        // Get the final response from the model - use baseModel to avoid tool calls
        const finalResult = await this.baseModel.invoke(messages);
        
        const response = finalResult.content || finalResult.text || 'I apologize, but I could not generate a response.';
        
        // Note: Panels are already saved to comic.yaml by the panel generation tool during execution
        // No need to parse and save here anymore
        
        // Add to conversation history
        this.conversationHistory.push({ role: 'user', content: userInput });
        this.conversationHistory.push({ role: 'assistant', content: response });

        // Keep history manageable (last 10 messages)
        if (this.conversationHistory.length > 10) {
          this.conversationHistory = this.conversationHistory.slice(-10);
        }

        // Return only the natural language response from Gemini
        return response;
      }

      const response = result.content || result.text || 'I apologize, but I could not generate a response.';

      // Add to conversation history
      this.conversationHistory.push({ role: 'user', content: userInput });
      this.conversationHistory.push({ role: 'assistant', content: response });

      // Keep history manageable (last 10 messages)
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      return response;

    } catch (error) {
      console.error(chalk.red('Error generating response:'), error.message);
      throw new Error('Failed to generate response. Please try again.');
    }
  }

  /**
   * Process a single prompt (non-interactive mode)
   */
  async processSinglePrompt(prompt) {
    try {
      console.log(chalk.yellow('Processing prompt...'));
      const response = await this.generateResponse(prompt);
      
      console.log(chalk.cyan('\n🗨️  ' + response + '\n'));
      
      return response;
    } catch (error) {
      console.error(chalk.red('Failed to process prompt:'), error);
      throw error;
    }
  }
}

// Export for use as module
export { LangChainComicAgent };
