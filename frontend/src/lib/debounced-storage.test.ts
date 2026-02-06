import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createDebouncedStorage } from './debounced-storage'

describe('createDebouncedStorage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('getItem should read from localStorage', () => {
    localStorage.setItem('key', 'value')
    const storage = createDebouncedStorage(500)
    expect(storage.getItem('key')).toBe('value')
  })

  it('getItem should return null for missing keys', () => {
    const storage = createDebouncedStorage(500)
    expect(storage.getItem('missing')).toBeNull()
  })

  it('setItem should debounce writes to localStorage', () => {
    const storage = createDebouncedStorage(500)

    storage.setItem('key', 'value1')
    // Not yet written
    expect(localStorage.getItem('key')).toBeNull()

    vi.advanceTimersByTime(500)
    expect(localStorage.getItem('key')).toBe('value1')
  })

  it('setItem should only write the last value when called rapidly', () => {
    const storage = createDebouncedStorage(500)

    storage.setItem('key', 'first')
    storage.setItem('key', 'second')
    storage.setItem('key', 'third')

    vi.advanceTimersByTime(500)
    expect(localStorage.getItem('key')).toBe('third')
  })

  it('removeItem should clear pending timers and remove from localStorage', () => {
    const storage = createDebouncedStorage(500)

    localStorage.setItem('key', 'existing')
    storage.setItem('key', 'pending')

    // Remove before debounce fires
    storage.removeItem('key')

    vi.advanceTimersByTime(500)
    expect(localStorage.getItem('key')).toBeNull()
  })
})
