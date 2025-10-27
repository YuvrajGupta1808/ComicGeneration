import fs from 'fs-extra';

/**
 * Context Memory System
 * Manages session data, project data, user preferences, and action history
 */
class ContextMemory {
  constructor() {
    this.sessionData = new Map();
    this.projectData = new Map();
    this.userPreferences = new Map();
    this.actionHistory = [];
    this.toolStates = new Map();
    this.contextFile = '.comic-agent-context.json';
    
    // Load existing context on initialization
    this.loadContext();
  }

  /**
   * Set context data in specified scope
   * @param {string} key - Context key
   * @param {any} value - Context value
   * @param {string} scope - Scope: 'session', 'project', 'preferences'
   */
  setContext(key, value, scope = 'session') {
    const target = this.getScopeMap(scope);
    target.set(key, value);
    this.saveContext();
  }

  /**
   * Get context data from specified scope
   * @param {string} key - Context key
   * @param {string} scope - Scope: 'session', 'project', 'preferences'
   * @returns {any} Context value
   */
  getContext(key, scope = 'session') {
    const target = this.getScopeMap(scope);
    return target.get(key);
  }

  /**
   * Get the appropriate scope map
   * @param {string} scope - Scope name
   * @returns {Map} Scope map
   */
  getScopeMap(scope) {
    switch (scope) {
      case 'session':
        return this.sessionData;
      case 'project':
        return this.projectData;
      case 'preferences':
        return this.userPreferences;
      default:
        return this.sessionData;
    }
  }

  /**
   * Project-specific context management
   * @param {string} projectName - Project name
   * @param {object} data - Project data
   */
  setProject(projectName, data) {
    this.projectData.set(projectName, data);
    this.saveContext();
  }

  /**
   * Get project data
   * @param {string} projectName - Project name
   * @returns {object} Project data
   */
  getProject(projectName) {
    return this.projectData.get(projectName);
  }

  /**
   * Add action to history
   * @param {string} action - Action name
   * @param {object} params - Action parameters
   * @param {object} result - Action result
   */
  addAction(action, params, result) {
    this.actionHistory.push({
      timestamp: new Date(),
      action,
      params,
      result,
      success: result.success !== false
    });
    
    // Keep only last 100 actions
    if (this.actionHistory.length > 100) {
      this.actionHistory = this.actionHistory.slice(-100);
    }
    
    this.saveContext();
  }

  /**
   * Get recent actions
   * @param {number} limit - Number of actions to return
   * @returns {Array} Recent actions
   */
  getRecentActions(limit = 10) {
    return this.actionHistory.slice(-limit);
  }

  /**
   * Set tool state
   * @param {string} toolName - Tool name
   * @param {object} state - Tool state
   */
  setToolState(toolName, state) {
    this.toolStates.set(toolName, state);
    this.saveContext();
  }

  /**
   * Get tool state
   * @param {string} toolName - Tool name
   * @returns {object} Tool state
   */
  getToolState(toolName) {
    return this.toolStates.get(toolName);
  }

  /**
   * Clear all context data
   */
  clearContext() {
    this.sessionData.clear();
    this.projectData.clear();
    this.userPreferences.clear();
    this.actionHistory = [];
    this.toolStates.clear();
    this.saveContext();
  }

  /**
   * Clear project-specific data
   * @param {string} projectName - Project name
   */
  clearProject(projectName) {
    this.projectData.delete(projectName);
    this.saveContext();
  }

  /**
   * Save context to file
   */
  saveContext() {
    try {
      const contextData = {
        sessionData: Object.fromEntries(this.sessionData),
        projectData: Object.fromEntries(this.projectData),
        userPreferences: Object.fromEntries(this.userPreferences),
        actionHistory: this.actionHistory,
        toolStates: Object.fromEntries(this.toolStates),
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(this.contextFile, JSON.stringify(contextData, null, 2));
    } catch (error) {
      console.warn('Failed to save context:', error.message);
    }
  }

  /**
   * Load context from file
   */
  loadContext() {
    try {
      if (fs.existsSync(this.contextFile)) {
        const contextData = JSON.parse(fs.readFileSync(this.contextFile, 'utf8'));
        
        this.sessionData = new Map(Object.entries(contextData.sessionData || {}));
        this.projectData = new Map(Object.entries(contextData.projectData || {}));
        this.userPreferences = new Map(Object.entries(contextData.userPreferences || {}));
        this.actionHistory = contextData.actionHistory || [];
        this.toolStates = new Map(Object.entries(contextData.toolStates || {}));
      }
    } catch (error) {
      console.warn('Failed to load context:', error.message);
      // Initialize with empty data if loading fails
      this.sessionData = new Map();
      this.projectData = new Map();
      this.userPreferences = new Map();
      this.actionHistory = [];
      this.toolStates = new Map();
    }
  }

  /**
   * Export context data
   * @returns {object} Context data
   */
  exportContext() {
    return {
      sessionData: Object.fromEntries(this.sessionData),
      projectData: Object.fromEntries(this.projectData),
      userPreferences: Object.fromEntries(this.userPreferences),
      actionHistory: this.actionHistory,
      toolStates: Object.fromEntries(this.toolStates)
    };
  }

  /**
   * Import context data
   * @param {object} contextData - Context data to import
   */
  importContext(contextData) {
    this.sessionData = new Map(Object.entries(contextData.sessionData || {}));
    this.projectData = new Map(Object.entries(contextData.projectData || {}));
    this.userPreferences = new Map(Object.entries(contextData.userPreferences || {}));
    this.actionHistory = contextData.actionHistory || [];
    this.toolStates = new Map(Object.entries(contextData.toolStates || {}));
    this.saveContext();
  }

  /**
   * Get session data
   * @returns {object} Session data
   */
  getSessionData() {
    return Object.fromEntries(this.sessionData);
  }

  /**
   * Get project data
   * @returns {object} Project data
   */
  getProjectData() {
    return Object.fromEntries(this.projectData);
  }

  /**
   * Get action history
   * @returns {Array} Action history
   */
  getActionHistory() {
    return this.actionHistory;
  }

  /**
   * Export context to file
   * @param {string} filename - Export filename
   */
  exportContextToFile(filename) {
    const contextData = this.exportContext();
    fs.writeFileSync(filename, JSON.stringify(contextData, null, 2));
  }
}

export { ContextMemory };
