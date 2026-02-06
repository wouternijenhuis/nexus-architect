/**
 * Express middleware that logs every request in structured JSON.
 *
 * Logs method, path, status code and response time.
 * Health-check requests are skipped by default to reduce noise.
 */

import type { Request, Response, NextFunction } from 'express';
import { recordRequest } from '../services/metrics-service.js';

export interface RequestLoggerOptions {
  /** Paths to skip when logging (default: ['/api/health']) */
  skipPaths?: string[];
}

export function requestLogger(options: RequestLoggerOptions = {}) {
  const skipPaths = new Set(options.skipPaths ?? ['/api/health']);

  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    // Hook into the response `finish` event so we capture the final status code.
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const path = req.originalUrl || req.url;

      // Record in the metrics service regardless of logging
      recordRequest(path, res.statusCode, durationMs);

      if (skipPaths.has(path)) return;

      const entry = {
        level: 'info',
        timestamp: new Date().toISOString(),
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs,
      };

      console.log(JSON.stringify(entry));
    });

    next();
  };
}
