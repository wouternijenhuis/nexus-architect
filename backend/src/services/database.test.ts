import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockDisconnect = vi.fn().mockResolvedValue(undefined)
const mockQueryRaw = vi.fn().mockResolvedValue([{ '1': 1 }])

// Mock PrismaClient as a class constructor
vi.mock('../generated/prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {
      $disconnect = mockDisconnect
      $queryRaw = mockQueryRaw
    },
  }
})

import { getDatabase, disconnectDatabase, isDatabaseHealthy } from './database'

describe('database service', () => {
  beforeEach(async () => {
    await disconnectDatabase()
  })

  it('should return a PrismaClient instance', () => {
    const db = getDatabase()
    expect(db).toBeDefined()
  })

  it('should return the same instance on multiple calls', () => {
    const db1 = getDatabase()
    const db2 = getDatabase()
    expect(db1).toBe(db2)
  })

  it('should disconnect and null the client', async () => {
    const db = getDatabase()
    await disconnectDatabase()
    // After disconnect, a new call creates a new instance
    const db2 = getDatabase()
    expect(db2).toBeDefined()
    expect(db2).not.toBe(db)
  })

  it('isDatabaseHealthy should return true when DB responds', async () => {
    const healthy = await isDatabaseHealthy()
    expect(healthy).toBe(true)
  })

  it('isDatabaseHealthy should return false when DB throws', async () => {
    getDatabase()
    mockQueryRaw.mockRejectedValueOnce(new Error('DB down'))
    const healthy = await isDatabaseHealthy()
    expect(healthy).toBe(false)
  })
})
