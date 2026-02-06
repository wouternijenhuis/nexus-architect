import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { auditMiddleware } from './audit-middleware'
import * as auditService from '../services/audit-service'

vi.mock('../services/audit-service', () => ({
  recordAuditEvent: vi.fn(),
}))

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    path: '/api/test',
    baseUrl: '/api',
    ip: '127.0.0.1',
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as unknown as Request
}

function createMockRes(): Response & { _finishCb?: () => void } {
  const res: any = {
    statusCode: 200,
    on: vi.fn((event: string, cb: () => void) => {
      if (event === 'finish') {
        res._finishCb = cb
      }
    }),
  }
  return res
}

describe('auditMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call next()', () => {
    const next: NextFunction = vi.fn()
    auditMiddleware(createMockReq(), createMockRes() as Response, next)
    expect(next).toHaveBeenCalled()
  })

  it('should skip health check requests', () => {
    const next: NextFunction = vi.fn()
    const req = createMockReq({ path: '/api/health' })
    auditMiddleware(req, createMockRes() as Response, next)
    expect(next).toHaveBeenCalled()
    expect(auditService.recordAuditEvent).not.toHaveBeenCalled()
  })

  it('should skip /health path', () => {
    const next: NextFunction = vi.fn()
    const req = createMockReq({ path: '/health' })
    auditMiddleware(req, createMockRes() as Response, next)
    expect(auditService.recordAuditEvent).not.toHaveBeenCalled()
  })

  it('should record audit event on response finish', () => {
    const next: NextFunction = vi.fn()
    const req = createMockReq({ method: 'POST', path: '/api/generate-xml' })
    const res = createMockRes()
    auditMiddleware(req, res as Response, next)

    // Simulate response finish
    res._finishCb?.()

    expect(auditService.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'AI_GENERATE',
        success: true,
      })
    )
  })

  it('should extract x-user-id from headers', () => {
    const next: NextFunction = vi.fn()
    const req = createMockReq({
      headers: { 'x-user-id': 'test-user' } as any,
    })
    const res = createMockRes()
    auditMiddleware(req, res as Response, next)
    res._finishCb?.()

    expect(auditService.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'test-user',
      })
    )
  })

  it('should mark as failure for 4xx/5xx status codes', () => {
    const next: NextFunction = vi.fn()
    const res = createMockRes()
    res.statusCode = 500
    auditMiddleware(createMockReq(), res as Response, next)
    res._finishCb?.()

    expect(auditService.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    )
  })

  it('should resolve project create action', () => {
    const next: NextFunction = vi.fn()
    const req = createMockReq({ method: 'POST', path: '/api/project' })
    const res = createMockRes()
    auditMiddleware(req, res as Response, next)
    res._finishCb?.()

    expect(auditService.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROJECT_CREATE' })
    )
  })

  it('should resolve project delete action', () => {
    const next: NextFunction = vi.fn()
    const req = createMockReq({ method: 'DELETE', path: '/api/project/123' })
    const res = createMockRes()
    auditMiddleware(req, res as Response, next)
    res._finishCb?.()

    expect(auditService.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROJECT_DELETE' })
    )
  })
})
