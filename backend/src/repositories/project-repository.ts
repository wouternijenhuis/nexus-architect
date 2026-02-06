/**
 * Data access layer for Project and Schema entities.
 */

import { getDatabase } from '../services/database.js'

export interface CreateProjectInput {
  name: string
  description?: string
  ownerId: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
}

export interface CreateSchemaInput {
  name: string
  xsdContent: string
  projectId: string
}

// Projects

export async function createProject(data: CreateProjectInput) {
  return getDatabase().project.create({ data })
}

export async function getProjectById(id: string) {
  return getDatabase().project.findUnique({
    where: { id },
    include: { schemas: true },
  })
}

export async function getProjectsByOwner(ownerId: string) {
  return getDatabase().project.findMany({
    where: { ownerId },
    include: { schemas: true },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function updateProject(id: string, data: UpdateProjectInput) {
  return getDatabase().project.update({
    where: { id },
    data,
  })
}

export async function deleteProject(id: string) {
  return getDatabase().project.delete({ where: { id } })
}

// Schemas

export async function createSchema(data: CreateSchemaInput) {
  return getDatabase().schema.create({ data })
}

export async function getSchemaById(id: string) {
  return getDatabase().schema.findUnique({ where: { id } })
}

export async function updateSchema(id: string, data: { name?: string; xsdContent?: string }) {
  return getDatabase().schema.update({
    where: { id },
    data,
  })
}

export async function deleteSchema(id: string) {
  return getDatabase().schema.delete({ where: { id } })
}
