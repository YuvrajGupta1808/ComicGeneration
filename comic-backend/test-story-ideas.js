#!/usr/bin/env node

/**
 * Test script to verify story idea generation works correctly
 */

import { LangChainComicAgent } from './src/core/langchain-agent.js';

async function testStoryIdeas() {
  console.log('🧪 Testing Story Idea Generation\n');
  
  const agent = new LangChainComicAgent();
  await agent.initialize();
  
  console.log('\n--- Test 1: First set of ideas ---');
  const response1 = await agent.processSinglePrompt('brainstorm 3 story ideas');
  
  console.log('\n--- Test 2: More ideas (should be different) ---');
  const response2 = await agent.processSinglePrompt('more ideas');
  
  console.log('\n--- Test 3: Another set (should be different again) ---');
  const response3 = await agent.processSinglePrompt('give me more ideas');
  
  console.log('\n✅ Test completed!');
  console.log(`\n📊 Total unique story ideas tracked: ${agent.generatedStoryIdeas.length}`);
  
  if (agent.generatedStoryIdeas.length > 0) {
    console.log('\n📝 All generated ideas:');
    agent.generatedStoryIdeas.forEach((idea, i) => {
      console.log(`   ${i + 1}. ${idea}`);
    });
  }
  
  process.exit(0);
}

testStoryIdeas().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
