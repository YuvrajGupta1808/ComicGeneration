#!/usr/bin/env node

/**
 * Comic Generation CLI Agent - Main Orchestrator
 * Professional CLI agent with context memory for comic generation workflows
 */

import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import { Logger } from '../utils/logger.js';
import { ComicCLI } from './cli.js';
import { ContextMemory } from './memory.js';
import { ToolRegistry } from './tool-registry.js';

class ComicAgent {
  constructor() {
    this.logger = new Logger();
    
    // Load configuration first
    this.config = this.loadConfig();
    
    // Initialize context with configuration
    this.context = new ContextMemory(this.config.memory || {});
    this.tools = new ToolRegistry();
    this.cli = new ComicCLI(this.context, this.tools);
  }

  /**
   * Load agent configuration from YAML file
   */
  loadConfig() {
    try {
      const configPath = path.join(process.cwd(), 'config', 'agent.yaml');
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf8');
        return yaml.parse(configContent);
      }
    } catch (error) {
      this.logger.warn('Could not load agent.yaml, using defaults');
    }
    
    // Default configuration
    return {
      agent: {
        name: "Comic Generation Agent",
        version: "1.0.0",
        description: "Professional CLI agent for comic generation workflows"
      },
      memory: {
        persistence: true,
        maxHistory: 1000,
        autoSave: true,
        contextFile: ".comic-agent-context.json"
      },
      tools: {
        'comic-generation': { enabled: true, timeout: 300000, retries: 3, defaultStyle: "cinematic" },
        'layout-selection': { enabled: true, templatesFile: "./config/layouts.yaml" },
        'dialogue-generation': { enabled: true, defaultMode: "context-aware" },
        'dialogue-insert': { enabled: true, defaultStyle: "speech" },
        'show-pages': { enabled: true, defaultFormat: "preview" }
      },
      logging: {
        level: "info",
        format: "colored",
        file: "comic-agent.log"
      }
    };
  }

  /**
   * Initialize the agent
   */
  async initialize() {
    try {
      this.logger.info(`Starting ${this.config.agent.name} v${this.config.agent.version}`);
      
      // Register tools
      await this.tools.registerAll();
      
      // Start CLI
      await this.cli.start();
      
    } catch (error) {
      this.logger.error('Failed to initialize agent:', error);
      process.exit(1);
    }
  }

  /**
   * Shutdown the agent gracefully
   */
  async shutdown() {
    try {
      this.logger.info('Shutting down agent...');
      
      // Clear memory if persistence is disabled
      if (!this.config.memory?.persistence) {
        this.context.clearContext();
        this.logger.info('Memory cleared (session-based)');
      } else {
        // Save context if persistence is enabled
        this.context.saveContext();
        this.logger.info('Context saved');
      }
      
      // Cleanup
      await this.tools.cleanup();
      
      this.logger.info('Agent shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  if (global.agent) {
    await global.agent.shutdown();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (global.agent) {
    await global.agent.shutdown();
  }
  process.exit(0);
});

// Start the agent
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new ComicAgent();
  global.agent = agent;
  
  agent.initialize().catch(error => {
    console.error('Failed to start agent:', error);
    process.exit(1);
  });
}

export { ComicAgent };
