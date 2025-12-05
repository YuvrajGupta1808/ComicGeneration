/**
 * Enhanced Agent Wrapper
 * Wraps the LangChain agent with memory and decision-making capabilities
 */

import chalk from 'chalk';
import { DecisionEngine } from './decision-engine.js';
import { MemoryManager } from './memory-manager.js';

export class EnhancedAgentWrapper {
  constructor(baseAgent) {
    this.agent = baseAgent;
    this.memory = new MemoryManager();
    this.decisionEngine = new DecisionEngine(this.memory);
    
    // Wrap tool execution methods
    this.wrapToolExecution();
    
    console.log(chalk.green('✓ Enhanced agent with memory and decision-making initialized'));
    this.displayMemorySummary();
  }

  /**
   * Display memory summary
   */
  displayMemorySummary() {
    const summary = this.memory.getSummary();
    console.log(chalk.gray(`📊 Memory: ${summary.persistent.totalSuccesses} successes, ${summary.persistent.totalFailures} failures learned`));
  }

  /**
   * Wrap tool execution to add retry logic and memory
   */
  wrapToolExecution() {
    // Store original tool instances
    const tools = [
      { name: 'leonardo', instance: this.agent.leonardoToolInstance, tool: this.agent.leonardoTool },
      { name: 'panel', instance: this.agent.panelToolInstance, tool: this.agent.panelTool },
      { name: 'character', instance: this.agent.characterToolInstance, tool: this.agent.characterTool },
      { name: 'dialogue', instance: this.agent.dialogueToolInstance, tool: this.agent.dialogueTool },
      { name: 'dialoguePlacement', instance: this.agent.dialoguePlacementToolInstance, tool: this.agent.dialoguePlacementTool },
      { name: 'compose', instance: this.agent.composeToolInstance, tool: this.agent.composeTool },
    ];

    // Wrap Leonardo tool (most critical for retries)
    if (this.agent.leonardoToolInstance) {
      const originalExecute = this.agent.leonardoToolInstance.execute.bind(this.agent.leonardoToolInstance);
      this.agent.leonardoToolInstance.execute = async (...args) => {
        return await this.executeWithRetry('generate_leonardo_images', originalExecute, args);
      };
    }

    // Wrap other tools similarly
    if (this.agent.panelToolInstance) {
      const originalExecute = this.agent.panelToolInstance.execute.bind(this.agent.panelToolInstance);
      this.agent.panelToolInstance.execute = async (...args) => {
        return await this.executeWithRetry('generate_panels', originalExecute, args);
      };
    }

    if (this.agent.characterToolInstance) {
      const originalExecute = this.agent.characterToolInstance.execute.bind(this.agent.characterToolInstance);
      this.agent.characterToolInstance.execute = async (...args) => {
        return await this.executeWithRetry('generate_characters', originalExecute, args);
      };
    }
  }

  /**
   * Execute tool with retry logic and memory
   */
  async executeWithRetry(toolName, originalExecute, args) {
    const params = args[0] || {};
    
    console.log(chalk.cyan(`\n🧠 [Memory] Starting ${toolName} (attempt 1)`));
    this.memory.pushContext({ toolName, params, action: 'start' });

    let lastError = null;
    let lastResult = null;

    while (true) {
      try {
        // Execute the tool
        const result = await originalExecute(...args);
        
        // Evaluate result
        const evaluation = this.decisionEngine.evaluateResult(toolName, result);
        
        if (evaluation.success) {
          // Success!
          this.memory.recordAttempt(toolName, params, true, result);
          this.memory.learnSuccess(toolName, params, result);
          
          const attemptCount = this.memory.getAttemptCount(toolName);
          if (attemptCount > 1) {
            console.log(chalk.green(`✓ [Memory] ${toolName} succeeded after ${attemptCount} attempts`));
          }
          
          // Handle partial success (some panels failed)
          if (evaluation.partial && evaluation.shouldRetryFailed) {
            console.log(chalk.yellow(`⚠️  [Decision] Partial success detected`));
            console.log(chalk.yellow(`   ${evaluation.failedPanels.length} panels failed, will retry individually`));
            
            // Store successful result
            lastResult = result;
            
            // Retry failed panels individually
            await this.retryFailedPanels(evaluation.failedPanels, params);
          }
          
          return result;
        } else {
          // Tool reported failure
          throw new Error(evaluation.reason);
        }
      } catch (error) {
        lastError = error.message || String(error);
        
        // Record failed attempt
        this.memory.recordAttempt(toolName, params, false, null, lastError);
        this.memory.learnFailure(toolName, params, lastError);
        
        // Decide if should retry
        const decision = this.decisionEngine.shouldRetry(toolName, lastError);
        
        if (!decision.shouldRetry) {
          console.log(chalk.red(`❌ [Decision] Not retrying: ${decision.reason}`));
          
          // Get alternative approach
          const alternative = this.decisionEngine.getAlternativeApproach(
            toolName,
            this.memory.volatileMemory.toolAttempts[toolName]
          );
          
          console.log(chalk.yellow(`💡 [Decision] Alternative: ${alternative.approach}`));
          console.log(chalk.yellow(`   ${alternative.reason}`));
          
          // Return error result
          return JSON.stringify({
            success: false,
            error: lastError,
            attemptCount: this.memory.getAttemptCount(toolName),
            alternative,
          });
        }
        
        // Retry with strategy
        console.log(chalk.yellow(`🔄 [Decision] ${decision.reason}`));
        console.log(chalk.yellow(`   Strategy: ${decision.strategy.type}`));
        
        if (decision.strategy.reason) {
          console.log(chalk.gray(`   ${decision.strategy.reason}`));
        }
        
        // Apply modifications
        if (decision.strategy.modifications) {
          // Only modify if args[0] is an object (not a string or primitive)
          if (args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
            Object.assign(args[0], decision.strategy.modifications);
            console.log(chalk.gray(`   Modified params:`, JSON.stringify(decision.strategy.modifications, null, 2)));
          } else {
            console.log(chalk.gray(`   Cannot modify params (not an object)`));
          }
        }
        
        // Wait before retry
        if (decision.strategy.waitTime) {
          console.log(chalk.gray(`   Waiting ${decision.strategy.waitTime / 1000}s before retry...`));
          await new Promise((resolve) => setTimeout(resolve, decision.strategy.waitTime));
        }
        
        // Continue to next iteration (retry)
      }
    }
  }

  /**
   * Retry failed panels individually
   */
  async retryFailedPanels(failedPanels, originalParams) {
    console.log(chalk.cyan(`\n🔄 [Decision] Retrying ${failedPanels.length} failed panels individually...`));
    
    for (const panel of failedPanels) {
      try {
        console.log(chalk.yellow(`   Retrying ${panel.id}...`));
        
        // Call Leonardo tool with specificPanel parameter
        const result = await this.agent.leonardoTool.invoke({
          generateType: 'panels',
          specificPanel: panel.id,
        });
        
        const parsed = JSON.parse(result);
        if (parsed.success) {
          console.log(chalk.green(`   ✓ ${panel.id} succeeded on individual retry`));
        } else {
          console.log(chalk.red(`   ✗ ${panel.id} failed again: ${parsed.error}`));
        }
        
        // Wait between retries
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        console.log(chalk.red(`   ✗ ${panel.id} error: ${error.message}`));
      }
    }
  }

  /**
   * Get memory summary for display
   */
  getMemorySummary() {
    return this.memory.getSummary();
  }

  /**
   * Clear session memory
   */
  clearSession() {
    this.memory.clearVolatileMemory();
    console.log(chalk.gray('🧹 Session memory cleared'));
  }
}
