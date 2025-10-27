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
import { AnthropicService } from '../services/anthropic.js';

export class ComicCLI {
  constructor(context, tools) {
    this.context = context;
    this.tools = tools;
    this.program = new Command();
    this.anthropic = new AnthropicService();
    this.setupCommands();
  }

  /**
   * Setup all CLI commands
   */
  setupCommands() {
    this.program
      .name('comic-agent')
      .description('Professional CLI agent for comic generation workflows')
      .version('1.0.0');

    // Main workflow commands
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
    await this.program.parseAsync();
    // Exit after command execution
    process.exit(0);
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
      // Interactive context management
      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Show current context', value: 'show' },
          { name: 'Clear context', value: 'clear' },
          { name: 'Export context', value: 'export' }
        ]
      }]);
      
      switch (action) {
        case 'show':
          this.showContext();
          break;
        case 'clear':
          await this.clearContext();
          break;
        case 'export':
          await this.exportContext();
          break;
      }
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
    console.log(chalk.blue('🎨 Comic Agent Interactive Mode'));
    console.log(chalk.gray('Type "help" for available commands, "exit" to quit'));
    
    if (this.anthropic.isAvailable()) {
      console.log(chalk.green('✓ AI Assistant enabled - ask me anything about comic creation!'));
    } else {
      console.log(chalk.yellow('⚠ AI Assistant disabled - set ANTHROPIC_API_KEY to enable AI features'));
    }
    console.log('');
    
    while (true) {
      try {
        const { command } = await inquirer.prompt([{
          type: 'input',
          name: 'command',
          message: chalk.cyan('comic-agent>'),
          validate: (input) => input.trim().length > 0 || 'Please enter a command'
        }]);
        
        if (command.trim().toLowerCase() === 'exit') {
          console.log(chalk.yellow('Goodbye!'));
          break;
        }
        
        if (command.trim().toLowerCase() === 'help') {
          this.showInteractiveHelp();
          continue;
        }
        
        // Check if it's a CLI command or AI conversation
        if (this.isCliCommand(command)) {
          // Parse and execute CLI command
          await this.program.parseAsync(['node', 'comic-agent', ...command.trim().split(' ')]);
        } else {
          // Handle as AI conversation
          await this.handleAIConversation(command);
        }
        
      } catch (error) {
        console.log(chalk.red(`Error: ${error.message}`));
      }
    }
  }

  /**
   * Check if input is a CLI command
   * @param {string} input - User input
   * @returns {boolean} Is CLI command
   */
  isCliCommand(input) {
    const cliCommands = ['generate', 'layout', 'dialogue', 'preview', 'export', 'context', 'history'];
    const firstWord = input.trim().split(' ')[0].toLowerCase();
    return cliCommands.includes(firstWord);
  }

  /**
   * Handle AI conversation
   * @param {string} userInput - User input
   */
  async handleAIConversation(userInput) {
    if (!this.anthropic.isAvailable()) {
      console.log(chalk.yellow('AI Assistant is not available. Please set ANTHROPIC_API_KEY environment variable.'));
      return;
    }

    const spinner = ora('Thinking...').start();
    
    try {
      // Get current context
      const currentContext = {
        sessionData: this.context.getSessionData(),
        projectData: this.context.getProjectData(),
        actionHistory: this.context.getActionHistory().slice(-5) // Last 5 actions
      };

      // Generate AI response
      const response = await this.anthropic.generateInteractiveResponse(userInput, currentContext);
      
      spinner.stop();
      console.log(chalk.blue('\n🤖 AI Assistant:'));
      console.log(chalk.white(response));
      console.log('');
      
    } catch (error) {
      spinner.fail(chalk.red(`AI response failed: ${error.message}`));
    }
  }

  /**
   * Handle help command
   */
  async handleHelp() {
    console.log(chalk.blue('\n🎨 Comic Generation CLI Agent Help\n'));
    
    console.log(chalk.yellow('WORKFLOW COMMANDS:'));
    console.log(chalk.white('  generate <story-file>  Generate comic from story file'));
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
    console.log(chalk.gray('  comic-agent generate story.json'));
    console.log(chalk.gray('  comic-agent layout --pages 3'));
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
    console.log(chalk.white('generate <story-file>  - Generate comic from story'));
    console.log(chalk.white('characters             - Generate characters with AI'));
    console.log(chalk.white('layout                 - Select layout template'));
    console.log(chalk.white('dialogue               - Generate dialogue'));
    console.log(chalk.white('preview                - Preview pages'));
    console.log(chalk.white('export <format>        - Export comic'));
    console.log(chalk.white('context show           - Show context'));
    console.log(chalk.white('history                - Show history'));
    
    if (this.anthropic.isAvailable()) {
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
