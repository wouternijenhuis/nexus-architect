import type { StateStorage } from 'zustand/middleware'

/**
 * Debounced localStorage adapter for Zustand persist.
 * Delays writes by `delayMs` to batch rapid state changes.
 */
export function createDebouncedStorage(delayMs: number = 500): StateStorage {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  return {
    getItem: (name: string): string | null => {
      return localStorage.getItem(name)
    },
    setItem: (name: string, value: string): void => {
      const existing = timers.get(name)
      if (existing) clearTimeout(existing)

      timers.set(name, setTimeout(() => {
        localStorage.setItem(name, value)
        timers.delete(name)
      }, delayMs))
    },
    removeItem: (name: string): void => {
      const existing = timers.get(name)
      if (existing) clearTimeout(existing)
      timers.delete(name)
      localStorage.removeItem(name)
    },
  }
}
