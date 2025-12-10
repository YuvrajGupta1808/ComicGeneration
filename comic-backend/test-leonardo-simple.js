#!/usr/bin/env node

import 'dotenv/config';
import { LeonardoImageGenerationLangChainTool } from './src/tools/leonardo-image-generation-langchain.js';

async function testLeonardo() {
  console.log('🧪 Testing Leonardo image generation...');
  
  const tool = new LeonardoImageGenerationLangChainTool();
  
  try {
    console.log('📋 Executing tool with characters only...');
    const result = await tool.execute('characters');
    
    console.log('✅ Result:', result);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLeonardo();