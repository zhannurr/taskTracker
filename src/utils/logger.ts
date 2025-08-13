export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private isDevelopment: boolean = __DEV__;

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: LogLevel, message: string, data?: any, error?: Error): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    
    let formattedMessage = `[${timestamp}] [${levelName}] ${message}`;
    
    if (data) {
      formattedMessage += ` | Data: ${JSON.stringify(data, null, 2)}`;
    }
    
    if (error) {
      formattedMessage += ` | Error: ${error.message}`;
      if (error.stack) {
        formattedMessage += ` | Stack: ${error.stack}`;
      }
    }
    
    return formattedMessage;
  }

  private addToLogs(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  debug(message: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        message,
        data
      };
      
      this.addToLogs(entry);
      
      if (this.isDevelopment) {
        console.log(`🐛 ${message}`, data);
      }
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message,
        data
      };
      
      this.addToLogs(entry);
      
      if (this.isDevelopment) {
        console.info(`ℹ️ ${message}`, data);
      }
    }
  }

  warn(message: string, data?: any, error?: Error) {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.WARN,
        message,
        data,
        error
      };
      
      this.addToLogs(entry);
      
      if (this.isDevelopment) {
        console.warn(`⚠️ ${message}`, data, error);
      }
    }
  }

  error(message: string, error?: Error, data?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.ERROR,
        message,
        data,
        error
      };
      
      this.addToLogs(entry);
      
      if (this.isDevelopment) {
        console.error(`❌ ${message}`, error, data);
      }
    }
  }

  // Method to get all logs (useful for debugging)
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Method to get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Method to clear logs
  clearLogs() {
    this.logs = [];
  }

  // Method to export logs (useful for debugging)
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Method to get logs as formatted string
  getLogsAsString(): string {
    return this.logs
      .map(log => this.formatMessage(log.level, log.message, log.data, log.error))
      .join('\n');
  }
}

// Create and export a singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (message: string, data?: any) => logger.debug(message, data);
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logWarn = (message: string, data?: any, error?: Error) => logger.warn(message, data, error);
export const logError = (message: string, error?: Error, data?: any) => logger.error(message, error, data);

// Set default log level based on environment
if (__DEV__) {
  logger.setLogLevel(LogLevel.DEBUG);
} else {
  logger.setLogLevel(LogLevel.WARN);
}
