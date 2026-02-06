/**
 * In-memory metrics collection service.
 *
 * Tracks request counts, response-time histograms, and active WebSocket
 * connections.  All data lives in memory and resets on restart – no
 * external dependencies required.
 */

interface EndpointMetrics {
  count: number;
  statusCodes: Record<number, number>;
  durations: number[];
}

interface MetricsSnapshot {
  requests: {
    total: number;
    byEndpoint: Record<
      string,
      {
        count: number;
        statusCodes: Record<number, number>;
        avg: number;
        p50: number;
        p95: number;
        p99: number;
      }
    >;
  };
  websocket: {
    activeConnections: number;
  };
  collectedAt: string;
}

const endpoints: Map<string, EndpointMetrics> = new Map();
let activeWebSocketConnections = 0;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

/**
 * Record a completed HTTP request.
 */
export function recordRequest(
  path: string,
  statusCode: number,
  durationMs: number,
): void {
  let entry = endpoints.get(path);
  if (!entry) {
    entry = { count: 0, statusCodes: {}, durations: [] };
    endpoints.set(path, entry);
  }

  entry.count += 1;
  entry.statusCodes[statusCode] = (entry.statusCodes[statusCode] ?? 0) + 1;
  entry.durations.push(durationMs);

  // Cap stored durations to avoid unbounded memory growth
  if (entry.durations.length > 10_000) {
    entry.durations = entry.durations.slice(-5_000);
  }
}

/**
 * Adjust the active WebSocket connection counter.
 *
 * @param delta  +1 for a new connection, -1 for a disconnect
 */
export function recordWebSocketConnection(delta: 1 | -1): void {
  activeWebSocketConnections = Math.max(0, activeWebSocketConnections + delta);
}

/**
 * Return the current active WebSocket connection count.
 */
export function getActiveConnections(): number {
  return activeWebSocketConnections;
}

/**
 * Return a snapshot of all collected metrics.
 */
export function getMetrics(): MetricsSnapshot {
  let total = 0;
  const byEndpoint: MetricsSnapshot['requests']['byEndpoint'] = {};

  for (const [path, entry] of endpoints) {
    total += entry.count;
    const sorted = [...entry.durations].sort((a, b) => a - b);
    const avg =
      sorted.length > 0
        ? sorted.reduce((s, v) => s + v, 0) / sorted.length
        : 0;

    byEndpoint[path] = {
      count: entry.count,
      statusCodes: { ...entry.statusCodes },
      avg: Math.round(avg * 100) / 100,
      p50: Math.round(percentile(sorted, 50) * 100) / 100,
      p95: Math.round(percentile(sorted, 95) * 100) / 100,
      p99: Math.round(percentile(sorted, 99) * 100) / 100,
    };
  }

  return {
    requests: { total, byEndpoint },
    websocket: { activeConnections: activeWebSocketConnections },
    collectedAt: new Date().toISOString(),
  };
}

/**
 * Reset all collected metrics.  Useful for testing.
 */
export function resetMetrics(): void {
  endpoints.clear();
  activeWebSocketConnections = 0;
}
