/**
 * Simple in-memory TTL cache for server-side caching.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class TTLCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>()
  private defaultTTL: number

  constructor(defaultTTLMs: number = 3600000) { // 1 hour default
    this.defaultTTL = defaultTTLMs
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
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
    // Clean expired entries before returning size
    this.cleanup()
    return this.cache.size
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// AI response cache (1 hour TTL)
export const aiCache = new TTLCache<{ xml: string; success: boolean }>(3600000)

/**
 * Generate a cache key from XSD string and context.
 */
export function generateAICacheKey(xsdString: string, context: string, temperature: number = 0.7): string {
  // Simple hash: use first 100 chars of xsd + context + temperature
  const input = `${xsdString.substring(0, 200)}::${context.substring(0, 200)}::${temperature}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return `ai:${hash}`
}
