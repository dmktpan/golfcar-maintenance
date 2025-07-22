// lib/utils/logger.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: number;
  action?: string;
}

class Logger {
  private static formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
  }

  static info(message: string, data?: any, userId?: number, action?: string) {
    const logEntry = this.formatMessage('info', message, data);
    if (userId) logEntry.userId = userId;
    if (action) logEntry.action = action;
    
    console.log(`[INFO] ${logEntry.timestamp}: ${message}`, data || '');
    
    // In production, you might want to send this to a logging service
    // await this.sendToLoggingService(logEntry);
  }

  static warn(message: string, data?: any, userId?: number, action?: string) {
    const logEntry = this.formatMessage('warn', message, data);
    if (userId) logEntry.userId = userId;
    if (action) logEntry.action = action;
    
    console.warn(`[WARN] ${logEntry.timestamp}: ${message}`, data || '');
  }

  static error(message: string, error?: any, userId?: number, action?: string) {
    const logEntry = this.formatMessage('error', message, error);
    if (userId) logEntry.userId = userId;
    if (action) logEntry.action = action;
    
    console.error(`[ERROR] ${logEntry.timestamp}: ${message}`, error || '');
  }

  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = this.formatMessage('debug', message, data);
      console.debug(`[DEBUG] ${logEntry.timestamp}: ${message}`, data || '');
    }
  }

  // Audit logging for important actions
  static audit(action: string, userId: number, details: any) {
    this.info(`Audit: ${action}`, details, userId, action);
  }
}

export default Logger;