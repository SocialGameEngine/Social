/**
 * Environment-aware logging utilities
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment && level !== 'error') {
      return false;
    }
    return true;
  }

  private formatMessage(level: LogLevel, message: string, context?: LoggerContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LoggerContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LoggerContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LoggerContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LoggerContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, context?: LoggerContext) => logger.debug(message, context),
  info: (message: string, context?: LoggerContext) => logger.info(message, context),
  warn: (message: string, context?: LoggerContext) => logger.warn(message, context),
  error: (message: string, context?: LoggerContext) => logger.error(message, context),
};
