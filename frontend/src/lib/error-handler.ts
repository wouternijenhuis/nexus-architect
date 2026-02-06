/**
 * Application error handling utilities.
 *
 * Provides a structured error class, error handler for API calls,
 * and a simple toast notification system.
 */

// Error code constants
export const ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_CODES.RATE_LIMIT]: 'Too many requests. Please slow down and try again later.',
  [ERROR_CODES.SERVER_ERROR]: 'A server error occurred. Please try again later.',
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [ERROR_CODES.TIMEOUT]: 'The request timed out. Please try again.',
  [ERROR_CODES.QUOTA_EXCEEDED]: 'Storage limit exceeded. Please delete some data.',
  [ERROR_CODES.PARSE_ERROR]: 'Failed to parse the data. Please check the file format.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Invalid input. Please check your data and try again.',
  [ERROR_CODES.AUTH_ERROR]: 'Authentication required. Please log in.',
  [ERROR_CODES.WEBSOCKET_ERROR]: 'Real-time connection error. Collaboration features may be unavailable.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred.',
};

/**
 * Application-level error with structured information.
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode?: number;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: ErrorCode = ERROR_CODES.UNKNOWN_ERROR,
    statusCode?: number,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }

  /** Get user-friendly message */
  get userMessage(): string {
    return ERROR_MESSAGES[this.code] || this.message;
  }
}

/**
 * Convert any error into a structured AppError.
 */
export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // Fetch API errors
  if (error instanceof Response) {
    const status = error.status;
    if (status === 401 || status === 403) {
      return new AppError('Authentication required', ERROR_CODES.AUTH_ERROR, status);
    }
    if (status === 404) {
      return new AppError('Resource not found', ERROR_CODES.NOT_FOUND, 404);
    }
    if (status === 429) {
      return new AppError('Rate limit exceeded', ERROR_CODES.RATE_LIMIT, 429);
    }
    if (status >= 500) {
      return new AppError('Server error', ERROR_CODES.SERVER_ERROR, status);
    }
    return new AppError(`HTTP error ${status}`, ERROR_CODES.UNKNOWN_ERROR, status);
  }

  // Standard Error objects
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError('Network connection failed', ERROR_CODES.NETWORK_ERROR);
  }

  if (error instanceof DOMException) {
    if (error.name === 'AbortError') {
      return new AppError('Request was cancelled', ERROR_CODES.TIMEOUT);
    }
    if (error.code === 22 || error.name === 'QuotaExceededError') {
      return new AppError('Storage quota exceeded', ERROR_CODES.QUOTA_EXCEEDED);
    }
  }

  if (error instanceof SyntaxError) {
    return new AppError('Invalid data format', ERROR_CODES.PARSE_ERROR);
  }

  if (error instanceof Error) {
    return new AppError(error.message, ERROR_CODES.UNKNOWN_ERROR);
  }

  return new AppError(String(error), ERROR_CODES.UNKNOWN_ERROR);
}

// --- Toast Notification System ---

export type ToastType = 'error' | 'warning' | 'info' | 'success';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

type ToastListener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners: Set<ToastListener> = new Set();
let nextId = 0;

function notifyListeners() {
  listeners.forEach((fn) => fn([...toasts]));
}

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  listener([...toasts]);
  return () => {
    listeners.delete(listener);
  };
}

export function addToast(message: string, type: ToastType = 'error', duration = 5000): string {
  const id = `toast-${++nextId}`;
  const toast: Toast = { id, type, message, duration };
  toasts = [...toasts, toast];
  notifyListeners();

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }

  return id;
}

export function removeToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

/** Show an error toast from any error type */
export function showErrorToast(error: unknown): void {
  const appError = error instanceof AppError ? error : handleApiError(error);
  addToast(appError.userMessage, 'error');
  console.error(`[${appError.code}]`, appError.message, appError.context);
}

/** Show a success toast */
export function showSuccessToast(message: string): void {
  addToast(message, 'success', 3000);
}

/** Show a warning toast */
export function showWarningToast(message: string): void {
  addToast(message, 'warning', 4000);
}

/**
 * Safe wrapper for localStorage operations.
 */
export function safeLocalStorage<T>(key: string, operation: 'get'): T | null;
export function safeLocalStorage<T>(key: string, operation: 'set', value: T): boolean;
export function safeLocalStorage<T>(key: string, operation: 'get' | 'set', value?: T): T | null | boolean {
  try {
    if (operation === 'get') {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } else {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
  } catch (error) {
    if (operation === 'set') {
      showErrorToast(new AppError('Failed to save data', ERROR_CODES.QUOTA_EXCEEDED));
      return false;
    }
    console.error(`[localStorage] Error reading key "${key}":`, error);
    return null;
  }
}
