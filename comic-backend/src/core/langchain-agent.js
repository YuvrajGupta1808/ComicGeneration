#!/usr/bin/env node

/**
 * LangChain Comic Agent
 * AI-powered comic generation assistant using LangChain and Gemini
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import chalk from 'chalk';
import 'dotenv/config';
import readline from 'readline';
import { LayoutSelectionLangChainTool } from '../tools/layout-selection-langchain.js';

class LangChainComicAgent {
  constructor() {
    this.llm = null;
    this.baseModel = null;
    this.rl = null;
    this.conversationHistory = [];
    this.selectedLayout = null;
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
      
      // Bind tools to the model
      this.llm = this.baseModel.bindTools([this.layoutTool]);
      
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
        content: 'You are Comic Assistant, an AI specialized in helping users create comic stories, layouts, and dialogues. Be creative, concise, and context-aware. IMPORTANT: When users mention page counts (e.g., "4 page comic", "change to 4"), dimensions, or ask about layout/what layout will be used, ALWAYS automatically use the select_comic_layout tool. Use the pageCount parameter based on what the user requests (default is 3 if not specified). The tool selects multi-page comic structures from layouts.yaml and returns width/height dimensions for each panel.',
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
