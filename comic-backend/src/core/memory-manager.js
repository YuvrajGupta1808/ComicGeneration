/**
 * Memory Manager
 * Handles persistent (fixed) and volatile (session) memory for the agent
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MemoryManager {
  constructor() {
    this.memoryPath = path.join(__dirname, '../../config/agent-memory.json');
    this.persistentMemory = this.loadPersistentMemory();
    this.volatileMemory = this.initVolatileMemory();
  }

  /**
   * Initialize volatile (session) memory
   */
  initVolatileMemory() {
    return {
      sessionId: Date.now(),
      toolAttempts: {}, // Track retry attempts per tool
      toolResults: {}, // Store intermediate results
      failedOperations: [], // Track what failed
      successfulStrategies: [], // Track what worked this session
      contextStack: [], // Working memory for current task
    };
  }

  /**
   * Load persistent memory from disk
   */
  loadPersistentMemory() {
    try {
      if (fs.existsSync(this.memoryPath)) {
        return fs.readJsonSync(this.memoryPath);
      }
    } catch (error) {
      console.warn('⚠️  Failed to load persistent memory:', error.message);
    }

    // Default persistent memory structure
    return {
      successfulPrompts: {}, // Prompts that worked well
      failurePatterns: {}, // Common failure patterns
      toolPreferences: {}, // Preferred parameters per tool
      characterDescriptions: {}, // Successful character descriptions
      stylePreferences: {}, // Art style preferences that worked
      retryStrategies: {}, // What retry strategies worked
      lastUpdated: null,
    };
  }

  /**
   * Save persistent memory to disk
   */
  savePersistentMemory() {
    try {
      this.persistentMemory.lastUpdated = new Date().toISOString();
      fs.writeJsonSync(this.memoryPath, this.persistentMemory, { spaces: 2 });
    } catch (error) {
      console.error('❌ Failed to save persistent memory:', error.message);
    }
  }

  /**
   * Record a tool attempt
   */
  recordAttempt(toolName, params, success, result = null, error = null) {
    const key = `${toolName}_${Date.now()}`;
    
    if (!this.volatileMemory.toolAttempts[toolName]) {
      this.volatileMemory.toolAttempts[toolName] = [];
    }

    const attempt = {
      timestamp: Date.now(),
      params,
      success,
      result,
      error,
      attemptNumber: this.volatileMemory.toolAttempts[toolName].length + 1,
    };

    this.volatileMemory.toolAttempts[toolName].push(attempt);

    if (!success) {
      this.volatileMemory.failedOperations.push({
        toolName,
        params,
        error,
        timestamp: Date.now(),
      });
    } else {
      this.volatileMemory.successfulStrategies.push({
        toolName,
        params,
        result,
        timestamp: Date.now(),
      });
    }

    return attempt;
  }

  /**
   * Get attempt count for a tool
   */
  getAttemptCount(toolName) {
    return this.volatileMemory.toolAttempts[toolName]?.length || 0;
  }

  /**
   * Get last attempt for a tool
   */
  getLastAttempt(toolName) {
    const attempts = this.volatileMemory.toolAttempts[toolName];
    return attempts?.[attempts.length - 1] || null;
  }

  /**
   * Check if should retry based on attempt history
   */
  shouldRetry(toolName, maxRetries = 3) {
    const count = this.getAttemptCount(toolName);
    return count < maxRetries;
  }

  /**
   * Learn from successful operation
   */
  learnSuccess(toolName, params, result) {
    if (!this.persistentMemory.toolPreferences[toolName]) {
      this.persistentMemory.toolPreferences[toolName] = {
        successCount: 0,
        successfulParams: [],
      };
    }

    this.persistentMemory.toolPreferences[toolName].successCount++;
    this.persistentMemory.toolPreferences[toolName].successfulParams.push({
      params,
      timestamp: Date.now(),
    });

    // Keep only last 10 successful params
    if (this.persistentMemory.toolPreferences[toolName].successfulParams.length > 10) {
      this.persistentMemory.toolPreferences[toolName].successfulParams.shift();
    }

    this.savePersistentMemory();
  }

  /**
   * Learn from failure
   */
  learnFailure(toolName, params, error) {
    if (!this.persistentMemory.failurePatterns[toolName]) {
      this.persistentMemory.failurePatterns[toolName] = {
        failureCount: 0,
        commonErrors: {},
      };
    }

    this.persistentMemory.failurePatterns[toolName].failureCount++;
    
    const errorKey = error.substring(0, 50); // First 50 chars as key
    if (!this.persistentMemory.failurePatterns[toolName].commonErrors[errorKey]) {
      this.persistentMemory.failurePatterns[toolName].commonErrors[errorKey] = {
        count: 0,
        fullError: error,
      };
    }
    this.persistentMemory.failurePatterns[toolName].commonErrors[errorKey].count++;

    this.savePersistentMemory();
  }

  /**
   * Get suggested retry strategy based on history
   */
  getRetryStrategy(toolName, currentParams) {
    const prefs = this.persistentMemory.toolPreferences[toolName];
    const failures = this.persistentMemory.failurePatterns[toolName];

    if (!prefs || !prefs.successfulParams.length) {
      return { strategy: 'default', modifications: {} };
    }

    // Get most recent successful params
    const recentSuccess = prefs.successfulParams[prefs.successfulParams.length - 1];
    
    return {
      strategy: 'use_successful_pattern',
      modifications: recentSuccess.params,
      confidence: prefs.successCount / (prefs.successCount + (failures?.failureCount || 0)),
    };
  }

  /**
   * Store context in working memory
   */
  pushContext(context) {
    this.volatileMemory.contextStack.push({
      ...context,
      timestamp: Date.now(),
    });

    // Keep stack manageable
    if (this.volatileMemory.contextStack.length > 20) {
      this.volatileMemory.contextStack.shift();
    }
  }

  /**
   * Get recent context
   */
  getRecentContext(count = 5) {
    return this.volatileMemory.contextStack.slice(-count);
  }

  /**
   * Clear volatile memory (new session)
   */
  clearVolatileMemory() {
    this.volatileMemory = this.initVolatileMemory();
  }

  /**
   * Get memory summary
   */
  getSummary() {
    return {
      persistent: {
        totalSuccesses: Object.values(this.persistentMemory.toolPreferences).reduce(
          (sum, tool) => sum + (tool.successCount || 0),
          0
        ),
        totalFailures: Object.values(this.persistentMemory.failurePatterns).reduce(
          (sum, tool) => sum + (tool.failureCount || 0),
          0
        ),
        lastUpdated: this.persistentMemory.lastUpdated,
      },
      volatile: {
        sessionId: this.volatileMemory.sessionId,
        totalAttempts: Object.values(this.volatileMemory.toolAttempts).reduce(
          (sum, attempts) => sum + attempts.length,
          0
        ),
        failedOperations: this.volatileMemory.failedOperations.length,
        successfulStrategies: this.volatileMemory.successfulStrategies.length,
      },
    };
  }
}
