import { Request, Response, NextFunction } from 'express';

/**
 * Structured application error for the backend.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.context = context;
  }
}

/**
 * Wrap async route handlers to catch errors and forward to error middleware.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handling middleware. Must be registered after all routes.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error with request context
  console.error('[Error]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    message: err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.context && { details: err.context }),
    });
  }

  // Joi validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: err.message,
    });
  }

  // SyntaxError from malformed JSON body
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'PARSE_ERROR',
      message: 'Invalid JSON in request body',
    });
  }

  // Default: Internal Server Error (don't leak details in production)
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
  });
}

/**
 * 404 handler for unknown routes. Register after all valid routes.
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
}
