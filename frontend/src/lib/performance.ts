/**
 * Lightweight client-side performance monitoring.
 *
 * Uses the PerformanceObserver API to collect Web Vitals (LCP, FID, CLS)
 * and provides helpers for custom timing marks.
 */

export interface WebVitalEntry {
  name: string;
  value: number;
  timestamp: number;
}

export interface CustomMark {
  name: string;
  durationMs: number;
  timestamp: number;
}

interface PerformanceReport {
  webVitals: WebVitalEntry[];
  customMarks: CustomMark[];
  collectedAt: string;
}

const webVitals: WebVitalEntry[] = [];
const customMarks: CustomMark[] = [];
const pendingMarks: Map<string, number> = new Map();

/**
 * Start a custom timing mark.
 */
export function startMark(name: string): void {
  pendingMarks.set(name, performance.now());
}

/**
 * End a custom timing mark and record its duration.
 * Returns the duration in ms, or -1 if no matching start was found.
 */
export function endMark(name: string): number {
  const start = pendingMarks.get(name);
  if (start === undefined) return -1;

  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  pendingMarks.delete(name);

  customMarks.push({ name, durationMs, timestamp: Date.now() });
  return durationMs;
}

/**
 * Return a snapshot of all collected performance data.
 */
export function getPerformanceReport(): PerformanceReport {
  return {
    webVitals: [...webVitals],
    customMarks: [...customMarks],
    collectedAt: new Date().toISOString(),
  };
}

/**
 * Reset all collected data.  Useful for testing.
 */
export function resetPerformanceData(): void {
  webVitals.length = 0;
  customMarks.length = 0;
  pendingMarks.clear();
}

// Expose for testing – allows manual push of a vital entry.
export function _recordVital(entry: WebVitalEntry): void {
  webVitals.push(entry);
}

/**
 * Initialise PerformanceObserver-based Web Vitals collection.
 *
 * Call once at application startup (e.g. in main.tsx).
 */
export function initPerformanceMonitoring(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  // Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (last) {
        webVitals.push({
          name: 'LCP',
          value: Math.round(last.startTime * 100) / 100,
          timestamp: Date.now(),
        });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Browser does not support this entry type – ignore.
  }

  // First Input Delay
  try {
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEntry & { processingStart: number; startTime: number };
        webVitals.push({
          name: 'FID',
          value: Math.round((e.processingStart - e.startTime) * 100) / 100,
          timestamp: Date.now(),
        });
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {
    // ignore
  }

  // Cumulative Layout Shift
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!e.hadRecentInput) {
          clsValue += e.value;
        }
      }
      // Always keep a single running CLS entry (overwrite previous)
      const existing = webVitals.findIndex((v) => v.name === 'CLS');
      const record: WebVitalEntry = {
        name: 'CLS',
        value: Math.round(clsValue * 10000) / 10000,
        timestamp: Date.now(),
      };
      if (existing !== -1) {
        webVitals[existing] = record;
      } else {
        webVitals.push(record);
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch {
    // ignore
  }
}
