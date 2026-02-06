import { describe, it, expect, beforeEach } from 'vitest';
import {
  startMark,
  endMark,
  getPerformanceReport,
  resetPerformanceData,
  _recordVital,
} from './performance';

beforeEach(() => {
  resetPerformanceData();
});

describe('startMark / endMark', () => {
  it('should measure duration of a named mark', () => {
    startMark('test-op');
    // Simulate a tiny delay so duration > 0
    const result = endMark('test-op');
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('should return -1 for an unstarted mark', () => {
    expect(endMark('nonexistent')).toBe(-1);
  });

  it('should record the mark in the report', () => {
    startMark('load-data');
    endMark('load-data');

    const report = getPerformanceReport();
    expect(report.customMarks).toHaveLength(1);
    expect(report.customMarks[0].name).toBe('load-data');
    expect(typeof report.customMarks[0].durationMs).toBe('number');
    expect(typeof report.customMarks[0].timestamp).toBe('number');
  });

  it('should remove the pending mark after ending', () => {
    startMark('once');
    endMark('once');
    // Second end should fail
    expect(endMark('once')).toBe(-1);
  });
});

describe('getPerformanceReport', () => {
  it('should return empty report initially', () => {
    const report = getPerformanceReport();
    expect(report.webVitals).toEqual([]);
    expect(report.customMarks).toEqual([]);
    expect(report.collectedAt).toBeDefined();
  });

  it('should include recorded web vitals', () => {
    _recordVital({ name: 'LCP', value: 250, timestamp: Date.now() });
    _recordVital({ name: 'FID', value: 12, timestamp: Date.now() });

    const report = getPerformanceReport();
    expect(report.webVitals).toHaveLength(2);
    expect(report.webVitals[0].name).toBe('LCP');
    expect(report.webVitals[1].name).toBe('FID');
  });

  it('should return copies, not references', () => {
    startMark('x');
    endMark('x');
    const r1 = getPerformanceReport();
    const r2 = getPerformanceReport();
    expect(r1.customMarks).not.toBe(r2.customMarks);
  });
});

describe('resetPerformanceData', () => {
  it('should clear all data', () => {
    _recordVital({ name: 'CLS', value: 0.05, timestamp: Date.now() });
    startMark('op');
    endMark('op');

    resetPerformanceData();

    const report = getPerformanceReport();
    expect(report.webVitals).toEqual([]);
    expect(report.customMarks).toEqual([]);
  });
});
