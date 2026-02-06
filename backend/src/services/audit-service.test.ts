import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  recordAuditEvent,
  getAuditLog,
  clearAuditLog,
} from './audit-service'

describe('AuditService', () => {
  beforeEach(() => {
    clearAuditLog()
    vi.restoreAllMocks()
  })

  describe('recordAuditEvent', () => {
    it('should create an entry with id and timestamp', () => {
      const entry = recordAuditEvent({
        action: 'AUTH_LOGIN',
        userId: 'user-1',
        success: true,
      })

      expect(entry.id).toBeDefined()
      expect(entry.timestamp).toBeDefined()
      expect(entry.action).toBe('AUTH_LOGIN')
      expect(entry.userId).toBe('user-1')
      expect(entry.success).toBe(true)
    })

    it('should store entries in order', () => {
      recordAuditEvent({ action: 'AUTH_LOGIN', success: true })
      recordAuditEvent({ action: 'AI_GENERATE', success: true })
      recordAuditEvent({ action: 'PROJECT_CREATE', success: false })

      const log = getAuditLog()
      // Reversed (most recent first)
      expect(log[0].action).toBe('PROJECT_CREATE')
      expect(log[1].action).toBe('AI_GENERATE')
      expect(log[2].action).toBe('AUTH_LOGIN')
    })

    it('should output [AUDIT] to console.log', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      recordAuditEvent({ action: 'AUTH_LOGIN', success: true })

      expect(spy).toHaveBeenCalledWith(expect.stringContaining('[AUDIT]'))
    })
  })

  describe('getAuditLog', () => {
    beforeEach(() => {
      recordAuditEvent({ action: 'AUTH_LOGIN', userId: 'u1', success: true })
      recordAuditEvent({ action: 'AI_GENERATE', userId: 'u2', success: true })
      recordAuditEvent({ action: 'AUTH_LOGIN', userId: 'u1', success: false })
    })

    it('should return all entries when no filters', () => {
      expect(getAuditLog()).toHaveLength(3)
    })

    it('should filter by action', () => {
      const result = getAuditLog({ action: 'AUTH_LOGIN' })
      expect(result).toHaveLength(2)
      result.forEach((e) => expect(e.action).toBe('AUTH_LOGIN'))
    })

    it('should filter by userId', () => {
      const result = getAuditLog({ userId: 'u2' })
      expect(result).toHaveLength(1)
      expect(result[0].action).toBe('AI_GENERATE')
    })

    it('should filter by since', () => {
      const since = new Date(Date.now() - 1000)
      const result = getAuditLog({ since })
      expect(result.length).toBeGreaterThan(0)
    })

    it('should respect limit', () => {
      const result = getAuditLog({ limit: 1 })
      expect(result).toHaveLength(1)
    })
  })

  describe('clearAuditLog', () => {
    it('should remove all entries', () => {
      recordAuditEvent({ action: 'AUTH_LOGIN', success: true })
      expect(getAuditLog()).toHaveLength(1)
      clearAuditLog()
      expect(getAuditLog()).toHaveLength(0)
    })
  })
})
