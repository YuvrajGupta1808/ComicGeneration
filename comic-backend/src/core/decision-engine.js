/**
 * Decision Engine
 * Makes intelligent decisions about retries, parameter modifications, and alternative approaches
 */

export class DecisionEngine {
  constructor(memoryManager) {
    this.memory = memoryManager;
    this.maxRetries = {
      generate_leonardo_images: 3,
      generate_panels: 2,
      generate_characters: 2,
      place_dialogue_with_vision: 2,
      compose_pages: 2,
      default: 2,
    };
  }

  /**
   * Decide if should retry a failed operation
   */
  shouldRetry(toolName, error) {
    const attemptCount = this.memory.getAttemptCount(toolName);
    const maxRetries = this.maxRetries[toolName] || this.maxRetries.default;

    if (attemptCount >= maxRetries) {
      return {
        shouldRetry: false,
        reason: `Max retries (${maxRetries}) reached`,
      };
    }

    // Check error type
    if (this.isUnrecoverableError(error)) {
      return {
        shouldRetry: false,
        reason: 'Unrecoverable error detected',
        error,
      };
    }

    return {
      shouldRetry: true,
      reason: `Attempt ${attemptCount + 1}/${maxRetries}`,
      strategy: this.getRetryStrategy(toolName, error, attemptCount),
    };
  }

  /**
   * Check if error is unrecoverable
   */
  isUnrecoverableError(error) {
    const unrecoverablePatterns = [
      /api key/i,
      /authentication/i,
      /unauthorized/i,
      /not found/i,
      /invalid model/i,
      /quota exceeded/i,
    ];

    return unrecoverablePatterns.some((pattern) => pattern.test(error));
  }

  /**
   * Get retry strategy based on error and history
   */
  getRetryStrategy(toolName, error, attemptNumber) {
    const lastAttempt = this.memory.getLastAttempt(toolName);
    const historicalStrategy = this.memory.getRetryStrategy(toolName, lastAttempt?.params);

    // Leonardo-specific strategies
    if (toolName === 'generate_leonardo_images') {
      return this.getLeonardoRetryStrategy(error, attemptNumber, lastAttempt);
    }

    // Generic strategies
    if (error.includes('timeout') || error.includes('Timeout')) {
      return {
        type: 'increase_timeout',
        modifications: {
          timeout: (lastAttempt?.params?.timeout || 120) * 1.5,
        },
        waitTime: 5000 * (attemptNumber + 1), // Exponential backoff
      };
    }

    if (error.includes('rate limit')) {
      return {
        type: 'rate_limit_backoff',
        modifications: {},
        waitTime: 10000 * Math.pow(2, attemptNumber), // Exponential backoff
      };
    }

    // Use historical success if available
    if (historicalStrategy.strategy === 'use_successful_pattern') {
      return {
        type: 'use_historical_success',
        modifications: historicalStrategy.modifications,
        waitTime: 3000,
        confidence: historicalStrategy.confidence,
      };
    }

    // Default: modify parameters slightly
    return {
      type: 'modify_parameters',
      modifications: this.getParameterModifications(toolName, lastAttempt?.params),
      waitTime: 3000 * (attemptNumber + 1),
    };
  }

  /**
   * Leonardo-specific retry strategy
   */
  getLeonardoRetryStrategy(error, attemptNumber, lastAttempt) {
    const params = lastAttempt?.params || {};

    // Strategy 1: Reduce context images (might be causing issues)
    if (attemptNumber === 0 && params.contextImages?.length > 2) {
      return {
        type: 'reduce_context',
        modifications: {
          contextImages: params.contextImages.slice(0, 2),
        },
        waitTime: 5000,
        reason: 'Reducing context images to improve stability',
      };
    }

    // Strategy 2: Change seed for variation
    if (attemptNumber === 1) {
      return {
        type: 'change_seed',
        modifications: {
          seed: (params.seed || 18000) + Math.floor(Math.random() * 1000),
        },
        waitTime: 8000,
        reason: 'Changing seed for different generation',
      };
    }

    // Strategy 3: Simplify prompt
    if (attemptNumber === 2 && params.prompt) {
      return {
        type: 'simplify_prompt',
        modifications: {
          prompt: this.simplifyPrompt(params.prompt),
          contextImages: [], // Remove all context
        },
        waitTime: 10000,
        reason: 'Simplifying prompt and removing context',
      };
    }

    return {
      type: 'default_retry',
      modifications: {},
      waitTime: 5000 * (attemptNumber + 1),
    };
  }

  /**
   * Simplify a prompt by removing complex details
   */
  simplifyPrompt(prompt) {
    // Remove parenthetical details
    let simplified = prompt.replace(/\([^)]*\)/g, '');
    // Remove excessive adjectives
    simplified = simplified.replace(/\b(very|extremely|incredibly|absolutely)\b/gi, '');
    // Trim and clean
    simplified = simplified.replace(/\s+/g, ' ').trim();
    return simplified;
  }

  /**
   * Get parameter modifications for retry
   */
  getParameterModifications(toolName, currentParams = {}) {
    const modifications = { ...currentParams };

    // Add slight randomization to avoid exact same request
    if (modifications.seed) {
      modifications.seed += Math.floor(Math.random() * 100);
    }

    return modifications;
  }

  /**
   * Evaluate tool result and decide next action
   */
  evaluateResult(toolName, result, expectedOutcome = null) {
    try {
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;

      // Check for explicit success flag
      if (parsed.success === false) {
        return {
          success: false,
          shouldRetry: true,
          reason: parsed.error || 'Tool reported failure',
          result: parsed,
        };
      }

      // Leonardo-specific evaluation
      if (toolName === 'generate_leonardo_images') {
        return this.evaluateLeonardoResult(parsed);
      }

      // Generic success evaluation
      return {
        success: true,
        shouldRetry: false,
        result: parsed,
      };
    } catch (error) {
      return {
        success: false,
        shouldRetry: true,
        reason: `Failed to parse result: ${error.message}`,
        result,
      };
    }
  }

  /**
   * Evaluate Leonardo generation result
   */
  evaluateLeonardoResult(result) {
    const { results, summary } = result;

    if (!results) {
      return {
        success: false,
        shouldRetry: true,
        reason: 'No results returned',
      };
    }

    // Check panel generation success rate
    if (results.panels) {
      const total = results.panels.length;
      const failed = results.panels.filter((p) => p.error).length;
      const successRate = (total - failed) / total;

      if (successRate < 0.5) {
        // Less than 50% success
        return {
          success: false,
          shouldRetry: true,
          reason: `Low success rate: ${Math.round(successRate * 100)}%`,
          partialResults: results,
          failedPanels: results.panels.filter((p) => p.error),
        };
      }

      if (failed > 0) {
        // Partial success
        return {
          success: true,
          partial: true,
          shouldRetryFailed: true,
          reason: `${failed} panels failed, ${total - failed} succeeded`,
          failedPanels: results.panels.filter((p) => p.error),
          successfulPanels: results.panels.filter((p) => !p.error),
        };
      }
    }

    return {
      success: true,
      shouldRetry: false,
      result,
    };
  }

  /**
   * Decide on alternative approach if retries fail
   */
  getAlternativeApproach(toolName, allAttempts) {
    if (toolName === 'generate_leonardo_images') {
      return {
        approach: 'generate_individually',
        reason: 'Batch generation failed, try generating panels one by one',
        strategy: 'Use specificPanel parameter for each failed panel',
      };
    }

    return {
      approach: 'manual_intervention',
      reason: 'All automatic retries failed',
      suggestion: 'Review parameters and try with different settings',
    };
  }
}
