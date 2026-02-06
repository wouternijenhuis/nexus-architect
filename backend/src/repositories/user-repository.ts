/**
 * Data access layer for User entities.
 */

import { getDatabase } from '../services/database.js'

export interface CreateUserInput {
  email: string
  displayName: string
  azureAdOid?: string
  role?: string
}

export async function createUser(data: CreateUserInput) {
  return getDatabase().user.create({ data })
}

export async function getUserById(id: string) {
  return getDatabase().user.findUnique({ where: { id } })
}

export async function getUserByEmail(email: string) {
  return getDatabase().user.findUnique({ where: { email } })
}

export async function getUserByAzureOid(oid: string) {
  return getDatabase().user.findUnique({ where: { azureAdOid: oid } })
}

export async function updateUser(id: string, data: Partial<CreateUserInput>) {
  return getDatabase().user.update({
    where: { id },
    data,
  })
}

export async function deleteUser(id: string) {
  return getDatabase().user.delete({ where: { id } })
}
