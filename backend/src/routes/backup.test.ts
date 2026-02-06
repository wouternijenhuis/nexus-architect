import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import http from 'http'

// Mock backup-service
vi.mock('../services/backup-service.js', () => ({
  exportAllProjects: vi.fn(),
  exportProject: vi.fn(),
  importBackup: vi.fn(),
  validateBackupData: vi.fn(),
}))

import backupRouter from './backup.js'
import {
  exportAllProjects,
  exportProject,
  importBackup,
  validateBackupData,
} from '../services/backup-service.js'

// --- HTTP test helpers ---

function getRequest(
  app: express.Express,
  path: string,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const addr = server.address() as { port: number }
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: addr.port,
          path,
          method: 'GET',
          headers,
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => (data += chunk))
          res.on('end', () => {
            server.close()
            try {
              resolve({ status: res.statusCode!, body: JSON.parse(data) })
            } catch {
              resolve({ status: res.statusCode!, body: data })
            }
          })
        }
      )
      req.on('error', (err) => {
        server.close()
        reject(err)
      })
      req.end()
    })
  })
}

function postRequest(
  app: express.Express,
  path: string,
  body: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const addr = server.address() as { port: number }
      const postData = JSON.stringify(body)
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: addr.port,
          path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            ...headers,
          },
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => (data += chunk))
          res.on('end', () => {
            server.close()
            try {
              resolve({ status: res.statusCode!, body: JSON.parse(data) })
            } catch {
              resolve({ status: res.statusCode!, body: data })
            }
          })
        }
      )
      req.on('error', (err) => {
        server.close()
        reject(err)
      })
      req.write(postData)
      req.end()
    })
  })
}

describe('Backup Routes', () => {
  let app: express.Express

  beforeEach(() => {
    vi.restoreAllMocks()
    app = express()
    app.use(express.json())
    app.use('/backup', backupRouter)
  })

  describe('GET /backup/export', () => {
    it('should return backup data for the user', async () => {
      const mockBackup = {
        version: '1.0',
        exportedAt: '2025-01-01T00:00:00.000Z',
        projects: [],
      }
      vi.mocked(exportAllProjects).mockResolvedValue(mockBackup)

      const { status, body } = await getRequest(app, '/backup/export', {
        'x-user-id': 'user-1',
      })

      expect(status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.version).toBe('1.0')
      expect(exportAllProjects).toHaveBeenCalledWith('user-1')
    })

    it('should use "anonymous" when x-user-id header is missing', async () => {
      vi.mocked(exportAllProjects).mockResolvedValue({
        version: '1.0',
        exportedAt: '2025-01-01',
        projects: [],
      })

      await getRequest(app, '/backup/export')
      expect(exportAllProjects).toHaveBeenCalledWith('anonymous')
    })
  })

  describe('GET /backup/export/:id', () => {
    it('should return a single project export', async () => {
      const mockProject = {
        id: 'p1',
        name: 'Project 1',
        description: null,
        schemas: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-02',
      }
      vi.mocked(exportProject).mockResolvedValue(mockProject)

      const { status, body } = await getRequest(app, '/backup/export/p1')

      expect(status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('Project 1')
    })

    it('should return 404 when project not found', async () => {
      vi.mocked(exportProject).mockResolvedValue(null)

      const { status, body } = await getRequest(app, '/backup/export/nonexistent')

      expect(status).toBe(404)
      expect(body.success).toBe(false)
      expect(body.error).toContain('not found')
    })
  })

  describe('POST /backup/validate', () => {
    it('should return valid for correct backup data', async () => {
      vi.mocked(validateBackupData).mockReturnValue({ valid: true, errors: [] })

      const { status, body } = await postRequest(app, '/backup/validate', {
        version: '1.0',
        projects: [],
      })

      expect(status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.errors).toEqual([])
    })

    it('should return errors for invalid backup data', async () => {
      vi.mocked(validateBackupData).mockReturnValue({
        valid: false,
        errors: ['Missing "version" field'],
      })

      const { status, body } = await postRequest(app, '/backup/validate', {})

      expect(status).toBe(200)
      expect(body.success).toBe(false)
      expect(body.errors).toHaveLength(1)
    })
  })

  describe('POST /backup/import', () => {
    it('should import valid backup data', async () => {
      vi.mocked(validateBackupData).mockReturnValue({ valid: true, errors: [] })
      vi.mocked(importBackup).mockResolvedValue({
        success: true,
        projectsImported: 2,
        schemasImported: 5,
        errors: [],
      })

      const { status, body } = await postRequest(
        app,
        '/backup/import',
        { version: '1.0', projects: [] },
        { 'x-user-id': 'user-1' }
      )

      expect(status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.projectsImported).toBe(2)
      expect(importBackup).toHaveBeenCalled()
    })

    it('should reject invalid backup data with 400', async () => {
      vi.mocked(validateBackupData).mockReturnValue({
        valid: false,
        errors: ['Missing "version"'],
      })

      const { status, body } = await postRequest(app, '/backup/import', {})

      expect(status).toBe(400)
      expect(body.success).toBe(false)
      expect(body.error).toContain('Invalid backup data')
    })

    it('should return 207 for partial import success', async () => {
      vi.mocked(validateBackupData).mockReturnValue({ valid: true, errors: [] })
      vi.mocked(importBackup).mockResolvedValue({
        success: false,
        projectsImported: 1,
        schemasImported: 0,
        errors: ['Failed to import schema "S1"'],
      })

      const { status, body } = await postRequest(
        app,
        '/backup/import',
        { version: '1.0', projects: [] },
        { 'x-user-id': 'user-1' }
      )

      expect(status).toBe(207)
      expect(body.success).toBe(false)
      expect(body.data.errors).toHaveLength(1)
    })
  })
})
