/**
 * Comic Generation CLI Interface
 * Professional command-line interface using Commander.js
 */

import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import readline from 'readline';
import { OllamaService } from '../services/ollama.js';

export class ComicCLI {
  constructor(context, tools) {
    this.context = context;
    this.tools = tools;
    this.program = new Command();
    this.ollama = new OllamaService();
    this.isInteractive = false;
    this.rl = null; // Store readline interface reference
    this.setupCommands();
  }

  /**
   * Setup all CLI commands
   */
  setupCommands() {
    this.program
      .name('comic-agent')
      .description('Professional CLI agent for comic generation workflows')
      .version('1.0.0')
      .exitOverride(); // Prevent automatic exit, we'll handle it ourselves

    // Main workflow commands
    this.program
      .command('create')
      .description('Create comic from user prompt - Complete workflow')
      .option('-p, --prompt <prompt>', 'User prompt for the story')
      .option('-g, --genre <genre>', 'Story genre')
      .option('-s, --style <style>', 'Art style')
      .option('-c, --pages <count>', 'Number of pages')
      .option('-a, --audience <audience>', 'Target audience')
      .action(this.handleCreate.bind(this));

    this.program
      .command('generate <story-file>')
      .description('Generate comic from story file')
      .option('-l, --layout <type>', 'Layout template type')
      .option('-s, --style <style>', 'Art style')
      .option('-o, --output <dir>', 'Output directory')
      .action(this.handleGenerate.bind(this));

    this.program
      .command('layout')
      .description('Select layout template')
      .option('-p, --pages <count>', 'Number of pages')
      .option('-t, --type <type>', 'Story type')
      .action(this.handleLayout.bind(this));

    this.program
      .command('characters')
      .description('Generate characters using AI')
      .option('-c, --count <number>', 'Number of characters to generate')
      .option('-s, --story <file>', 'Story file for context')
      .option('-g, --genre <genre>', 'Story genre')
      .action(this.handleCharacters.bind(this));

    this.program
      .command('dialogue')
      .description('Generate dialogue for panels')
      .option('-m, --mode <mode>', 'Dialogue generation mode')
      .option('-a, --auto', 'Auto-generate dialogue')
      .action(this.handleDialogue.bind(this));

    this.program
      .command('preview')
      .description('Preview generated pages')
      .option('-f, --format <format>', 'Preview format')
      .action(this.handlePreview.bind(this));

    this.program
      .command('export <format>')
      .description('Export comic in specified format')
      .option('-o, --output <file>', 'Output file path')
      .action(this.handleExport.bind(this));

    // Context management commands
    this.program
      .command('context')
      .description('Manage context memory')
      .option('-s, --show', 'Show current context')
      .option('-c, --clear', 'Clear context')
      .action(this.handleContext.bind(this));

    this.program
      .command('history')
      .description('Show command history')
      .option('-n, --number <count>', 'Number of recent commands to show')
      .action(this.handleHistory.bind(this));

    // Interactive mode
    this.program
      .command('interactive')
      .description('Start interactive mode')
      .action(this.handleInteractive.bind(this));

    // Help command
    this.program
      .command('help')
      .description('Show detailed help')
      .action(this.handleHelp.bind(this));
  }

  /**
   * Start the CLI
   */
  async start() {
    try {
      await this.program.parseAsync();
      // Exit after command execution, unless in interactive mode
      if (!this.isInteractive) {
        process.exit(0);
      }
      // For interactive mode, ensure the process stays alive
      // Keep stdin open to prevent exit
      if (this.isInteractive && process.stdin.isTTY) {
        process.stdin.resume();
        // Keep process alive - readline interface will handle the rest
      }
    } catch (error) {
      // Commander.js throws when exitOverride() is used and no command matches
      // This is expected behavior - just handle it gracefully
      if (error.code !== 'commander.unknownCommand' && error.code !== 'commander.missingArgument') {
        throw error;
      }
      // If no command provided and not interactive, show help and exit
      if (!this.isInteractive) {
        this.program.outputHelp();
        process.exit(1);
      }
      // For interactive mode, ensure stdin stays open
      if (this.isInteractive && process.stdin.isTTY) {
        process.stdin.resume();
      }
    }
  }

  /**
   * Handle create command - Complete workflow from user prompt
   */
  async handleCreate(options) {
    try {
      // Step 1: Get user prompt if not provided
      let userPrompt = options.prompt;
      if (!userPrompt) {
        const { prompt } = await inquirer.prompt([{
          type: 'input',
          name: 'prompt',
          message: 'What story would you like to create?',
          validate: (input) => input.trim().length > 0 || 'Please enter a story prompt'
        }]);
        userPrompt = prompt;
      }

      console.log(chalk.blue(`\n🎨 Creating comic from: "${userPrompt}"`));
      
      // Step 2: Generate story structure
      const structureSpinner = ora('Generating story structure...').start();
      const structureResult = await this.tools.execute('story-structure-generation', {
        userPrompt,
        genre: options.genre || 'adventure',
        style: options.style || 'cinematic',
        pageCount: parseInt(options.pages) || 3,
        targetAudience: options.audience || 'general'
      }, this.context);
      
      if (!structureResult.success) {
        structureSpinner.fail(chalk.red(`Story structure generation failed: ${structureResult.error}`));
        return;
      }
      
      structureSpinner.succeed(chalk.green('Story structure generated'));
      console.log(chalk.blue(`✓ Title: ${structureResult.story.title}`));
      console.log(chalk.blue(`✓ Pages: ${structureResult.story.pages}`));
      console.log(chalk.blue(`✓ Scenes: ${structureResult.story.scenes.length}`));

      // Step 3: Generate characters
      const characterSpinner = ora('Generating characters...').start();
      const characterResult = await this.tools.execute('character-generation', {
        story: structureResult.story,
        characterCount: 2,
        style: options.style || 'cinematic',
        genre: options.genre || 'adventure'
      }, this.context);
      
      if (!characterResult.success) {
        characterSpinner.fail(chalk.red(`Character generation failed: ${characterResult.error}`));
        return;
      }
      
      characterSpinner.succeed(chalk.green(`Generated ${characterResult.characters.length} characters`));
      characterResult.characters.forEach((character, index) => {
        console.log(chalk.blue(`  ${index + 1}. ${character.name} - ${character.role}`));
      });

      // Step 4: Generate panels
      const panelSpinner = ora('Generating panel descriptions...').start();
      const panelResult = await this.tools.execute('comic-generation', {
        story: structureResult.story,
        characters: characterResult.characters,
        style: options.style || 'cinematic'
      }, this.context);
      
      if (!panelResult.success) {
        panelSpinner.fail(chalk.red(`Panel generation failed: ${panelResult.error}`));
        return;
      }
      
      panelSpinner.succeed(chalk.green(`Generated ${panelResult.panels.length} panel descriptions`));

      // Step 5: Generate dialogue
      const dialogueSpinner = ora('Generating dialogue...').start();
      const dialogueResult = await this.tools.execute('dialogue-generation', {
        panels: panelResult.panels,
        storyContext: structureResult.story,
        characters: characterResult.characters,
        mode: 'context-aware'
      }, this.context);
      
      if (!dialogueResult.success) {
        dialogueSpinner.fail(chalk.red(`Dialogue generation failed: ${dialogueResult.error}`));
        return;
      }
      
      dialogueSpinner.succeed(chalk.green(`Generated dialogue for ${dialogueResult.dialogues.length} panels`));

      // Step 6: Select layout
      const layoutSpinner = ora('Selecting layout...').start();
      const layoutResult = await this.tools.execute('layout-selection', {
        pageCount: structureResult.story.pages,
        storyType: structureResult.story.genre || 'general'
      }, this.context);
      
      if (!layoutResult.success) {
        layoutSpinner.fail(chalk.red(`Layout selection failed: ${layoutResult.error}`));
        return;
      }
      
      layoutSpinner.succeed(chalk.green(`Selected layout: ${layoutResult.layout.name}`));

      // Summary
      console.log(chalk.green('\n🎉 Comic creation complete!'));
      console.log(chalk.yellow('\nGenerated components:'));
      console.log(chalk.white(`  ✓ Story: ${structureResult.story.title}`));
      console.log(chalk.white(`  ✓ Characters: ${characterResult.characters.length}`));
      console.log(chalk.white(`  ✓ Panels: ${panelResult.panels.length}`));
      console.log(chalk.white(`  ✓ Dialogue: ${dialogueResult.dialogues.length} panels`));
      console.log(chalk.white(`  ✓ Layout: ${layoutResult.layout.name}`));
      
      console.log(chalk.yellow('\nNext steps:'));
      console.log(chalk.white('  comic-agent preview     # Preview generated pages'));
      console.log(chalk.white('  comic-agent export pdf  # Export final comic'));
      console.log(chalk.white('  comic-agent context show # View all generated content'));

    } catch (error) {
      console.error(chalk.red(`Creation failed: ${error.message}`));
      console.error(chalk.red(error.stack));
    }
  }

  /**
   * Handle generate command
   */
  async handleGenerate(storyFile, options) {
    const spinner = ora('Generating comic panels...').start();
    
    try {
      // Load story file
      const story = await this.loadStoryFile(storyFile);
      
      // Generate panels
      const result = await this.tools.execute('comic-generation', {
        story,
        style: options.style || 'cinematic',
        outputDir: options.output
      }, this.context);
      
      spinner.succeed(chalk.green(`Generated ${result.panels.length} panels`));
      
      // Auto-select layout if not specified
      if (!options.layout) {
        const layoutResult = await this.tools.execute('layout-selection', {
          pageCount: story.pages || 3,
          storyType: story.type || 'general'
        }, this.context);
        
        console.log(chalk.blue(`Selected layout: ${layoutResult.layout.name}`));
      }
      
      // Show next steps
      console.log(chalk.yellow('\nNext steps:'));
      console.log(chalk.white('  comic-agent dialogue    # Generate dialogue'));
      console.log(chalk.white('  comic-agent preview     # Preview pages'));
      console.log(chalk.white('  comic-agent export pdf  # Export final comic'));
      
    } catch (error) {
      spinner.fail(chalk.red(`Generation failed: ${error.message}`));
      console.error(chalk.red(error.stack));
    }
  }

  /**
   * Handle layout command
   */
  async handleLayout(options) {
    const pageCount = options.pages || await this.promptPageCount();
    const storyType = options.type || 'general';
    
    const spinner = ora('Selecting layout template...').start();
    
    try {
      const result = await this.tools.execute('layout-selection', {
        pageCount: parseInt(pageCount),
        storyType
      }, this.context);
      
      spinner.succeed(chalk.green('Layout selected'));
      
      if (result.success) {
        console.log(chalk.green(`✓ Selected layout: ${result.layout.name}`));
        console.log(chalk.blue(`  Pages: ${result.layout.pages}`));
        console.log(chalk.blue(`  Panels per page: ${result.layout.panels_per_page.join(', ')}`));
      } else {
        console.log(chalk.red(`✗ Layout selection failed: ${result.error}`));
      }
      
    } catch (error) {
      spinner.fail(chalk.red(`Layout selection failed: ${error.message}`));
    }
  }

  /**
   * Handle characters command
   */
  async handleCharacters(options) {
    const characterCount = parseInt(options.count) || 2;
    const genre = options.genre || 'adventure';
    
    const spinner = ora('Generating characters with AI...').start();
    
    try {
      let story = null;
      
      // Load story if provided
      if (options.story) {
        story = await this.loadStoryFile(options.story);
      } else {
        // Create a basic story context
        story = {
          title: 'Generated Story',
          type: 'general',
          genre: genre,
          pages: 3
        };
      }
      
      const result = await this.tools.execute('character-generation', {
        story,
        characterCount,
        style: 'modern',
        genre
      }, this.context);
      
      spinner.succeed(chalk.green(`Generated ${result.characters.length} characters`));
      
      if (result.success) {
        result.characters.forEach((character, index) => {
          console.log(chalk.blue(`\nCharacter ${index + 1}: ${character.name}`));
          console.log(chalk.white(`  Role: ${character.role}`));
          console.log(chalk.white(`  Description: ${character.description}`));
          console.log(chalk.white(`  Personality: ${character.personality}`));
          if (character.visualStyle) {
            console.log(chalk.white(`  Visual Style: ${character.visualStyle}`));
          }
        });
        
        console.log(chalk.yellow('\nNext steps:'));
        console.log(chalk.white('  comic-agent generate <story-file>  # Generate panels'));
        console.log(chalk.white('  comic-agent dialogue              # Generate dialogue'));
      } else {
        console.log(chalk.red(`✗ Character generation failed: ${result.error}`));
      }
      
    } catch (error) {
      spinner.fail(chalk.red(`Character generation failed: ${error.message}`));
    }
  }

  /**
   * Handle dialogue command
   */
  async handleDialogue(options) {
    const spinner = ora('Generating dialogue...').start();
    
    try {
      // Get panels from context
      const panels = this.context.getContext('generatedPanels', 'project');
      const story = this.context.getContext('story', 'project');
      
      if (!panels) {
        throw new Error('No panels found. Run generate command first.');
      }
      
      const result = await this.tools.execute('dialogue-generation', {
        panels,
        storyContext: story,
        mode: options.mode || 'context-aware',
        auto: options.auto
      }, this.context);
      
      spinner.succeed(chalk.green(`Generated dialogue for ${result.dialogues.length} panels`));
      
      // Auto-insert dialogue if requested
      if (options.auto) {
        const insertResult = await this.tools.execute('dialogue-insert', {
          panels,
          dialogues: result.dialogues
        }, this.context);
        
        console.log(chalk.green(`✓ Inserted dialogue into ${insertResult.enhancedPanels.length} panels`));
      }
      
    } catch (error) {
      spinner.fail(chalk.red(`Dialogue generation failed: ${error.message}`));
    }
  }

  /**
   * Handle preview command
   */
  async handlePreview(options) {
    const spinner = ora('Generating preview...').start();
    
    try {
      const result = await this.tools.execute('show-pages', {
        format: options.format || 'preview'
      }, this.context);
      
      spinner.succeed(chalk.green(`Generated ${result.pages.length} pages`));
      
      // Show preview information
      result.pages.forEach((page, index) => {
        console.log(chalk.blue(`Page ${index + 1}: ${page.filename}`));
      });
      
    } catch (error) {
      spinner.fail(chalk.red(`Preview generation failed: ${error.message}`));
    }
  }

  /**
   * Handle export command
   */
  async handleExport(format, options) {
    const spinner = ora(`Exporting comic as ${format}...`).start();
    
    try {
      const result = await this.tools.execute('show-pages', {
        format: format,
        outputFile: options.output
      }, this.context);
      
      spinner.succeed(chalk.green(`Exported comic successfully`));
      
      if (result.outputFile) {
        console.log(chalk.green(`✓ Output: ${result.outputFile}`));
      }
      
    } catch (error) {
      spinner.fail(chalk.red(`Export failed: ${error.message}`));
    }
  }

  /**
   * Handle context command
   */
  async handleContext(options) {
    if (options.show) {
      this.showContext();
    } else if (options.clear) {
      await this.clearContext();
    } else {
      // In interactive mode, just show context by default
      this.showContext();
    }
  }

  /**
   * Handle history command
   */
  async handleHistory(options) {
    const history = this.context.getActionHistory();
    const count = parseInt(options.number) || 10;
    
    console.log(chalk.blue(`\nLast ${Math.min(count, history.length)} commands:`));
    console.log(chalk.gray('─'.repeat(60)));
    
    history.slice(-count).forEach((action, index) => {
      const timestamp = action.timestamp.toLocaleString();
      const status = action.success ? chalk.green('✓') : chalk.red('✗');
      console.log(`${status} ${chalk.white(action.action)} ${chalk.gray(`(${timestamp})`)}`);
    });
  }

  /**
   * Handle interactive mode
   */
  async handleInteractive() {
    this.isInteractive = true;
    
    // Immediately ensure stdin is open and ready
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
    }
    
    // Display welcome message immediately
    console.log(chalk.blue('🎨 Comic Agent Interactive Mode'));
    console.log(chalk.gray('Type "help" for available commands, "exit" to quit'));
    
    if (this.ollama.isAvailable()) {
      if (process.env.USE_OLLAMA === 'true') {
        console.log(chalk.green('✓ AI Assistant enabled (Ollama local mode) - ask me anything about comic creation!'));
      } else {
        console.log(chalk.green('✓ AI Assistant enabled - ask me anything about comic creation!'));
      }
    } else {
      if (process.env.USE_OLLAMA === 'true') {
        console.log(chalk.yellow('⚠ AI Assistant disabled - ensure Ollama is running locally'));
      } else {
        console.log(chalk.yellow('⚠ AI Assistant disabled - ensure Ollama is running locally'));
      }
    }
    console.log('');
    
    // Start the interactive loop immediately - this will keep the process alive
    // The readline interface keeps the event loop running
    try {
      await this.runInteractiveLoop();
    } catch (error) {
      console.error(chalk.red(`Failed to start interactive mode: ${error.message}`));
      this.isInteractive = false;
      process.exit(1);
    }
  }

  /**
   * Run the interactive command loop - Simplified version
   */
  async runInteractiveLoop() {
    // Create readline interface - simple and robust
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    // Prevent the process from exiting - keep stdin open
    process.stdin.resume();

    // Simple prompt function
    const askQuestion = (question) => {
      return new Promise((resolve) => {
        if (!this.rl || this.rl.closed) {
          // Recreate if closed
          this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
          });
        }
        this.rl.question(question, (answer) => {
          resolve(answer);
        });
      });
    };

    // Main loop - keep it simple
    while (this.isInteractive) {
      try {
        // Ensure stdin stays open
        if (process.stdin.isPaused()) {
          process.stdin.resume();
        }

        const input = await askQuestion(chalk.cyan('comic-agent> '));
        const command = input.trim();
        
        // Handle empty input
        if (!command) {
          continue;
        }
        
        // Handle exit
        if (command.toLowerCase() === 'exit') {
          console.log(chalk.yellow('\nGoodbye!'));
          this.isInteractive = false;
          if (this.rl) {
            this.rl.close();
          }
          process.exit(0);
          return;
        }
        
        // Handle help
        if (command.toLowerCase() === 'help') {
          this.showInteractiveHelp();
          console.log('');
          continue;
        }
        
        // Execute command or AI conversation
        try {
          if (this.isCliCommand(command)) {
            await this.executeInteractiveCommand(command);
          } else {
            await this.handleAIConversation(command);
          }
        } catch (cmdError) {
          console.log(chalk.red(`Command error: ${cmdError.message}`));
          // Continue loop even if command fails
        }
        
        // Ensure we continue the loop - add a small delay
        await new Promise(resolve => setImmediate(resolve));
        
      } catch (error) {
        // Check if readline interface was closed
        if (error.code === 'ERR_USE_AFTER_CLOSE' || 
            (error.message && error.message.includes('closed'))) {
          // Try to recreate the interface
          try {
            this.rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout,
              terminal: true
            });
            process.stdin.resume();
            console.log(chalk.yellow('Interface recreated. Please try again.\n'));
            continue;
          } catch (recreateError) {
            console.log(chalk.red('Failed to recreate interface. Exiting...'));
            this.isInteractive = false;
            process.exit(1);
          }
        } else {
          console.log(chalk.red(`\nError: ${error.message || error}`));
          console.log(chalk.gray('Continue with another command...\n'));
          // Continue the loop
        }
      }
    }
  }

  /**
   * Check if input is a CLI command
   * @param {string} input - User input
   * @returns {boolean} Is CLI command
   */
  isCliCommand(input) {
    const cliCommands = ['create', 'generate', 'layout', 'dialogue', 'preview', 'export', 'context', 'history'];
    const firstWord = input.trim().split(' ')[0].toLowerCase();
    return cliCommands.includes(firstWord);
  }

  /**
   * Execute CLI command in interactive mode
   * @param {string} command - Command string
   */
  async executeInteractiveCommand(command) {
    const parts = command.trim().split(' ');
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (commandName) {
        case 'create':
          await this.handleCreate(this.parseOptions(args, ['prompt', 'genre', 'style', 'pages', 'audience']));
          break;
        case 'generate':
          if (args.length === 0) {
            console.log(chalk.red('Error: generate command requires a story file'));
            return;
          }
          await this.handleGenerate(args[0], this.parseOptions(args.slice(1), ['layout', 'style', 'output']));
          break;
        case 'layout':
          await this.handleLayout(this.parseOptions(args, ['pages', 'type']));
          break;
        case 'characters':
          await this.handleCharacters(this.parseOptions(args, ['count', 'story', 'genre']));
          break;
        case 'dialogue':
          await this.handleDialogue(this.parseOptions(args, ['mode', 'auto']));
          break;
        case 'preview':
          await this.handlePreview(this.parseOptions(args, ['format']));
          break;
        case 'export':
          if (args.length === 0) {
            console.log(chalk.red('Error: export command requires a format'));
            return;
          }
          await this.handleExport(args[0], this.parseOptions(args.slice(1), ['output']));
          break;
        case 'context':
          await this.handleContext(this.parseOptions(args, ['show', 'clear']));
          break;
        case 'history':
          await this.handleHistory(this.parseOptions(args, ['number']));
          break;
        default:
          console.log(chalk.red(`Unknown command: ${commandName}`));
      }
    } catch (error) {
      console.log(chalk.red(`Command execution failed: ${error.message}`));
      console.log(chalk.gray('You can try another command or ask a question.\n'));
      // Don't rethrow - let the loop continue
    }
  }

  /**
   * Parse command line options from arguments
   * @param {Array} args - Command arguments
   * @param {Array} validOptions - Valid option names
   * @returns {object} Parsed options
   */
  parseOptions(args, validOptions) {
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        const optionName = arg.substring(2);
        if (validOptions.includes(optionName)) {
          if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
            options[optionName] = args[i + 1];
            i++; // Skip next argument as it's the value
          } else {
            options[optionName] = true;
          }
        }
      } else if (arg.startsWith('-') && arg.length === 2) {
        const shortOption = arg.substring(1);
        // Map short options to long options
        const shortToLong = {
          'p': 'prompt',
          'g': 'genre', 
          's': 'style',
          'c': 'count',
          'l': 'layout',
          'o': 'output',
          'a': 'audience',
          'm': 'mode',
          'f': 'format',
          'n': 'number'
        };
        
        const longOption = shortToLong[shortOption];
        if (longOption && validOptions.includes(longOption)) {
          if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
            options[longOption] = args[i + 1];
            i++; // Skip next argument as it's the value
          } else {
            options[longOption] = true;
          }
        }
      }
    }
    
    return options;
  }

  /**
   * Handle AI conversation
   * @param {string} userInput - User input
   */
  async handleAIConversation(userInput) {
    if (!this.ollama.isAvailable()) {
      console.log(chalk.yellow('AI Assistant is not available. Please ensure Ollama is running locally.'));
      return;
    }

    const spinner = ora('Thinking...').start();
    
    try {
      // Add user message to conversation history
      this.context.addConversationMessage('user', userInput);

      // Get current context including conversation history
      const currentContext = {
        sessionData: this.context.getSessionData(),
        projectData: this.context.getProjectData(),
        actionHistory: this.context.getActionHistory().slice(-5), // Last 5 actions
        conversationHistory: this.context.getConversationHistory().slice(-10) // Last 10 messages
      };

      // Generate AI response with conversation context
      const response = await this.ollama.generateInteractiveResponse(userInput, currentContext);
      
      // Add AI response to conversation history
      this.context.addConversationMessage('assistant', response);
      
      spinner.stop();
      console.log(chalk.blue('\n🤖 AI Assistant:'));
      console.log(chalk.white(response));
      console.log('');
      
    } catch (error) {
      spinner.fail(chalk.red(`AI response failed: ${error.message}`));
      console.log(chalk.gray('You can try asking another question or use a command.\n'));
      // Don't rethrow - let the loop continue
    }
  }

  /**
   * Handle help command
   */
  async handleHelp() {
    console.log(chalk.blue('\n🎨 Comic Generation CLI Agent Help\n'));
    
    console.log(chalk.yellow('WORKFLOW COMMANDS:'));
    console.log(chalk.white('  create                Create comic from user prompt (Complete workflow)'));
    console.log(chalk.white('  generate <story-file> Generate comic from story file'));
    console.log(chalk.white('  characters            Generate characters using AI'));
    console.log(chalk.white('  layout                 Select layout template'));
    console.log(chalk.white('  dialogue              Generate dialogue for panels'));
    console.log(chalk.white('  preview               Preview generated pages'));
    console.log(chalk.white('  export <format>       Export comic (pdf, png, etc.)\n'));
    
    console.log(chalk.yellow('MANAGEMENT COMMANDS:'));
    console.log(chalk.white('  context               Manage context memory'));
    console.log(chalk.white('  history               Show command history'));
    console.log(chalk.white('  interactive           Start interactive mode\n'));
    
    console.log(chalk.yellow('EXAMPLES:'));
    console.log(chalk.gray('  comic-agent create --prompt "A superhero saves the city"'));
    console.log(chalk.gray('  comic-agent create -p "Space adventure" -g sci-fi -s anime'));
    console.log(chalk.gray('  comic-agent generate story.json'));
    console.log(chalk.gray('  comic-agent dialogue --auto'));
    console.log(chalk.gray('  comic-agent export pdf --output my-comic.pdf\n'));
  }

  /**
   * Load story file
   */
  async loadStoryFile(storyFile) {
    const filePath = path.resolve(storyFile);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Story file not found: ${storyFile}`);
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    const story = JSON.parse(content);
    
    // Store in context
    this.context.setContext('story', story, 'project');
    
    return story;
  }

  /**
   * Prompt for page count
   */
  async promptPageCount() {
    const { pageCount } = await inquirer.prompt([{
      type: 'number',
      name: 'pageCount',
      message: 'How many pages do you want?',
      default: 3,
      validate: (value) => value > 0 && value <= 10 || 'Please enter a number between 1 and 10'
    }]);
    return pageCount;
  }

  /**
   * Show current context
   */
  showContext() {
    console.log(chalk.blue('\n📋 Current Context:\n'));
    
    const sessionData = this.context.getSessionData();
    const projectData = this.context.getProjectData();
    
    if (Object.keys(sessionData).length > 0) {
      console.log(chalk.yellow('Session Data:'));
      Object.entries(sessionData).forEach(([key, value]) => {
        console.log(chalk.white(`  ${key}: ${JSON.stringify(value)}`));
      });
    }
    
    if (Object.keys(projectData).length > 0) {
      console.log(chalk.yellow('\nProject Data:'));
      Object.entries(projectData).forEach(([key, value]) => {
        console.log(chalk.white(`  ${key}: ${JSON.stringify(value)}`));
      });
    }
    
    if (Object.keys(sessionData).length === 0 && Object.keys(projectData).length === 0) {
      console.log(chalk.gray('No context data available'));
    }
  }

  /**
   * Clear context
   */
  async clearContext() {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to clear all context data?',
      default: false
    }]);
    
    if (confirm) {
      this.context.clearContext();
      console.log(chalk.green('✓ Context cleared'));
    } else {
      console.log(chalk.yellow('Context clear cancelled'));
    }
  }

  /**
   * Export context
   */
  async exportContext() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `comic-agent-context-${timestamp}.json`;
    
    this.context.exportContext(filename);
    console.log(chalk.green(`✓ Context exported to ${filename}`));
  }

  /**
   * Show interactive help
   */
  showInteractiveHelp() {
    console.log(chalk.blue('\n🎨 Interactive Mode Commands:\n'));
    console.log(chalk.yellow('CLI COMMANDS:'));
    console.log(chalk.white('create                 - Create comic from user prompt (Complete workflow)'));
    console.log(chalk.white('generate <story-file>  - Generate comic from story'));
    console.log(chalk.white('characters             - Generate characters with AI'));
    console.log(chalk.white('layout                 - Select layout template'));
    console.log(chalk.white('dialogue               - Generate dialogue'));
    console.log(chalk.white('preview                - Preview pages'));
    console.log(chalk.white('export <format>        - Export comic'));
    console.log(chalk.white('context show           - Show context'));
    console.log(chalk.white('history                - Show history'));
    
    if (this.ollama.isAvailable()) {
      console.log(chalk.yellow('\nAI CONVERSATION:'));
      console.log(chalk.white('Ask me anything about comic creation!'));
      console.log(chalk.gray('Examples:'));
      console.log(chalk.gray('  "Help me create a superhero story"'));
      console.log(chalk.gray('  "What makes good comic dialogue?"'));
      console.log(chalk.gray('  "Suggest character ideas for a fantasy comic"'));
      console.log(chalk.gray('  "How do I improve my story pacing?"'));
    }
    
    console.log(chalk.yellow('\nGENERAL:'));
    console.log(chalk.white('help                   - Show this help'));
    console.log(chalk.white('exit                   - Exit interactive mode\n'));
  }
}
