/**
 * Client-side LRU cache with TTL support.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
  accessedAt: number
}

export class LRUCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize: number = 100, defaultTTLMs: number = 300000) { // 5 min default
    this.maxSize = maxSize
    this.defaultTTL = defaultTTLMs
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }
    // Update access time for LRU
    entry.accessedAt = Date.now()
    return entry.value
  }

  set(key: string, value: T, ttlMs?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
      accessedAt: Date.now(),
    })
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }

  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestAccess = Infinity
    for (const [key, entry] of this.cache) {
      if (entry.accessedAt < oldestAccess) {
        oldestAccess = entry.accessedAt
        oldestKey = key
      }
    }
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

// XSD generation cache
export const xsdCache = new LRUCache<string>(50, 600000) // 50 entries, 10 min TTL

/**
 * Generate a simple hash for cache keys.
 */
export function hashString(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash.toString(36)
}
