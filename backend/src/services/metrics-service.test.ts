import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordRequest,
  recordWebSocketConnection,
  getActiveConnections,
  getMetrics,
  resetMetrics,
} from './metrics-service.js';

beforeEach(() => {
  resetMetrics();
});

describe('recordRequest', () => {
  it('should track a single request', () => {
    recordRequest('/api/projects', 200, 42);

    const metrics = getMetrics();
    expect(metrics.requests.total).toBe(1);
    expect(metrics.requests.byEndpoint['/api/projects'].count).toBe(1);
    expect(metrics.requests.byEndpoint['/api/projects'].avg).toBe(42);
  });

  it('should track multiple requests and compute percentiles', () => {
    for (let i = 1; i <= 100; i++) {
      recordRequest('/api/data', 200, i);
    }

    const ep = getMetrics().requests.byEndpoint['/api/data'];
    expect(ep.count).toBe(100);
    expect(ep.avg).toBeCloseTo(50.5, 0);
    expect(ep.p50).toBe(50);
    expect(ep.p95).toBe(95);
    expect(ep.p99).toBe(99);
  });

  it('should accumulate status codes', () => {
    recordRequest('/api/x', 200, 10);
    recordRequest('/api/x', 200, 20);
    recordRequest('/api/x', 404, 5);

    const ep = getMetrics().requests.byEndpoint['/api/x'];
    expect(ep.statusCodes[200]).toBe(2);
    expect(ep.statusCodes[404]).toBe(1);
  });
});

describe('recordWebSocketConnection', () => {
  it('should increment and decrement connection count', () => {
    expect(getActiveConnections()).toBe(0);

    recordWebSocketConnection(1);
    recordWebSocketConnection(1);
    expect(getActiveConnections()).toBe(2);

    recordWebSocketConnection(-1);
    expect(getActiveConnections()).toBe(1);
  });

  it('should not go below zero', () => {
    recordWebSocketConnection(-1);
    expect(getActiveConnections()).toBe(0);
  });
});

describe('getMetrics', () => {
  it('should return empty snapshot when no data recorded', () => {
    const m = getMetrics();
    expect(m.requests.total).toBe(0);
    expect(Object.keys(m.requests.byEndpoint)).toHaveLength(0);
    expect(m.websocket.activeConnections).toBe(0);
    expect(m.collectedAt).toBeDefined();
  });

  it('should include websocket connections in snapshot', () => {
    recordWebSocketConnection(1);
    recordWebSocketConnection(1);
    recordWebSocketConnection(1);

    const m = getMetrics();
    expect(m.websocket.activeConnections).toBe(3);
  });
});

describe('resetMetrics', () => {
  it('should clear all data', () => {
    recordRequest('/api/a', 200, 10);
    recordWebSocketConnection(1);

    resetMetrics();

    const m = getMetrics();
    expect(m.requests.total).toBe(0);
    expect(m.websocket.activeConnections).toBe(0);
  });
});
