/**
 * Professional Logger
 * Provides structured logging with different levels and formats
 */

import fs from 'fs-extra';
import path from 'path';

export class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.format = options.format || 'colored';
    this.logFile = options.file || 'comic-agent.log';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    // Ensure log directory exists
    if (this.logFile) {
      const logDir = path.dirname(this.logFile);
      fs.ensureDirSync(logDir);
    }
  }

  /**
   * Log a message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} meta - Additional metadata
   */
  log(level, message, meta = {}) {
    if (this.levels[level] > this.levels[this.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    // Console output
    this.logToConsole(level, message, meta);

    // File output
    if (this.logFile) {
      this.logToFile(logEntry);
    }
  }

  /**
   * Log to console with colors
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} meta - Additional metadata
   */
  logToConsole(level, message, meta) {
    const timestamp = new Date().toLocaleTimeString();
    let formattedMessage;

    if (this.format === 'colored') {
      const colors = {
        error: '\x1b[31m', // Red
        warn: '\x1b[33m',  // Yellow
        info: '\x1b[36m',  // Cyan
        debug: '\x1b[37m'  // White
      };
      const reset = '\x1b[0m';
      
      formattedMessage = `${colors[level]}[${level.toUpperCase()}]${reset} ${message}`;
    } else {
      formattedMessage = `[${level.toUpperCase()}] ${message}`;
    }

    console.log(`${timestamp} ${formattedMessage}`);
    
    if (Object.keys(meta).length > 0) {
      console.log('  Metadata:', JSON.stringify(meta, null, 2));
    }
  }

  /**
   * Log to file
   * @param {object} logEntry - Log entry object
   */
  logToFile(logEntry) {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {object} meta - Additional metadata
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {object} meta - Additional metadata
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * Set log level
   * @param {string} level - New log level
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.level = level;
    } else {
      throw new Error(`Invalid log level: ${level}`);
    }
  }

  /**
   * Get current log level
   * @returns {string} Current log level
   */
  getLevel() {
    return this.level;
  }

  /**
   * Clear log file
   */
  clearLog() {
    if (this.logFile && fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '');
    }
  }

  /**
   * Get log file path
   * @returns {string} Log file path
   */
  getLogFile() {
    return this.logFile;
  }
}
