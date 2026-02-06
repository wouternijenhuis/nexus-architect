/**
 * Express middleware that records API requests as audit events.
 *
 * Skips health-check endpoints.  Extracts user identity from
 * the `x-user-id` header (or JWT sub claim when Azure AD is wired).
 */

import { Request, Response, NextFunction } from 'express'
import { recordAuditEvent, AuditAction } from '../services/audit-service.js'

/**
 * Map a request to the most appropriate audit action.
 */
function resolveAction(method: string, path: string): AuditAction {
  if (method === 'POST' && path.includes('generate-xml')) return 'AI_GENERATE'
  if (method === 'POST' && path.includes('project')) return 'PROJECT_CREATE'
  if (method === 'PUT' && path.includes('project')) return 'PROJECT_UPDATE'
  if (method === 'DELETE' && path.includes('project')) return 'PROJECT_DELETE'
  if (method === 'POST' && path.includes('schema')) return 'SCHEMA_CREATE'
  if (method === 'PUT' && path.includes('schema')) return 'SCHEMA_UPDATE'
  if (method === 'DELETE' && path.includes('schema')) return 'SCHEMA_DELETE'
  return 'API_ACCESS'
}

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip health-check endpoints
  if (req.path.startsWith('/api/health') || req.path === '/health') {
    next()
    return
  }

  // Record after the response has been sent so we know the status code
  res.on('finish', () => {
    recordAuditEvent({
      action: resolveAction(req.method, req.path),
      userId: (req.headers['x-user-id'] as string) || undefined,
      resourceType: req.baseUrl || undefined,
      details: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      success: res.statusCode < 400,
    })
  })

  next()
}
