import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestLogger } from './request-logger.js';
import { resetMetrics, getMetrics } from '../services/metrics-service.js';

// Helpers – mirrors the pattern used in error-handler.test.ts
function mockReq(overrides: Record<string, any> = {}) {
  return {
    method: 'GET',
    url: '/api/test',
    originalUrl: '/api/test',
    ...overrides,
  } as any;
}

function mockRes() {
  const listeners: Record<string, Function[]> = {};
  const res: any = {
    statusCode: 200,
    on(event: string, cb: Function) {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(cb);
      return res;
    },
    emit(event: string) {
      (listeners[event] ?? []).forEach((cb) => cb());
    },
  };
  return res;
}

beforeEach(() => {
  resetMetrics();
  vi.restoreAllMocks();
});

describe('requestLogger middleware', () => {
  it('should log request details as JSON on response finish', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = requestLogger();
    const req = mockReq({ method: 'POST', originalUrl: '/api/projects' });
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    // Simulate response finishing
    res.statusCode = 201;
    res.emit('finish');

    expect(spy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(spy.mock.calls[0][0]);
    expect(logged.method).toBe('POST');
    expect(logged.path).toBe('/api/projects');
    expect(logged.statusCode).toBe(201);
    expect(typeof logged.durationMs).toBe('number');
    expect(logged.level).toBe('info');
  });

  it('should skip health check paths by default', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = requestLogger();
    const req = mockReq({ originalUrl: '/api/health' });
    const res = mockRes();

    middleware(req, res, vi.fn());
    res.emit('finish');

    expect(spy).not.toHaveBeenCalled();
  });

  it('should still record metrics for skipped paths', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = requestLogger();
    const req = mockReq({ originalUrl: '/api/health' });
    const res = mockRes();

    middleware(req, res, vi.fn());
    res.emit('finish');

    const metrics = getMetrics();
    expect(metrics.requests.total).toBe(1);
    expect(metrics.requests.byEndpoint['/api/health']).toBeDefined();
  });

  it('should allow custom skip paths', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = requestLogger({ skipPaths: ['/api/health', '/api/ping'] });
    const req = mockReq({ originalUrl: '/api/ping' });
    const res = mockRes();

    middleware(req, res, vi.fn());
    res.emit('finish');

    expect(spy).not.toHaveBeenCalled();
  });

  it('should log non-skipped paths', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = requestLogger({ skipPaths: ['/api/health'] });
    const req = mockReq({ originalUrl: '/api/schemas' });
    const res = mockRes();

    middleware(req, res, vi.fn());
    res.emit('finish');

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
