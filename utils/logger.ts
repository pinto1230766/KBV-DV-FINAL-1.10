/**
 * Système de logging sécurisé
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private sanitizeLogData(data: any): any {
    if (typeof data === 'string') {
      // Supprimer les données sensibles des logs
      return data
        .replace(/password[=:]\s*[^\s&]+/gi, 'password=***')
        .replace(/token[=:]\s*[^\s&]+/gi, 'token=***')
        .replace(/key[=:]\s*[^\s&]+/gi, 'key=***');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'credential'];
      
      for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '***';
        }
      }
      
      return sanitized;
    }
    
    return data;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message: this.sanitizeLogData(message),
      timestamp: new Date().toISOString(),
      context: context ? this.sanitizeLogData(context) : undefined
    };

    if (this.isDevelopment) {
      console[level === 'debug' ? 'log' : level](
        `[${entry.timestamp}] ${level.toUpperCase()}: ${entry.message}`,
        entry.context || ''
      );
    }

    // En production, on pourrait envoyer les logs vers un service externe
    // comme Sentry, LogRocket, etc.
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      } : undefined
    });
  }
}

export const logger = new Logger();