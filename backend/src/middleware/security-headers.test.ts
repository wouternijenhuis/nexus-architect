import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { securityHeaders, httpsRedirect } from './security-headers'

describe('security-headers middleware', () => {
  describe('securityHeaders', () => {
    let mockReq: Partial<Request>
    let mockRes: Partial<Response>
    let nextFn: NextFunction
    let headers: Record<string, string>

    beforeEach(() => {
      headers = {}
      mockReq = {
        method: 'GET',
        url: '/test',
        headers: {},
      }
      mockRes = {
        setHeader: vi.fn((name: string, value: string) => {
          headers[name.toLowerCase()] = String(value)
          return mockRes as Response
        }),
        getHeader: vi.fn((name: string) => headers[name.toLowerCase()]),
        removeHeader: vi.fn(),
        on: vi.fn(),
      } as unknown as Partial<Response>
      nextFn = vi.fn()
    })

    it('sets X-Content-Type-Options header', () => {
      securityHeaders(mockReq as Request, mockRes as Response, nextFn)
      expect(headers['x-content-type-options']).toBe('nosniff')
    })

    it('sets X-Frame-Options header', () => {
      securityHeaders(mockReq as Request, mockRes as Response, nextFn)
      expect(headers['x-frame-options']).toBe('SAMEORIGIN')
    })

    it('sets Referrer-Policy header', () => {
      securityHeaders(mockReq as Request, mockRes as Response, nextFn)
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    })
  })

  describe('httpsRedirect', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('does NOT redirect in non-production', () => {
      process.env.NODE_ENV = 'development'

      const mockReq = { headers: {}, protocol: 'http', url: '/test' } as unknown as Request
      const mockRes = {
        redirect: vi.fn(),
      } as unknown as Response
      const nextFn = vi.fn()

      httpsRedirect(mockReq, mockRes, nextFn)
      expect(nextFn).toHaveBeenCalled()
      expect(mockRes.redirect).not.toHaveBeenCalled()
    })

    it('redirects HTTP to HTTPS when NODE_ENV=production and protocol is http', () => {
      process.env.NODE_ENV = 'production'

      const mockReq = {
        headers: { 'x-forwarded-proto': 'http', host: 'example.com' },
        protocol: 'http',
        url: '/test',
      } as unknown as Request
      const mockRes = {
        redirect: vi.fn(),
      } as unknown as Response
      const nextFn = vi.fn()

      httpsRedirect(mockReq, mockRes, nextFn)
      expect(mockRes.redirect).toHaveBeenCalledWith(301, 'https://example.com/test')
      expect(nextFn).not.toHaveBeenCalled()
    })

    it('passes through when already HTTPS in production', () => {
      process.env.NODE_ENV = 'production'

      const mockReq = {
        headers: { 'x-forwarded-proto': 'https', host: 'example.com' },
        protocol: 'https',
        url: '/test',
      } as unknown as Request
      const mockRes = {
        redirect: vi.fn(),
      } as unknown as Response
      const nextFn = vi.fn()

      httpsRedirect(mockReq, mockRes, nextFn)
      expect(nextFn).toHaveBeenCalled()
      expect(mockRes.redirect).not.toHaveBeenCalled()
    })
  })
})
