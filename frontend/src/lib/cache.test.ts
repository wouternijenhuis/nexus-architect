import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LRUCache, hashString, xsdCache } from './cache'

describe('LRUCache', () => {
  let cache: LRUCache<string>

  beforeEach(() => {
    vi.useFakeTimers()
    cache = new LRUCache<string>(3, 1000) // max 3 entries, 1s TTL
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
    cache.set('a', '1')
    cache.set('b', '2')
    cache.clear()
    expect(cache.size).toBe(0)
  })

  it('should expire entries after TTL', () => {
    cache.set('key1', 'value1')
    vi.advanceTimersByTime(1001)
    expect(cache.get('key1')).toBeUndefined()
  })

  it('should evict least recently used entry when at capacity', () => {
    cache.set('a', '1')
    vi.advanceTimersByTime(10)
    cache.set('b', '2')
    vi.advanceTimersByTime(10)
    cache.set('c', '3')

    // Access 'a' to make it recently used
    cache.get('a')
    vi.advanceTimersByTime(10)

    // Adding 'd' should evict 'b' (least recently accessed)
    cache.set('d', '4')
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('a')).toBe('1')
    expect(cache.get('c')).toBe('3')
    expect(cache.get('d')).toBe('4')
  })

  it('should not evict when updating an existing key', () => {
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3')

    // Update existing key — should not trigger eviction
    cache.set('a', 'updated')
    expect(cache.size).toBe(3)
    expect(cache.get('a')).toBe('updated')
    expect(cache.get('b')).toBe('2')
  })

  it('should support custom per-entry TTL', () => {
    cache.set('short', 'val', 200)
    cache.set('long', 'val', 5000)

    vi.advanceTimersByTime(300)
    expect(cache.get('short')).toBeUndefined()
    expect(cache.get('long')).toBe('val')
  })
})

describe('hashString', () => {
  it('should return a deterministic hash', () => {
    expect(hashString('hello')).toBe(hashString('hello'))
  })

  it('should return different hashes for different inputs', () => {
    expect(hashString('hello')).not.toBe(hashString('world'))
  })

  it('should return a string', () => {
    expect(typeof hashString('test')).toBe('string')
  })
})

describe('xsdCache singleton', () => {
  it('should be an LRUCache instance', () => {
    expect(xsdCache).toBeInstanceOf(LRUCache)
  })
})
