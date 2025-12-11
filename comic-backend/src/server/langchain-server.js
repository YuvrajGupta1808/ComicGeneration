#!/usr/bin/env node

/**
 * LangChain Comic Agent HTTP Server
 * Provides HTTP API for the frontend to interact with the LangChain agent
 */

import chalk from 'chalk';
import 'dotenv/config';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { LangChainComicAgent } from '../core/langchain-agent.js';
import { insertComicPrompt } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Initialize the agent
let agent = null;

async function initializeAgent() {
  try {
    agent = new LangChainComicAgent();
    await agent.initialize();
    console.log(chalk.green('✓ LangChain agent initialized'));
    return true;
  } catch (error) {
    console.error(chalk.red('Failed to initialize agent:'), error.message);
    return false;
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', agent: agent ? 'ready' : 'not initialized' }));
    return;
  }

  // Serve images from outputs folder
  if (req.url.startsWith('/outputs/') && req.method === 'GET') {
    const filename = req.url.replace('/outputs/', '');
    const filepath = path.join(__dirname, '../../outputs', filename);
    
    if (!fs.existsSync(filepath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Image not found' }));
      return;
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filepath).pipe(res);
    return;
  }

  // List all images in outputs folder
  if (req.url === '/outputs' && req.method === 'GET') {
    const outputsDir = path.join(__dirname, '../../outputs');
    
    if (!fs.existsSync(outputsDir)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ images: [] }));
      return;
    }

    const files = fs.readdirSync(outputsDir)
      .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
      .map(file => ({
        filename: file,
        url: `http://localhost:${PORT}/outputs/${file}`,
        path: `/outputs/${file}`
      }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ images: files }));
    return;
  }

  // Chat endpoint
  if (req.url === '/chat' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { message } = JSON.parse(body);
        
        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message is required' }));
          return;
        }

        if (!agent) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Agent not initialized' }));
          return;
        }

        console.log(chalk.cyan(`\n📨 Received: ${message}`));
        
        // Clear URLs before processing new message
        agent.panelUrls = null;
        agent.pageUrls = null;
        
        // Process the message
        const response = await agent.generateResponse(message);
        
        console.log(chalk.green(`✓ Response generated`));

        // Include page URLs if available (prioritize pages over panels)
        const responseData = { response };
        console.log('🔍 Agent state - pageUrls:', agent.pageUrls, 'panelUrls:', agent.panelUrls);
        
        if (agent.pageUrls && agent.pageUrls.length > 0) {
          responseData.pageUrls = agent.pageUrls;
          console.log(chalk.magenta(`📖 Sending ${agent.pageUrls.length} composed page URLs to frontend:`));
          console.log(chalk.magenta(JSON.stringify(agent.pageUrls, null, 2)));
          // Clear after sending to prevent showing in next response
          agent.pageUrls = null;
        } else if (agent.panelUrls && agent.panelUrls.length > 0) {
          responseData.panelUrls = agent.panelUrls;
          console.log(chalk.magenta(`📋 Sending ${agent.panelUrls.length} panel URLs to frontend`));
          // Clear after sending to prevent showing in next response
          agent.panelUrls = null;
        }
        
        console.log('📤 Final response data:', JSON.stringify(responseData, null, 2));

        // Store the user prompt & generated data in the database (best-effort, non-blocking for errors)
        try {
          await insertComicPrompt({
            promptText: message,
            responseData,
          });
        } catch (dbError) {
          console.error(chalk.red('Failed to insert prompt into database:'), dbError.message);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseData));
        
      } catch (error) {
        console.error(chalk.red('Error processing request:'), error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server
async function start() {
  console.log(chalk.cyan.bold('═'.repeat(60)));
  console.log(chalk.cyan.bold('  🚀 LangChain Comic Agent Server'));
  console.log(chalk.cyan.bold('═'.repeat(60)));
  console.log('');

  const initialized = await initializeAgent();
  
  if (!initialized) {
    console.error(chalk.red('Failed to start server: Agent initialization failed'));
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(chalk.green(`✓ Server running on http://localhost:${PORT}`));
    console.log(chalk.gray(`  Frontend URL: ${FRONTEND_URL}`));
    console.log(chalk.gray(`  Endpoints:`));
    console.log(chalk.gray(`    GET  /health - Health check`));
    console.log(chalk.gray(`    POST /chat   - Send message to agent`));
    console.log('');
  });
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Shutting down server...'));
  server.close(() => {
    console.log(chalk.green('✓ Server closed'));
    process.exit(0);
  });
});

start();
