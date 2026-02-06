import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to re-import the module fresh for each test since initPerformanceMonitoring
// uses module-level state. We use dynamic imports.

describe('initPerformanceMonitoring', () => {
  let originalPerformanceObserver: typeof PerformanceObserver | undefined

  beforeEach(() => {
    originalPerformanceObserver = globalThis.PerformanceObserver
  })

  afterEach(() => {
    // Restore original
    if (originalPerformanceObserver) {
      globalThis.PerformanceObserver = originalPerformanceObserver
    }
    vi.restoreAllMocks()
  })

  it('does nothing when PerformanceObserver is undefined', async () => {
    const { initPerformanceMonitoring } = await import('./performance')
    const saved = globalThis.PerformanceObserver
    // @ts-ignore
    delete globalThis.PerformanceObserver

    expect(() => initPerformanceMonitoring()).not.toThrow()

    globalThis.PerformanceObserver = saved
  })

  it('creates LCP, FID, and CLS observers', async () => {
    const { initPerformanceMonitoring, resetPerformanceData } = await import('./performance')
    resetPerformanceData()

    const observedTypes: string[] = []

    class MockPerformanceObserver {
      callback: any
      constructor(callback: any) {
        this.callback = callback
      }
      observe(opts: any) {
        observedTypes.push(opts.type)
      }
    }

    globalThis.PerformanceObserver = MockPerformanceObserver as any

    initPerformanceMonitoring()

    expect(observedTypes).toContain('largest-contentful-paint')
    expect(observedTypes).toContain('first-input')
    expect(observedTypes).toContain('layout-shift')
    expect(observedTypes).toHaveLength(3)
  })

  it('LCP callback records web vital', async () => {
    const { initPerformanceMonitoring, resetPerformanceData, getPerformanceReport } = await import('./performance')
    resetPerformanceData()

    let lcpCallback: any

    class MockPerformanceObserver {
      callback: any
      constructor(callback: any) {
        this.callback = callback
      }
      observe(opts: any) {
        if (opts.type === 'largest-contentful-paint') {
          lcpCallback = this.callback
        }
      }
    }

    globalThis.PerformanceObserver = MockPerformanceObserver as any

    initPerformanceMonitoring()
    expect(lcpCallback).toBeDefined()

    lcpCallback({
      getEntries: () => [{ startTime: 1234.5678 }],
    })

    const report = getPerformanceReport()
    const lcp = report.webVitals.find(v => v.name === 'LCP')
    expect(lcp).toBeDefined()
    expect(lcp!.value).toBe(1234.57)
  })

  it('FID callback records web vital', async () => {
    const { initPerformanceMonitoring, resetPerformanceData, getPerformanceReport } = await import('./performance')
    resetPerformanceData()

    let fidCallback: any

    class MockPerformanceObserver {
      callback: any
      constructor(callback: any) {
        this.callback = callback
      }
      observe(opts: any) {
        if (opts.type === 'first-input') {
          fidCallback = this.callback
        }
      }
    }

    globalThis.PerformanceObserver = MockPerformanceObserver as any

    initPerformanceMonitoring()
    expect(fidCallback).toBeDefined()

    fidCallback({
      getEntries: () => [{ processingStart: 150, startTime: 100 }],
    })

    const report = getPerformanceReport()
    const fid = report.webVitals.find(v => v.name === 'FID')
    expect(fid).toBeDefined()
    expect(fid!.value).toBe(50)
  })

  it('CLS callback records cumulative layout shift', async () => {
    const { initPerformanceMonitoring, resetPerformanceData, getPerformanceReport } = await import('./performance')
    resetPerformanceData()

    let clsCallback: any

    class MockPerformanceObserver {
      callback: any
      constructor(callback: any) {
        this.callback = callback
      }
      observe(opts: any) {
        if (opts.type === 'layout-shift') {
          clsCallback = this.callback
        }
      }
    }

    globalThis.PerformanceObserver = MockPerformanceObserver as any

    initPerformanceMonitoring()
    expect(clsCallback).toBeDefined()

    // First shift
    clsCallback({
      getEntries: () => [{ hadRecentInput: false, value: 0.05 }],
    })

    let report = getPerformanceReport()
    let cls = report.webVitals.find(v => v.name === 'CLS')
    expect(cls).toBeDefined()
    expect(cls!.value).toBe(0.05)

    // Second shift accumulates
    clsCallback({
      getEntries: () => [{ hadRecentInput: false, value: 0.1 }],
    })

    report = getPerformanceReport()
    cls = report.webVitals.find(v => v.name === 'CLS')
    expect(cls!.value).toBe(0.15)
  })

  it('CLS callback ignores entries with recent input', async () => {
    const { initPerformanceMonitoring, resetPerformanceData, getPerformanceReport } = await import('./performance')
    resetPerformanceData()

    let clsCallback: any

    class MockPerformanceObserver {
      callback: any
      constructor(callback: any) {
        this.callback = callback
      }
      observe(opts: any) {
        if (opts.type === 'layout-shift') {
          clsCallback = this.callback
        }
      }
    }

    globalThis.PerformanceObserver = MockPerformanceObserver as any

    initPerformanceMonitoring()

    clsCallback({
      getEntries: () => [{ hadRecentInput: true, value: 0.5 }],
    })

    const report = getPerformanceReport()
    const cls = report.webVitals.find(v => v.name === 'CLS')
    if (cls) {
      expect(cls.value).toBe(0)
    }
  })

  it('handles observer.observe throwing', async () => {
    const { initPerformanceMonitoring } = await import('./performance')

    class MockPerformanceObserver {
      constructor(_callback: any) {}
      observe() {
        throw new Error('Not supported')
      }
    }

    globalThis.PerformanceObserver = MockPerformanceObserver as any

    expect(() => initPerformanceMonitoring()).not.toThrow()
  })
})
