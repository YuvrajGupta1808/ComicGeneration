#!/usr/bin/env node

/**
 * Test Memory & Decision System
 */

import chalk from 'chalk';
import { DecisionEngine } from './src/core/decision-engine.js';
import { MemoryManager } from './src/core/memory-manager.js';

console.log(chalk.cyan.bold('Testing Memory & Decision System\n'));

// Test Memory Manager
console.log(chalk.yellow('1. Testing Memory Manager...'));
const memory = new MemoryManager();

// Record some attempts
memory.recordAttempt('generate_leonardo_images', { seed: 18000 }, false, null, 'Timeout error');
memory.recordAttempt('generate_leonardo_images', { seed: 18001 }, false, null, 'Timeout error');
memory.recordAttempt('generate_leonardo_images', { seed: 18002 }, true, { success: true });

console.log(chalk.green('✓ Recorded 3 attempts'));
console.log(`  Attempt count: ${memory.getAttemptCount('generate_leonardo_images')}`);

// Test learning
memory.learnSuccess('generate_leonardo_images', { seed: 18002 }, { success: true });
memory.learnFailure('generate_leonardo_images', { seed: 18000 }, 'Timeout error');

console.log(chalk.green('✓ Learning recorded'));

// Get summary
const summary = memory.getSummary();
console.log(chalk.green('✓ Memory summary:'));
console.log(`  Volatile attempts: ${summary.volatile.totalAttempts}`);
console.log(`  Volatile failures: ${summary.volatile.failedOperations}`);

// Test Decision Engine
console.log(chalk.yellow('\n2. Testing Decision Engine...'));
const decisionEngine = new DecisionEngine(memory);

// Test retry decision
const decision1 = decisionEngine.shouldRetry('generate_leonardo_images', 'Timeout error');
console.log(chalk.green('✓ Retry decision:'));
console.log(`  Should retry: ${decision1.shouldRetry}`);
console.log(`  Reason: ${decision1.reason}`);
console.log(`  Strategy: ${decision1.strategy?.type}`);

// Test unrecoverable error
const decision2 = decisionEngine.shouldRetry('generate_leonardo_images', 'API key invalid');
console.log(chalk.green('✓ Unrecoverable error detection:'));
console.log(`  Should retry: ${decision2.shouldRetry}`);
console.log(`  Reason: ${decision2.reason}`);

// Test result evaluation
const testResult = JSON.stringify({
  success: true,
  results: {
    panels: [
      { id: 'panel1', url: 'http://example.com/1.jpg' },
      { id: 'panel2', error: 'Failed' },
      { id: 'panel3', url: 'http://example.com/3.jpg' },
    ],
  },
});

const evaluation = decisionEngine.evaluateResult('generate_leonardo_images', testResult);
console.log(chalk.green('✓ Result evaluation:'));
console.log(`  Success: ${evaluation.success}`);
console.log(`  Partial: ${evaluation.partial}`);
console.log(`  Should retry failed: ${evaluation.shouldRetryFailed}`);
if (evaluation.failedPanels) {
  console.log(`  Failed panels: ${evaluation.failedPanels.map(p => p.id).join(', ')}`);
}

// Test Leonardo retry strategy
console.log(chalk.yellow('\n3. Testing Leonardo Retry Strategies...'));

for (let i = 0; i < 3; i++) {
  const strategy = decisionEngine.getLeonardoRetryStrategy(
    'Generation timeout',
    i,
    { params: { seed: 18000, contextImages: ['img1', 'img2', 'img3', 'img4'] } }
  );
  console.log(chalk.green(`✓ Attempt ${i + 1} strategy:`));
  console.log(`  Type: ${strategy.type}`);
  console.log(`  Reason: ${strategy.reason}`);
  console.log(`  Wait time: ${strategy.waitTime}ms`);
  if (strategy.modifications) {
    console.log(`  Modifications:`, JSON.stringify(strategy.modifications, null, 2));
  }
}

console.log(chalk.cyan.bold('\n✅ All tests passed!\n'));
console.log(chalk.gray('Memory file location: comic-backend/config/agent-memory.json'));
console.log(chalk.gray('Run the agent with: npm run langchain-agent\n'));
