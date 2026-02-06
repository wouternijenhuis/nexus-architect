/**
 * In-memory audit logging service.
 *
 * Records security-sensitive events and data modifications for
 * compliance and troubleshooting.  Entries are kept in a bounded
 * FIFO buffer and echoed to stdout as structured JSON.
 */

import { randomUUID } from 'crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditAction =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_FAILED'
  | 'PROJECT_CREATE'
  | 'PROJECT_UPDATE'
  | 'PROJECT_DELETE'
  | 'SCHEMA_CREATE'
  | 'SCHEMA_UPDATE'
  | 'SCHEMA_DELETE'
  | 'SCHEMA_IMPORT'
  | 'SCHEMA_EXPORT'
  | 'AI_GENERATE'
  | 'API_ACCESS'
  | 'CONFIG_CHANGE'

export interface AuditEntry {
  id: string
  timestamp: string
  action: AuditAction
  userId?: string
  resourceType?: string
  resourceId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  success: boolean
}

export interface AuditQueryOptions {
  limit?: number
  action?: AuditAction
  userId?: string
  since?: Date
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const MAX_ENTRIES = 10_000
const entries: AuditEntry[] = []

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Record an audit event.  `id` and `timestamp` are generated automatically.
 */
export function recordAuditEvent(
  event: Omit<AuditEntry, 'id' | 'timestamp'>
): AuditEntry {
  const entry: AuditEntry = {
    ...event,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
  }

  // FIFO eviction when buffer is full
  if (entries.length >= MAX_ENTRIES) {
    entries.shift()
  }

  entries.push(entry)

  // Structured log output
  console.log(`[AUDIT] ${JSON.stringify(entry)}`)

  return entry
}

/**
 * Retrieve audit entries with optional filters.
 */
export function getAuditLog(options: AuditQueryOptions = {}): AuditEntry[] {
  let result = [...entries]

  if (options.action) {
    result = result.filter((e) => e.action === options.action)
  }

  if (options.userId) {
    result = result.filter((e) => e.userId === options.userId)
  }

  if (options.since) {
    const sinceMs = options.since.getTime()
    result = result.filter((e) => new Date(e.timestamp).getTime() >= sinceMs)
  }

  // Most recent first
  result.reverse()

  if (options.limit && options.limit > 0) {
    result = result.slice(0, options.limit)
  }

  return result
}

/**
 * Clear all audit entries (useful for testing).
 */
export function clearAuditLog(): void {
  entries.length = 0
}

/**
 * Visible for testing — override max-entries limit.
 */
export function _getMaxEntries(): number {
  return MAX_ENTRIES
}
