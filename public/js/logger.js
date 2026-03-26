/**
 * Logger Module
 * Centralized logging with different levels and formatting
 */

const Logger = {
  // Log levels
  LEVELS: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  },

  currentLevel: 0, // DEBUG by default
  logs: [],
  maxLogs: 500,
  enableConsole: true,
  enableStorage: true,

  /**
   * Set log level
   */
  setLevel(level) {
    if (typeof level === 'string') {
      this.currentLevel = this.LEVELS[level.toUpperCase()] || 0;
    } else {
      this.currentLevel = level;
    }
  },

  /**
   * Format log entry
   */
  formatEntry(level, message, data) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
  },

  /**
   * Log debug message
   */
  debug(message, data = null) {
    if (this.currentLevel <= this.LEVELS.DEBUG) {
      this.writeLog('DEBUG', message, data, '#7C7C7C');
    }
  },

  /**
   * Log info message
   */
  info(message, data = null) {
    if (this.currentLevel <= this.LEVELS.INFO) {
      this.writeLog('INFO', message, data, '#0099FF');
    }
  },

  /**
   * Log warning message
   */
  warn(message, data = null) {
    if (this.currentLevel <= this.LEVELS.WARN) {
      this.writeLog('WARN', message, data, '#FF9900');
    }
  },

  /**
   * Log error message
   */
  error(message, data = null) {
    if (this.currentLevel <= this.LEVELS.ERROR) {
      this.writeLog('ERROR', message, data, '#FF3333');
    }
  },

  /**
   * Write log entry
   */
  writeLog(level, message, data, color) {
    const entry = this.formatEntry(level, message, data);

    // Add to log history
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console
    if (this.enableConsole) {
      const style = `color: ${color}; font-weight: bold;`;
      const timestamp = entry.timestamp.split('T')[1].substring(0, 8);

      console.log(`%c[${timestamp}] [${level}]`, style, message);
      if (data) {
        console.log(data);
      }
    }

    // Store in localStorage (only errors)
    if (this.enableStorage && level === 'ERROR') {
      this.storeLog(entry);
    }
  },

  /**
   * Store log in localStorage
   */
  storeLog(entry) {
    try {
      const storedLogs = Storage.get('cashier_logs', true) || [];
      storedLogs.push(entry);

      // Keep only last 100 logs in storage
      if (storedLogs.length > 100) {
        storedLogs.shift();
      }

      Storage.set('cashier_logs', storedLogs);
    } catch (error) {
      console.error('Failed to store log:', error);
    }
  },

  /**
   * Get all logs
   */
  getLogs() {
    return this.logs;
  },

  /**
   * Get logs by level
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level.toUpperCase());
  },

  /**
   * Get logs with search
   */
  searchLogs(query) {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(log =>
      log.message.toLowerCase().includes(lowerQuery) ||
      JSON.stringify(log.data).toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
    Storage.remove('cashier_logs');
  },

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  },

  /**
   * Log API request
   */
  logRequest(method, endpoint, data = null) {
    this.info(`API Request: ${method} ${endpoint}`, data);
  },

  /**
   * Log API response
   */
  logResponse(method, endpoint, status, data = null) {
    const level = status >= 400 ? 'error' : 'info';
    this[level](`API Response: ${method} ${endpoint} (${status})`, data);
  },

  /**
   * Log action
   */
  logAction(action, details = null) {
    this.info(`Action: ${action}`, details);
  },

  /**
   * Log user activity
   */
  logActivity(activity, userId, details = null) {
    this.info(`Activity: ${activity} by ${userId}`, details);
  },

  /**
   * Log transaction
   */
  logTransaction(transactionId, amount, method, status) {
    this.info(`Transaction: ${transactionId}`, {
      amount,
      method,
      status,
    });
  },

  /**
   * Print logs to console (formatted)
   */
  printLogs() {
    console.table(this.logs);
  },

  /**
   * Print stats
   */
  printStats() {
    const stats = {
      'Total Logs': this.logs.length,
      'Debug': this.getLogsByLevel('DEBUG').length,
      'Info': this.getLogsByLevel('INFO').length,
      'Warnings': this.getLogsByLevel('WARN').length,
      'Errors': this.getLogsByLevel('ERROR').length,
    };
    console.table(stats);
  },
};
