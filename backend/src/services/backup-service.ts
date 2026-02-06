/**
 * Data backup and recovery service.
 *
 * Provides JSON export/import of projects and schemas,
 * data integrity validation, and backup utilities.
 */

import { getDatabase } from './database.js'

export interface BackupData {
  version: string
  exportedAt: string
  projects: ProjectExport[]
}

export interface ProjectExport {
  id: string
  name: string
  description: string | null
  schemas: SchemaExport[]
  createdAt: string
  updatedAt: string
}

export interface SchemaExport {
  id: string
  name: string
  xsdContent: string
  createdAt: string
  updatedAt: string
}

/**
 * Export all projects for a given owner as a JSON-serialisable backup.
 */
export async function exportAllProjects(ownerId: string): Promise<BackupData> {
  const db = getDatabase()

  const projects = await db.project.findMany({
    where: { ownerId },
    include: { schemas: true },
    orderBy: { createdAt: 'asc' },
  })

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      schemas: p.schemas.map((s) => ({
        id: s.id,
        name: s.name,
        xsdContent: s.xsdContent,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  }
}

/**
 * Export a single project by ID.
 */
export async function exportProject(projectId: string): Promise<ProjectExport | null> {
  const db = getDatabase()

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { schemas: true },
  })

  if (!project) return null

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    schemas: project.schemas.map((s) => ({
      id: s.id,
      name: s.name,
      xsdContent: s.xsdContent,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

export interface ImportResult {
  success: boolean
  projectsImported: number
  schemasImported: number
  errors: string[]
}

/**
 * Validate backup data structure before import.
 */
export function validateBackupData(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Backup data must be a non-null object'] }
  }

  const backup = data as Record<string, unknown>

  if (!backup.version || typeof backup.version !== 'string') {
    errors.push('Missing or invalid "version" field')
  }

  if (!Array.isArray(backup.projects)) {
    errors.push('Missing or invalid "projects" array')
    return { valid: false, errors }
  }

  for (let i = 0; i < backup.projects.length; i++) {
    const p = backup.projects[i] as Record<string, unknown>
    if (!p.name || typeof p.name !== 'string') {
      errors.push(`Project at index ${i}: missing or invalid "name"`)
    }
    if (p.schemas && !Array.isArray(p.schemas)) {
      errors.push(`Project at index ${i}: "schemas" must be an array`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Import projects from a backup into the database.
 */
export async function importBackup(
  data: BackupData,
  ownerId: string
): Promise<ImportResult> {
  const errors: string[] = []
  let projectsImported = 0
  let schemasImported = 0

  const db = getDatabase()

  for (const projectData of data.projects) {
    try {
      const project = await db.project.create({
        data: {
          name: projectData.name,
          description: projectData.description,
          ownerId,
        },
      })
      projectsImported++

      for (const schemaData of projectData.schemas || []) {
        try {
          await db.schema.create({
            data: {
              name: schemaData.name,
              xsdContent: schemaData.xsdContent,
              projectId: project.id,
            },
          })
          schemasImported++
        } catch (err: any) {
          errors.push(`Failed to import schema "${schemaData.name}": ${err.message}`)
        }
      }
    } catch (err: any) {
      errors.push(`Failed to import project "${projectData.name}": ${err.message}`)
    }
  }

  return {
    success: errors.length === 0,
    projectsImported,
    schemasImported,
    errors,
  }
}
