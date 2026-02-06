/**
 * Backup & Recovery API routes.
 *
 * Endpoints:
 *   GET  /backup/export           – Export all projects for the authenticated user
 *   GET  /backup/export/:id       – Export a single project by ID
 *   POST /backup/import           – Import projects from a backup payload
 *   POST /backup/validate         – Validate a backup payload without importing
 */

import { Router } from 'express'
import { asyncHandler } from '../middleware/error-handler.js'
import {
  exportAllProjects,
  exportProject,
  importBackup,
  validateBackupData,
} from '../services/backup-service.js'

const router = Router()

/**
 * GET /backup/export
 * Export all projects for the requesting user.
 * The owner is identified via x-user-id header (or auth middleware in production).
 */
router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const ownerId = (req.headers['x-user-id'] as string) || 'anonymous'
    const backup = await exportAllProjects(ownerId)
    res.json({ success: true, data: backup })
  })
)

/**
 * GET /backup/export/:id
 * Export a single project by its ID.
 */
router.get(
  '/export/:id',
  asyncHandler(async (req, res) => {
    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const project = await exportProject(projectId)
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' })
    }
    res.json({ success: true, data: project })
  })
)

/**
 * POST /backup/validate
 * Validate a backup payload structure without performing an import.
 */
router.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const result = validateBackupData(req.body)
    res.json({ success: result.valid, errors: result.errors })
  })
)

/**
 * POST /backup/import
 * Import projects and schemas from a backup payload.
 */
router.post(
  '/import',
  asyncHandler(async (req, res) => {
    // Validate first
    const validation = validateBackupData(req.body)
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backup data',
        details: validation.errors,
      })
    }

    const ownerId = (req.headers['x-user-id'] as string) || 'anonymous'
    const result = await importBackup(req.body, ownerId)
    const status = result.success ? 200 : 207 // 207 Multi-Status for partial success
    res.status(status).json({ success: result.success, data: result })
  })
)

export default router
