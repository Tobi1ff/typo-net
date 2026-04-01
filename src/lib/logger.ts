// Simple structured logger for the frontend
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const log = (level: LogLevel, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...(data && { data }),
  };

  const style = {
    info: 'color: #00ff00',
    warn: 'color: #ffff00',
    error: 'color: #ff0000',
    debug: 'color: #00ffff',
  }[level];

  console.log(`%c[${timestamp}] [${level.toUpperCase()}] ${message}`, style, data || '');
  
  // In a real app, you'd send this to a remote logging service (e.g., Sentry, Loggly)
  // if (level === 'error') {
  //   sendToRemote(logEntry);
  // }
};

export const logger = {
  info: (message: string, data?: any) => log('info', message, data),
  warn: (message: string, data?: any) => log('warn', message, data),
  error: (message: string, data?: any) => log('error', message, data),
  debug: (message: string, data?: any) => log('debug', message, data),
};
