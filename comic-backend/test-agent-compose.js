#!/usr/bin/env node

import 'dotenv/config';
import { LangChainComicAgent } from './src/core/langchain-agent.js';

async function testAgentCompose() {
  console.log('🧪 Testing agent compose pages...');
  
  try {
    const agent = new LangChainComicAgent();
    await agent.initialize();
    
    console.log('📋 Sending compose pages request...');
    const response = await agent.generateResponse('compose pages from comic.yaml');
    
    console.log('✅ Response:', response);
    console.log('📖 Page URLs:', agent.pageUrls);
    console.log('📋 Panel URLs:', agent.panelUrls);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAgentCompose();