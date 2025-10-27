#!/usr/bin/env node

/**
 * Comic Agent CLI Entry Point
 * Executable script for the comic generation CLI agent
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { ComicAgent } from '../src/core/agent.js';

// Start the agent
const agent = new ComicAgent();
global.agent = agent;

agent.initialize().catch(error => {
  console.error('Failed to start comic agent:', error);
  process.exit(1);
});
