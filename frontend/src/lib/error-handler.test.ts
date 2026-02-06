import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AppError,
  ERROR_CODES,
  handleApiError,
  addToast,
  removeToast,
  subscribeToToasts,
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  safeLocalStorage,
} from './error-handler';

describe('AppError', () => {
  it('should create an error with default values', () => {
    const err = new AppError('something broke');
    expect(err.message).toBe('something broke');
    expect(err.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
    expect(err.statusCode).toBeUndefined();
    expect(err.name).toBe('AppError');
    expect(err.timestamp).toBeTruthy();
  });

  it('should create an error with all fields', () => {
    const err = new AppError('not found', ERROR_CODES.NOT_FOUND, 404, { id: '123' });
    expect(err.code).toBe('NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.context).toEqual({ id: '123' });
  });

  it('should provide a user-friendly message', () => {
    const err = new AppError('technical details', ERROR_CODES.RATE_LIMIT, 429);
    expect(err.userMessage).toBe('Too many requests. Please slow down and try again later.');
  });

  it('should fall back to raw message for unknown codes', () => {
    const err = new AppError('custom error', 'CUSTOM_CODE' as any);
    expect(err.userMessage).toBe('custom error');
  });
});

describe('handleApiError', () => {
  it('should return AppError as-is', () => {
    const original = new AppError('test', ERROR_CODES.NOT_FOUND, 404);
    expect(handleApiError(original)).toBe(original);
  });

  it('should handle TypeError with fetch', () => {
    const err = new TypeError('Failed to fetch');
    const result = handleApiError(err);
    expect(result.code).toBe(ERROR_CODES.NETWORK_ERROR);
  });

  it('should handle SyntaxError', () => {
    const err = new SyntaxError('Unexpected token');
    const result = handleApiError(err);
    expect(result.code).toBe(ERROR_CODES.PARSE_ERROR);
  });

  it('should handle DOMException abort', () => {
    const err = new DOMException('aborted', 'AbortError');
    const result = handleApiError(err);
    expect(result.code).toBe(ERROR_CODES.TIMEOUT);
  });

  it('should handle generic Error', () => {
    const err = new Error('oops');
    const result = handleApiError(err);
    expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
    expect(result.message).toBe('oops');
  });

  it('should handle non-Error values', () => {
    const result = handleApiError('string error');
    expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
    expect(result.message).toBe('string error');
  });
});

describe('Toast System', () => {
  beforeEach(() => {
    // Clear all toasts by subscribing and removing them
    let current: any[] = [];
    const unsub = subscribeToToasts((t) => { current = t; });
    current.forEach((t) => removeToast(t.id));
    unsub();
  });

  it('should add and remove toasts', () => {
    let toasts: any[] = [];
    const unsub = subscribeToToasts((t) => { toasts = t; });

    const id = addToast('test message', 'error', 0); // duration 0 = no auto-remove
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('test message');
    expect(toasts[0].type).toBe('error');

    removeToast(id);
    expect(toasts).toHaveLength(0);

    unsub();
  });

  it('should auto-remove toasts after duration', () => {
    vi.useFakeTimers();
    let toasts: any[] = [];
    const unsub = subscribeToToasts((t) => { toasts = t; });

    addToast('temp', 'info', 1000);
    expect(toasts).toHaveLength(1);

    vi.advanceTimersByTime(1100);
    expect(toasts).toHaveLength(0);

    unsub();
    vi.useRealTimers();
  });

  it('should notify listeners on changes', () => {
    const listener = vi.fn();
    const unsub = subscribeToToasts(listener);

    // Called once immediately on subscribe
    expect(listener).toHaveBeenCalledTimes(1);

    addToast('msg', 'success', 0);
    expect(listener).toHaveBeenCalledTimes(2);

    unsub();
  });

  it('showErrorToast should log and create error toast', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let toasts: any[] = [];
    const unsub = subscribeToToasts((t) => { toasts = t; });

    showErrorToast(new Error('test'));
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('error');
    expect(consoleSpy).toHaveBeenCalled();

    unsub();
    consoleSpy.mockRestore();
  });

  it('showSuccessToast should create success toast', () => {
    let toasts: any[] = [];
    const unsub = subscribeToToasts((t) => { toasts = t; });

    showSuccessToast('done!');
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('done!');

    unsub();
  });

  it('showWarningToast should create warning toast', () => {
    let toasts: any[] = [];
    const unsub = subscribeToToasts((t) => { toasts = t; });

    showWarningToast('careful!');
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('warning');

    unsub();
  });
});

describe('safeLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should get and set values', () => {
    const setResult = safeLocalStorage('key', 'set', { a: 1 });
    expect(setResult).toBe(true);

    const getResult = safeLocalStorage<{ a: number }>('key', 'get');
    expect(getResult).toEqual({ a: 1 });
  });

  it('should return null for missing keys', () => {
    const result = safeLocalStorage('nonexistent', 'get');
    expect(result).toBeNull();
  });
});
