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
import { DialoguePlacementVisionLangChainTool } from '../tools/dialogue-placement-vision-langchain.js';
import { EditPanelLangChainTool } from '../tools/edit-panel-langchain.js';
import { LayoutSelectionLangChainTool } from '../tools/layout-selection-langchain.js';
import { LeonardoImageGenerationLangChainTool } from '../tools/leonardo-image-generation-langchain.js';
import { PanelGenerationLangChainTool } from '../tools/panel-generation-langchain.js';
import { EnhancedAgentWrapper } from './enhanced-agent-wrapper.js';

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
    this.enhancedWrapper = null; // Enhanced wrapper with memory and decision-making
    this.currentProjectId = null; // Track current project ID for database operations
    this.generatedStoryIdeas = []; // Track all story ideas generated in this session
    this.setupTools();
    this.setupModel();
    this.setupEnhancedWrapper();
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
      
      const dialoguePlacementTool = new DialoguePlacementVisionLangChainTool();
      this.dialoguePlacementToolInstance = dialoguePlacementTool;
      this.dialoguePlacementTool = dialoguePlacementTool.getTool();
      console.log(chalk.green('✓ Dialogue placement vision tool initialized'));
      
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
      
      // Bind tools to the model (panels first, then characters, then layout, then leonardo, then dialogue, then dialogue placement, then edit, then compose)
      this.llm = this.baseModel.bindTools([this.panelTool, this.characterTool, this.layoutTool, this.leonardoTool, this.dialogueTool, this.dialoguePlacementTool, this.editTool, this.composeTool]);
      
      console.log(chalk.green('✓ Gemini model initialized successfully'));
    } catch (error) {
      console.error(chalk.red('Failed to initialize Gemini model:'), error.message);
      throw error;
    }
  }

  /**
   * Setup enhanced wrapper with memory and decision-making
   */
  setupEnhancedWrapper() {
    try {
      this.enhancedWrapper = new EnhancedAgentWrapper(this);
      console.log(chalk.green('✓ Enhanced agent wrapper initialized'));
    } catch (error) {
      console.error(chalk.red('Failed to initialize enhanced wrapper:'), error.message);
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
      console.log(chalk.cyan.bold('  (Gemini Flash 2.5 Lite Latest + Memory & Decision Engine)'));
      console.log(chalk.cyan.bold('═'.repeat(60)));
      console.log('');
      console.log(chalk.gray('Type your prompt below — press Ctrl+C or "exit" to exit.'));
      console.log(chalk.gray('Commands: "memory" (view status), "clear session" (reset session), "clear ideas" (reset story ideas)\n'));
      
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

      // Check for memory commands
      if (trimmedInput.toLowerCase() === 'memory' || trimmedInput.toLowerCase() === 'status') {
        this.displayMemoryStatus();
        this.rl.prompt();
        return;
      }

      if (trimmedInput.toLowerCase() === 'clear session') {
        this.enhancedWrapper.clearSession();
        this.generatedStoryIdeas = []; // Also clear story ideas
        console.log(chalk.gray('🧹 Story ideas cleared'));
        this.rl.prompt();
        return;
      }

      if (trimmedInput.toLowerCase() === 'clear ideas') {
        this.generatedStoryIdeas = [];
        console.log(chalk.gray('🧹 Story ideas cleared'));
        this.rl.prompt();
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
      let systemContent = `
        You are **Comic Assistant**, an AI that helps users create comics — from idea to final layout.  
        You assist with:
        - Story ideas and expansion  
        - Panel descriptions and generation  
        - Character creation using predefined templates  
        - Layout and page selection  
        - Showing comic details and pages  
        
        ---
        
        🎨 **Story Ideas**
        - When users ask for story ideas, provide **few NEW short ideas** each time.  
        - Each idea should involve **no more than 2 main characters**.
        - **CRITICAL**: Generate DIFFERENT ideas each time. Use varied genres, settings, and themes.
        - Vary the genres: sci-fi, fantasy, mystery, horror, slice-of-life, adventure, etc.
        - If user asks for "more ideas", generate few COMPLETELY NEW ideas different from previous ones.
        - After showing ideas, ask:  
          "Would you like me to generate panels for one of these ideas?"  
        - If the user agrees, expand on the chosen idea and proceed to panel generation.
        
        ---
        
        📐 **Layouts**
        - When users mention pages, panel counts, or ask about layouts,
          automatically use the \`select_comic_layout\` tool FIRST.  
        - Use the \`pageCount\` from user input (default = 3).  
        - The tool should return panel structures and dimensions from **layouts.yaml**.
        - **After layout selection**: Parse the JSON response and show the user:
          - Number of pages selected
          - Layout name
          - Confirm the selection clearly
        
        ---
        
        🎬 **Panel Generation (PRIORITY: Generate FIRST)**
        - **IMPORTANT**: Always generate panels BEFORE characters.
        - Use the \`generate_panels\` tool when the user wants to create comic panels.
        - **CRITICAL: DO NOT ask the user for a project ID!** The tool automatically creates a new project.
        - **For NEW stories**: Call \`generate_panels\` with ONLY \`storyContext\`, \`genre\`, and \`pageCount\`.
        - **For EXISTING projects**: Only include \`projectId\` if you already have it from a previous tool response.
        - Parameters for \`generate_panels\`:
          - \`storyContext\`: Brief story description (required)
          - \`genre\`: Genre of the story (optional, e.g., "superhero", "fantasy")
          - \`pageCount\`: Number of pages (default: 3)
          - \`projectId\`: ONLY if continuing an existing project (optional - omit for new stories)
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
        - Panels will be automatically saved to the **database** with a unique project ID.
        - **IMPORTANT - After panel generation**:
          1. Parse the tool's JSON response to extract the panels array
          2. Display ALL panel descriptions to the user in a readable format:
             - Show each panel ID, description, camera angle, and context images
             - Format it nicely with emojis and structure
          3. Suggest character generation next
        - **Example response format**:
          "✓ Generated 8 panels successfully!
          
          📐 Panel 1 (establishing-shot):
          Description: [show the actual description]
          Context: char_1, char_2
          
          📐 Panel 2 (medium-shot):
          Description: [show the actual description]
          Context: panel_1, char_1
          
          ... (show all panels)
          
          Next: Generate characters?"
        - After panel generation, suggest character generation.
        
        ---
        
        👥 **Character Generation (Generate AFTER panels)**
        - **CRITICAL**: Characters MUST be generated AFTER panels have been created.
        - **DO NOT provide projectId** - it is automatically injected from the current session.
        - The \`generate_characters\` tool will automatically load panels from the database.
        - Characters are generated based on the panel descriptions - the tool analyzes panels to create consistent characters.
        - Use the \`generate_characters\` tool ONLY after panels have been generated and saved.
        - Parameters for \`generate_characters\`:
          - \`storyContext\`: Optional story context
          - \`genre\`: Optional genre
          - \`projectId\`: DO NOT provide - automatically injected
        - Characters will automatically be saved to the database.
        - **IMPORTANT - After character generation**:
          1. Parse the tool's JSON response to extract the characters array
          2. Display ALL character details to the user in a readable format:
             - Show each character ID, name, and full description
             - Format it nicely with emojis and structure
          3. Suggest dialogue generation next
        - **Example response format**:
          "✓ Generated 2 characters successfully!
          
          👤 Character 1 (char_1):
          Name: [show the actual name]
          Description: [show the full description]
          
          👤 Character 2 (char_2):
          Name: [show the actual name]
          Description: [show the full description]
          
          Next: Generate dialogue?"
        
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
        - **CRITICAL - After dialogue generation, you MUST**:
          1. Parse the tool's JSON response to extract the dialogue array
          2. Display ALL dialogue details to the user in a readable format:
             - Show the cover page title (panel1)
             - For EVERY panel, show: panel ID, ALL dialogue lines (speaker + text), narration, and sound effects
             - Format it nicely with emojis and structure
             - DO NOT skip any panels - show all of them
          3. Suggest next steps (generate images OR place dialogue with vision)
        - **Example response format**:
          "✓ Dialogue generated successfully!
          
          📖 Cover Page (panel1):
          Title: 'The Last Starlight'
          
          💬 Panel 2:
          - Jax: 'I've been tracking this cargo for weeks.'
          - Flicker: 'You don't know what you're getting into.'
          Narration: The twin suns cast long shadows...
          
          💬 Panel 3:
          - [show actual dialogue]
          Narration: [show actual narration if any]
          
          ... (show ALL panels with their dialogue)
          
          Next: Generate images with Leonardo AI?"
        
        ---
        
        🎯 **Dialogue Placement with Vision (Use AFTER images are generated)**
        - **WHEN TO USE**: After panel images have been generated with Leonardo AI and dialogue has been created.
        - Use the \`place_dialogue_with_vision\` tool to analyze panel images, determine optimal positions, AND render dialogue on images.
        - The tool uses Gemini Vision to:
          - Detect character positions in the image
          - Identify empty/negative space for bubble placement
          - Determine speech tail directions pointing to speakers
          - Calculate optimal coordinates for each dialogue bubble
          - Maintain proper reading order
          - **AUTOMATICALLY renders text on images and uploads to Cloudinary**
        - **Parameters**:
          - \`panelId\`: Optional - Specific panel ID to analyze (e.g., "panel2"). If omitted, analyzes all panels with dialogue.
          - \`sourceMap\`: Optional - Map of panel IDs to image URLs. If omitted, reads from comic.yaml.
        - **Output**: 
          - Returns placement data for each dialogue bubble
          - Returns Cloudinary URLs for rendered images with text (saved as textImageUrl in comic.yaml)
        - **CRITICAL - After placement analysis**:
          1. Parse the tool's JSON response to extract placements and rendered images
          2. Show the user a summary of analyzed panels
          3. Explain that placement data AND rendered images have been saved to comic.yaml
          4. Suggest using \`compose_pages\` next (which will automatically use the images with text)
        - **Typical workflow**: Dialogue → Images → Dialogue Placement (renders text) → Compose Pages
        
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
          - \`specificPanel\`: Optional - Generate only a specific panel by ID (e.g., "panel4", "panel5"). Use this when user wants to regenerate a single panel.
        - **Typical workflow**: 
          1. User requests to generate images → use \`generate_leonardo_images\` with \`generateType: "both"\`
          2. Tool generates characters first, then panels (using characters as context)
          3. Returns Cloudinary URLs for all generated images (sourceMap)
        - **Regenerate specific panel**:
          - If user says "regenerate panel 4" or "fix panel 5", use \`specificPanel: "panel4"\` or \`specificPanel: "panel5"\`
          - This will regenerate only that panel without affecting others
        - **IMPORTANT - After image generation**:
          1. Parse the tool's JSON response to extract the sourceMap and summary
          2. Show the user which images were generated (character IDs and panel IDs)
          3. Show success/failure summary (e.g., "8 panels succeeded, 0 failed")
          4. If any panels failed, suggest regenerating them individually
          5. Suggest composing pages next
        
        ---
        
        📖 **Page Composition (Final Step)**
        - **WHEN TO USE**: After Leonardo images have been generated (and optionally after dialogue has been placed).
        - Use the \`compose_pages\` tool to combine panel images into A4 comic pages.
        - The tool:
          - Reads panel URLs from sourceMap (from Leonardo tool output) or comic.yaml
          - **AUTOMATICALLY uses images with rendered text (textImageUrl) if available**
          - Automatically determines layout based on panel count (3-page, 4-page, 5-page story)
          - Composes panels onto A4 pages using layouts from layouts.yaml
          - Uploads composed pages to Cloudinary
        - **Parameters**:
          - \`sourceMap\`: Optional - Can be:
            - The full JSON response from Leonardo tool (tool will extract sourceMap automatically)
            - Just the sourceMap object: \`{"panel1": "url1", "panel2": "url2", ...}\`
            - If omitted, tool will try to construct from comic.yaml
          - \`useTextImages\`: Boolean (default: true) - Use images with rendered text if available
          - \`pageCount\`: Optional override for page count detection
        - **How to get sourceMap from Leonardo output**:
          - When Leonardo tool returns JSON, it includes a \`sourceMap\` field
          - You can pass the entire Leonardo tool response as sourceMap parameter
          - Or extract just the sourceMap: \`JSON.parse(leonardoOutput).sourceMap\`
          - Example: If Leonardo returns \`{"success": true, "sourceMap": {"panel1": "url"...}}\`, pass the whole response
        - **Typical workflow**:
          1. User requests to compose pages → call \`compose_pages\` tool
          2. If Leonardo tool was just called, pass its full output as sourceMap parameter
          3. Tool automatically uses textImageUrl (images with dialogue) if available, otherwise uses original panel images
          4. Tool extracts panel URLs, matches layout, composes pages
          5. Returns page URLs ready for viewing/sharing
        - **Note**: If dialogue has been placed with vision tool, compose_pages will automatically use those images with text.
        
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
        - Use simple section headers and emojis for clarity (🎨 Story • 👥 Characters • 📐 Layout • 💬 Dialogue • 🎯 Placement • 🖼️ Images • 📖 Pages).  
        - Always maintain a creative but professional tone.
        - **Typical full workflow**: Panels → Characters → Dialogue → (Edit if needed) → Images → Dialogue Placement (analyzes & renders text) → Compose Pages (uses images with text)
        `;

      // Add previously generated story ideas to context if any exist
      if (this.generatedStoryIdeas.length > 0) {
        systemContent += `\n\n⚠️ **Previously Generated Story Ideas (DO NOT REPEAT THESE)**:\n`;
        this.generatedStoryIdeas.forEach((idea, index) => {
          systemContent += `${index + 1}. ${idea}\n`;
        });
        systemContent += `\n**Generate COMPLETELY DIFFERENT ideas with different genres, themes, and settings.**\n`;
        
        // Suggest unexplored genres to increase variety
        const allGenres = ['sci-fi', 'fantasy', 'mystery', 'horror', 'slice-of-life', 'adventure', 'romance', 'thriller', 'western', 'cyberpunk', 'steampunk', 'noir', 'comedy', 'drama', 'superhero', 'post-apocalyptic', 'historical', 'magical realism'];
        const randomGenres = allGenres.sort(() => Math.random() - 0.5).slice(0, 3);
        systemContent += `\n**Consider exploring these genres**: ${randomGenres.join(', ')}\n`;
      }

      const systemMessage = {
        role: 'system',
        content: systemContent
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
            // Inject current project ID if available
            if (this.currentProjectId && !toolCall.args.projectId) {
              toolCall.args.projectId = this.currentProjectId;
            }
            const toolResult = await this.panelTool.invoke(toolCall.args);
            toolResults += toolResult;
            this.generatedPanels = toolResult;
            // Store panel request info and extract project ID
            try {
              const parsed = JSON.parse(toolResult);
              this.panelRequestInfo = parsed;
              if (parsed.projectId) {
                this.currentProjectId = parsed.projectId;
                console.log(chalk.cyan(`📌 Current project: ${this.currentProjectId}`));
              }
            } catch (e) {
              // Ignore parse errors
            }
          } else if (toolCall.name === 'generate_characters') {
            // Inject current project ID
            if (this.currentProjectId && !toolCall.args.projectId) {
              toolCall.args.projectId = this.currentProjectId;
            }
            console.log(chalk.gray(`   Using project ID: ${toolCall.args.projectId}`));
            const toolResult = await this.characterTool.invoke(toolCall.args);
            toolResults += toolResult;
          } else if (toolCall.name === 'generate_leonardo_images') {
            // Inject current project ID
            if (this.currentProjectId && !toolCall.args.projectId) {
              toolCall.args.projectId = this.currentProjectId;
            }
            const toolResult = await this.leonardoTool.invoke(toolCall.args);
            toolResults += toolResult;
            // Store Leonardo output for potential use by compose_pages tool
            this.lastLeonardoOutput = toolResult;
          } else if (toolCall.name === 'generate_dialogue') {
            // Inject current project ID
            if (this.currentProjectId && !toolCall.args.projectId) {
              toolCall.args.projectId = this.currentProjectId;
            }
            const toolResult = await this.dialogueTool.invoke(toolCall.args);
            toolResults += toolResult;
          } else if (toolCall.name === 'place_dialogue_with_vision') {
            // Inject current project ID
            if (this.currentProjectId && !toolCall.args.projectId) {
              toolCall.args.projectId = this.currentProjectId;
            }
            // If sourceMap not provided and we have last Leonardo output, use it
            if (!toolCall.args.sourceMap && this.lastLeonardoOutput) {
              try {
                const leonardoData = JSON.parse(this.lastLeonardoOutput);
                if (leonardoData.sourceMap) {
                  toolCall.args.sourceMap = leonardoData.sourceMap;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
            const toolResult = await this.dialoguePlacementTool.invoke(toolCall.args);
            toolResults += toolResult;
          } else if (toolCall.name === 'edit_panel') {
            // Inject current project ID
            if (this.currentProjectId && !toolCall.args.projectId) {
              toolCall.args.projectId = this.currentProjectId;
            }
            const toolResult = await this.editTool.invoke(toolCall.args);
            toolResults += toolResult;
          } else if (toolCall.name === 'compose_pages') {
            // Inject current project ID
            if (this.currentProjectId && !toolCall.args.projectId) {
              toolCall.args.projectId = this.currentProjectId;
            }
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

      // Extract and store story ideas if present in response
      this.extractAndStoreStoryIdeas(response);

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
   * Extract and store story ideas from response
   */
  extractAndStoreStoryIdeas(response) {
    // Look for numbered story ideas in the response
    const ideaPattern = /\d+\.\s+\*\*([^:*]+)(?::\*\*|\*\*:?)\s*([^\n]+)/g;
    let match;
    
    while ((match = ideaPattern.exec(response)) !== null) {
      const title = match[1].trim();
      const description = match[2].trim();
      const fullIdea = `${title}: ${description}`;
      
      // Only add if not already in the list
      if (!this.generatedStoryIdeas.includes(fullIdea)) {
        this.generatedStoryIdeas.push(fullIdea);
      }
    }
  }

  /**
   * Display memory status
   */
  displayMemoryStatus() {
    const summary = this.enhancedWrapper.getMemorySummary();
    
    console.log(chalk.cyan('\n📊 Memory Status'));
    console.log(chalk.cyan('═'.repeat(60)));
    
    console.log(chalk.yellow('\n🧠 Persistent Memory (Learned):'));
    console.log(`   Total Successes: ${summary.persistent.totalSuccesses}`);
    console.log(`   Total Failures: ${summary.persistent.totalFailures}`);
    console.log(`   Last Updated: ${summary.persistent.lastUpdated || 'Never'}`);
    
    console.log(chalk.yellow('\n⚡ Volatile Memory (Current Session):'));
    console.log(`   Session ID: ${summary.volatile.sessionId}`);
    console.log(`   Total Attempts: ${summary.volatile.totalAttempts}`);
    console.log(`   Failed Operations: ${summary.volatile.failedOperations}`);
    console.log(`   Successful Strategies: ${summary.volatile.successfulStrategies}`);
    
    console.log(chalk.cyan('\n═'.repeat(60) + '\n'));
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
