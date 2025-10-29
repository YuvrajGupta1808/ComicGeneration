#!/usr/bin/env node

/**
 * Setup script for Ollama mode
 * This script helps users set up the comic agent to use Ollama instead of Claude
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

console.log(chalk.blue('🎨 Comic Agent - Ollama Setup\n'));

async function checkOllamaInstallation() {
  console.log(chalk.yellow('Checking Ollama installation...'));
  
  try {
    execSync('ollama --version', { stdio: 'pipe' });
    console.log(chalk.green('✓ Ollama is installed'));
    return true;
  } catch (error) {
    console.log(chalk.red('✗ Ollama is not installed'));
    console.log(chalk.yellow('Please install Ollama from: https://ollama.ai/'));
    return false;
  }
}

async function checkOllamaRunning() {
  console.log(chalk.yellow('Checking if Ollama is running...'));
  
  try {
    execSync('ollama list', { stdio: 'pipe' });
    console.log(chalk.green('✓ Ollama is running'));
    return true;
  } catch (error) {
    console.log(chalk.red('✗ Ollama is not running'));
    console.log(chalk.yellow('Please start Ollama: ollama serve'));
    return false;
  }
}

async function checkModel() {
  console.log(chalk.yellow('Checking for recommended model...'));
  
  try {
    const output = execSync('ollama list', { encoding: 'utf8' });
    if (output.includes('llama3.2')) {
      console.log(chalk.green('✓ Llama 3.2 model found'));
      return true;
    } else {
      console.log(chalk.yellow('⚠ Llama 3.2 model not found'));
      console.log(chalk.blue('Installing Llama 3.2 model...'));
      execSync('ollama pull llama3.2:latest', { stdio: 'inherit' });
      console.log(chalk.green('✓ Llama 3.2 model installed'));
      return true;
    }
  } catch (error) {
    console.log(chalk.red('✗ Failed to check/install model'));
    return false;
  }
}

async function setupEnvironment() {
  console.log(chalk.yellow('Setting up environment...'));
  
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = await fs.readFile(envPath, 'utf8');
  }
  
  // Add or update USE_OLLAMA setting
  if (envContent.includes('USE_OLLAMA=')) {
    envContent = envContent.replace(/USE_OLLAMA=.*/, 'USE_OLLAMA=true');
  } else {
    envContent += '\n# Use Ollama instead of Claude API\nUSE_OLLAMA=true\n';
  }
  
  await fs.writeFile(envPath, envContent);
  console.log(chalk.green('✓ Environment configured for Ollama mode'));
}

async function main() {
  try {
    const ollamaInstalled = await checkOllamaInstallation();
    if (!ollamaInstalled) {
      process.exit(1);
    }
    
    const ollamaRunning = await checkOllamaRunning();
    if (!ollamaRunning) {
      process.exit(1);
    }
    
    const modelReady = await checkModel();
    if (!modelReady) {
      process.exit(1);
    }
    
    await setupEnvironment();
    
    console.log(chalk.green('\n🎉 Setup complete!'));
    console.log(chalk.blue('\nYou can now use the comic agent with Ollama:'));
    console.log(chalk.white('  npm start'));
    console.log(chalk.white('  comic-agent create --prompt "Your story idea"'));
    console.log(chalk.white('  comic-agent interactive'));
    
    console.log(chalk.yellow('\nNote: Make sure Ollama is running before using the agent:'));
    console.log(chalk.white('  ollama serve'));
    
  } catch (error) {
    console.error(chalk.red('Setup failed:'), error.message);
    process.exit(1);
  }
}

main();
