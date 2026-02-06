import { describe, it, expect, vi } from 'vitest';
import { AppError, asyncHandler, errorHandler, notFoundHandler } from './error-handler.js';

// Helpers to create mock Express objects
function mockReq(overrides: Record<string, any> = {}) {
  return { method: 'GET', path: '/api/test', body: {}, ...overrides } as any;
}

function mockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
  };
  return res;
}

describe('AppError', () => {
  it('should create error with defaults', () => {
    const err = new AppError('test');
    expect(err.message).toBe('test');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.name).toBe('AppError');
  });

  it('should create error with custom values', () => {
    const err = new AppError('not found', 404, 'NOT_FOUND', { id: '1' });
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.context).toEqual({ id: '1' });
  });
});

describe('asyncHandler', () => {
  it('should pass through successful handlers', async () => {
    const handler = asyncHandler(async (_req, res) => {
      res.json({ ok: true });
    });

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await handler(req, res, next);
    expect(res.body).toEqual({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  it('should forward errors to next()', async () => {
    const error = new Error('boom');
    const handler = asyncHandler(async () => {
      throw error;
    });

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('errorHandler', () => {
  it('should handle AppError with custom status', () => {
    const err = new AppError('not found', 404, 'NOT_FOUND');
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
    expect(res.body.message).toBe('not found');

    consoleSpy.mockRestore();
  });

  it('should handle AppError with context', () => {
    const err = new AppError('validation failed', 400, 'VALIDATION_ERROR', { field: 'name' });
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body.details).toEqual({ field: 'name' });

    consoleSpy.mockRestore();
  });

  it('should handle generic Error as 500', () => {
    const err = new Error('something broke');
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('INTERNAL_ERROR');

    consoleSpy.mockRestore();
  });

  it('should handle SyntaxError (JSON parse)', () => {
    const err = Object.assign(new SyntaxError('Unexpected token'), { body: '' });
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('PARSE_ERROR');

    consoleSpy.mockRestore();
  });
});

describe('notFoundHandler', () => {
  it('should return 404 with route info', () => {
    const req = mockReq({ method: 'GET', path: '/api/nonexistent' });
    const res = mockRes();

    notFoundHandler(req, res);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
    expect(res.body.message).toContain('GET');
    expect(res.body.message).toContain('/api/nonexistent');
  });
});
