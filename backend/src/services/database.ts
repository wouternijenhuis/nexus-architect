/**
 * Prisma database client singleton.
 * Ensures a single PrismaClient instance is reused across the application.
 */

import { PrismaClient } from '../generated/prisma/client.js'

let prisma: PrismaClient | null = null

export function getDatabase(): PrismaClient {
  if (!prisma) {
    // @ts-expect-error Prisma v7 generated client constructor
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    })
  }
  return prisma
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}

/**
 * Check if database is connected and responsive.
 */
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    const db = getDatabase()
    await db.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}
