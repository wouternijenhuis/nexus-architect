/**
 * Health-check route with detailed server info.
 */

import { Router } from 'express'
import { isAzureAIConfigured } from '../services/ai-service.js'
import { getMetrics, getActiveConnections } from '../services/metrics-service.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Nexus Architect API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    aiConfigured: isAzureAIConfigured(),
  })
})

router.get('/health/detailed', (_req, res) => {
  const memoryUsage = process.memoryUsage()
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
    },
    activeConnections: getActiveConnections(),
    version: process.env.npm_package_version || '1.0.0',
    metrics: getMetrics(),
  })
})

export default router
