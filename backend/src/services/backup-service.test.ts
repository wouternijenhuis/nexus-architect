import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockProject = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
}

const mockSchema = {
  create: vi.fn(),
}

vi.mock('./database', () => ({
  getDatabase: () => ({
    project: mockProject,
    schema: mockSchema,
  }),
}))

import {
  exportAllProjects,
  exportProject,
  validateBackupData,
  importBackup,
} from './backup-service'

describe('backup-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportAllProjects', () => {
    it('should return backup data with correct structure', async () => {
      mockProject.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Project 1',
          description: 'Desc',
          schemas: [
            {
              id: 's1',
              name: 'Schema 1',
              xsdContent: '<xs:schema/>',
              createdAt: new Date('2025-01-01'),
              updatedAt: new Date('2025-01-02'),
            },
          ],
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-02'),
        },
      ])

      const result = await exportAllProjects('owner-1')

      expect(result.version).toBe('1.0')
      expect(result.exportedAt).toBeDefined()
      expect(result.projects).toHaveLength(1)
      expect(result.projects[0].name).toBe('Project 1')
      expect(result.projects[0].schemas).toHaveLength(1)
    })

    it('should return empty projects array when none exist', async () => {
      mockProject.findMany.mockResolvedValue([])
      const result = await exportAllProjects('owner-1')
      expect(result.projects).toHaveLength(0)
    })
  })

  describe('exportProject', () => {
    it('should return single project export', async () => {
      mockProject.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Project 1',
        description: null,
        schemas: [],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      })

      const result = await exportProject('p1')
      expect(result).not.toBeNull()
      expect(result!.name).toBe('Project 1')
    })

    it('should return null when project not found', async () => {
      mockProject.findUnique.mockResolvedValue(null)
      const result = await exportProject('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('validateBackupData', () => {
    it('should reject non-object data', () => {
      expect(validateBackupData(null).valid).toBe(false)
      expect(validateBackupData('string').valid).toBe(false)
    })

    it('should reject missing version', () => {
      const result = validateBackupData({ projects: [] })
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('version')
    })

    it('should reject missing projects array', () => {
      const result = validateBackupData({ version: '1.0' })
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('projects')
    })

    it('should reject projects with missing name', () => {
      const result = validateBackupData({
        version: '1.0',
        projects: [{ schemas: [] }],
      })
      expect(result.valid).toBe(false)
    })

    it('should accept valid backup data', () => {
      const result = validateBackupData({
        version: '1.0',
        exportedAt: '2025-01-01T00:00:00.000Z',
        projects: [{ name: 'Test', schemas: [] }],
      })
      expect(result.valid).toBe(true)
    })
  })

  describe('importBackup', () => {
    it('should import projects and schemas', async () => {
      mockProject.create.mockResolvedValue({ id: 'new-p1' })
      mockSchema.create.mockResolvedValue({ id: 'new-s1' })

      const result = await importBackup(
        {
          version: '1.0',
          exportedAt: '2025-01-01T00:00:00.000Z',
          projects: [
            {
              id: 'p1',
              name: 'Project 1',
              description: null,
              schemas: [
                {
                  id: 's1',
                  name: 'Schema 1',
                  xsdContent: '<xs:schema/>',
                  createdAt: '2025-01-01',
                  updatedAt: '2025-01-02',
                },
              ],
              createdAt: '2025-01-01',
              updatedAt: '2025-01-02',
            },
          ],
        },
        'owner-1'
      )

      expect(result.success).toBe(true)
      expect(result.projectsImported).toBe(1)
      expect(result.schemasImported).toBe(1)
    })

    it('should handle project creation failure', async () => {
      mockProject.create.mockRejectedValue(new Error('DB error'))

      const result = await importBackup(
        {
          version: '1.0',
          exportedAt: '2025-01-01',
          projects: [{ id: 'p1', name: 'P1', description: null, schemas: [], createdAt: '', updatedAt: '' }],
        },
        'owner-1'
      )

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
    })

    it('should handle schema creation failure', async () => {
      mockProject.create.mockResolvedValue({ id: 'new-p1' })
      mockSchema.create.mockRejectedValue(new Error('DB error'))

      const result = await importBackup(
        {
          version: '1.0',
          exportedAt: '2025-01-01',
          projects: [
            {
              id: 'p1',
              name: 'P1',
              description: null,
              schemas: [{ id: 's1', name: 'S1', xsdContent: '', createdAt: '', updatedAt: '' }],
              createdAt: '',
              updatedAt: '',
            },
          ],
        },
        'owner-1'
      )

      expect(result.success).toBe(false)
      expect(result.projectsImported).toBe(1)
      expect(result.schemasImported).toBe(0)
    })
  })
})
