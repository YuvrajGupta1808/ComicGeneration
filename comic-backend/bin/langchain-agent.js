#!/usr/bin/env node

/**
 * LangChain Agent CLI Entry Point
 * CLI interface for the LangChain comic generation agent
 */

import chalk from 'chalk';
import 'dotenv/config';
import { LangChainComicAgent } from '../src/core/langchain-agent.js';

// Handle commands or default to interactive mode
const args = process.argv.slice(2);

if (args.length === 0) {
  // Interactive mode
  const agent = new LangChainComicAgent();
  agent.initialize()
    .then(() => agent.startInteractive())
    .catch(error => {
      console.error(chalk.red('Failed to start LangChain agent:'), error.message);
      process.exit(1);
    });
} else if (args[0] === 'chat') {
  // Chat command with prompt
  const prompt = args[1];
  if (!prompt) {
    console.error(chalk.red('Error: Please provide a prompt for the chat command'));
    process.exit(1);
  }
  const agent = new LangChainComicAgent();
  agent.initialize()
    .then(() => agent.processSinglePrompt(prompt))
    .then(() => process.exit(0))
    .catch(error => {
      console.error(chalk.red('Failed to process prompt:'), error.message);
      process.exit(1);
    });
} else if (args[0] === '--version' || args[0] === '-V') {
  console.log('1.0.0');
  process.exit(0);
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log('Usage: langchain-agent [options]\n');
  console.log('AI-powered comic generation assistant using LangChain and Gemini\n');
  console.log('Options:');
  console.log('  -V, --version  output the version number');
  console.log('  -h, --help     display help for command');
  console.log('\nCommands:');
  console.log('  chat <prompt>  Send a single prompt and get a response');
  process.exit(0);
} else {
  console.error(chalk.red(`Unknown command: ${args[0]}`));
  console.log('Use --help for usage information');
  process.exit(1);
}

