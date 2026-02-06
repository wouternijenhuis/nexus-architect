/**
 * Structured logger for the frontend application.
 *
 * Supports debug, info, warn, and error levels.
 * In production (import.meta.env.PROD) debug logs are suppressed.
 * The log level can also be overridden via VITE_LOG_LEVEL env variable.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function resolveMinLevel(): LogLevel {
  // Allow explicit override via environment variable
  const envLevel = (
    typeof import.meta !== 'undefined'
      ? (import.meta as any).env?.VITE_LOG_LEVEL
      : undefined
  ) as string | undefined;

  if (envLevel && envLevel in LOG_LEVELS) return envLevel as LogLevel;

  // Default: suppress debug in production
  const isProd =
    typeof import.meta !== 'undefined'
      ? (import.meta as any).env?.PROD
      : false;

  return isProd ? 'info' : 'debug';
}

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function formatEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
) {
  return {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...(context ? { context } : {}),
  };
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export function createLogger(minLevel?: LogLevel): Logger {
  const level = minLevel ?? resolveMinLevel();

  return {
    debug(message, context) {
      if (!shouldLog('debug', level)) return;
      console.debug(JSON.stringify(formatEntry('debug', message, context)));
    },
    info(message, context) {
      if (!shouldLog('info', level)) return;
      console.info(JSON.stringify(formatEntry('info', message, context)));
    },
    warn(message, context) {
      if (!shouldLog('warn', level)) return;
      console.warn(JSON.stringify(formatEntry('warn', message, context)));
    },
    error(message, context) {
      if (!shouldLog('error', level)) return;
      console.error(JSON.stringify(formatEntry('error', message, context)));
    },
  };
}

/** Default logger instance */
export const logger = createLogger();
