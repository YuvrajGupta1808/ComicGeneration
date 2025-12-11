#!/usr/bin/env node

import 'dotenv/config';
import { ComposePagesLangChainTool } from '../src/tools/compose-pages-langchain.js';

async function testCompose() {
  console.log('🧪 Testing compose pages tool...');
  
  const tool = new ComposePagesLangChainTool();
  
  try {
    console.log('📋 Executing tool without sourceMap (should read from comic.yaml)...');
    const result = await tool.execute();
    
    console.log('✅ Result:', result);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCompose();