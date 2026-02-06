import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockProject = {
  create: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const mockSchema = {
  create: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

vi.mock('../services/database', () => ({
  getDatabase: () => ({
    project: mockProject,
    schema: mockSchema,
  }),
}))

import {
  createProject,
  getProjectById,
  getProjectsByOwner,
  updateProject,
  deleteProject,
  createSchema,
  getSchemaById,
  updateSchema,
  deleteSchema,
} from './project-repository'

describe('project-repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createProject calls prisma create', async () => {
    mockProject.create.mockResolvedValue({ id: '1', name: 'Test' })
    const result = await createProject({ name: 'Test', ownerId: 'owner-1' })
    expect(result).toEqual({ id: '1', name: 'Test' })
    expect(mockProject.create).toHaveBeenCalledWith({
      data: { name: 'Test', ownerId: 'owner-1' },
    })
  })

  it('getProjectById includes schemas', async () => {
    mockProject.findUnique.mockResolvedValue({ id: '1' })
    await getProjectById('1')
    expect(mockProject.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      include: { schemas: true },
    })
  })

  it('getProjectsByOwner returns ordered projects', async () => {
    mockProject.findMany.mockResolvedValue([])
    await getProjectsByOwner('owner-1')
    expect(mockProject.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'owner-1' },
      include: { schemas: true },
      orderBy: { updatedAt: 'desc' },
    })
  })

  it('updateProject calls prisma update', async () => {
    mockProject.update.mockResolvedValue({ id: '1', name: 'Updated' })
    await updateProject('1', { name: 'Updated' })
    expect(mockProject.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { name: 'Updated' },
    })
  })

  it('deleteProject calls prisma delete', async () => {
    mockProject.delete.mockResolvedValue({ id: '1' })
    await deleteProject('1')
    expect(mockProject.delete).toHaveBeenCalledWith({ where: { id: '1' } })
  })

  it('createSchema calls prisma create', async () => {
    mockSchema.create.mockResolvedValue({ id: '1' })
    await createSchema({ name: 'Test', xsdContent: '<xs:schema/>', projectId: 'p1' })
    expect(mockSchema.create).toHaveBeenCalled()
  })

  it('getSchemaById calls prisma findUnique', async () => {
    mockSchema.findUnique.mockResolvedValue({ id: '1' })
    await getSchemaById('1')
    expect(mockSchema.findUnique).toHaveBeenCalledWith({ where: { id: '1' } })
  })

  it('updateSchema calls prisma update', async () => {
    mockSchema.update.mockResolvedValue({ id: '1' })
    await updateSchema('1', { name: 'Updated' })
    expect(mockSchema.update).toHaveBeenCalled()
  })

  it('deleteSchema calls prisma delete', async () => {
    mockSchema.delete.mockResolvedValue({ id: '1' })
    await deleteSchema('1')
    expect(mockSchema.delete).toHaveBeenCalledWith({ where: { id: '1' } })
  })
})
