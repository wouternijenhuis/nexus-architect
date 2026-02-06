import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TTLCache, generateAICacheKey, aiCache } from './cache-service.js'

describe('TTLCache', () => {
  let cache: TTLCache<string>

  beforeEach(() => {
    vi.useFakeTimers()
    cache = new TTLCache<string>(1000) // 1 second TTL
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should set and get a value', () => {
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
  })

  it('should return undefined for missing keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined()
  })

  it('should report has() correctly', () => {
    cache.set('key1', 'value1')
    expect(cache.has('key1')).toBe(true)
    expect(cache.has('missing')).toBe(false)
  })

  it('should delete a key', () => {
    cache.set('key1', 'value1')
    expect(cache.delete('key1')).toBe(true)
    expect(cache.get('key1')).toBeUndefined()
  })

  it('should clear all entries', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.clear()
    expect(cache.get('key1')).toBeUndefined()
    expect(cache.get('key2')).toBeUndefined()
  })

  it('should expire entries after TTL', () => {
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')

    vi.advanceTimersByTime(1001)
    expect(cache.get('key1')).toBeUndefined()
  })

  it('should support custom per-entry TTL', () => {
    cache.set('short', 'val', 500)
    cache.set('long', 'val', 2000)

    vi.advanceTimersByTime(600)
    expect(cache.get('short')).toBeUndefined()
    expect(cache.get('long')).toBe('val')
  })

  it('should report correct size after cleanup', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    expect(cache.size).toBe(2)

    vi.advanceTimersByTime(1001)
    expect(cache.size).toBe(0)
  })

  it('should return false when deleting nonexistent key', () => {
    expect(cache.delete('nonexistent')).toBe(false)
  })

  it('should overwrite existing entries', () => {
    cache.set('key1', 'first')
    cache.set('key1', 'second')
    expect(cache.get('key1')).toBe('second')
  })
})

describe('generateAICacheKey', () => {
  it('should return a deterministic key for the same input', () => {
    const key1 = generateAICacheKey('<xs:schema/>', 'test context', 0.7)
    const key2 = generateAICacheKey('<xs:schema/>', 'test context', 0.7)
    expect(key1).toBe(key2)
  })

  it('should return different keys for different inputs', () => {
    const key1 = generateAICacheKey('<xs:schema/>', 'context A', 0.7)
    const key2 = generateAICacheKey('<xs:schema/>', 'context B', 0.7)
    expect(key1).not.toBe(key2)
  })

  it('should include ai: prefix', () => {
    const key = generateAICacheKey('xsd', 'ctx', 0.5)
    expect(key).toMatch(/^ai:/)
  })
})

describe('aiCache singleton', () => {
  it('should be a TTLCache instance', () => {
    expect(aiCache).toBeInstanceOf(TTLCache)
  })
})
