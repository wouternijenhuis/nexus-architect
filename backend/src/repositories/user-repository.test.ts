import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = {
  create: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

vi.mock('../services/database', () => ({
  getDatabase: () => ({
    user: mockUser,
  }),
}))

import {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByAzureOid,
  updateUser,
  deleteUser,
} from './user-repository'

describe('user-repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createUser calls prisma create', async () => {
    mockUser.create.mockResolvedValue({ id: '1', email: 'test@example.com' })
    const result = await createUser({ email: 'test@example.com', displayName: 'Test' })
    expect(result).toEqual({ id: '1', email: 'test@example.com' })
  })

  it('getUserById calls findUnique with id', async () => {
    mockUser.findUnique.mockResolvedValue({ id: '1' })
    await getUserById('1')
    expect(mockUser.findUnique).toHaveBeenCalledWith({ where: { id: '1' } })
  })

  it('getUserByEmail calls findUnique with email', async () => {
    mockUser.findUnique.mockResolvedValue({ id: '1' })
    await getUserByEmail('test@example.com')
    expect(mockUser.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } })
  })

  it('getUserByAzureOid calls findUnique with oid', async () => {
    mockUser.findUnique.mockResolvedValue({ id: '1' })
    await getUserByAzureOid('oid-123')
    expect(mockUser.findUnique).toHaveBeenCalledWith({ where: { azureAdOid: 'oid-123' } })
  })

  it('updateUser calls prisma update', async () => {
    mockUser.update.mockResolvedValue({ id: '1' })
    await updateUser('1', { displayName: 'Updated' })
    expect(mockUser.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { displayName: 'Updated' },
    })
  })

  it('deleteUser calls prisma delete', async () => {
    mockUser.delete.mockResolvedValue({ id: '1' })
    await deleteUser('1')
    expect(mockUser.delete).toHaveBeenCalledWith({ where: { id: '1' } })
  })
})
