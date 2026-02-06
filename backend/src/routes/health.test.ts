import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import http from 'http'

// Mock dependencies before importing the router
vi.mock('../services/ai-service.js', () => ({
  isAzureAIConfigured: vi.fn(),
}))

vi.mock('../services/metrics-service.js', () => ({
  getMetrics: vi.fn(),
  getActiveConnections: vi.fn(),
}))

import healthRouter from './health.js'
import { isAzureAIConfigured } from '../services/ai-service.js'
import { getMetrics, getActiveConnections } from '../services/metrics-service.js'

// Helper to make a request to the express app
function request(app: express.Express, path: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const addr = server.address() as { port: number }
      const req = http.get(`http://127.0.0.1:${addr.port}${path}`, (res) => {
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
      })
      req.on('error', (err) => {
        server.close()
        reject(err)
      })
    })
  })
}

describe('Health Routes', () => {
  let app: express.Express

  beforeEach(() => {
    vi.restoreAllMocks()
    app = express()
    app.use(healthRouter)
  })

  describe('GET /health', () => {
    it('should return status ok with expected fields', async () => {
      vi.mocked(isAzureAIConfigured).mockReturnValue(true)

      const { status, body } = await request(app, '/health')

      expect(status).toBe(200)
      expect(body.status).toBe('ok')
      expect(body.message).toBe('Nexus Architect API is running')
      expect(body.timestamp).toBeDefined()
      expect(typeof body.uptime).toBe('number')
      expect(body.aiConfigured).toBe(true)
    })

    it('should report aiConfigured as false when not configured', async () => {
      vi.mocked(isAzureAIConfigured).mockReturnValue(false)

      const { body } = await request(app, '/health')

      expect(body.aiConfigured).toBe(false)
    })
  })

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      vi.mocked(getActiveConnections).mockReturnValue(5)
      vi.mocked(getMetrics).mockReturnValue({
        requests: { total: 100, byEndpoint: {} },
        websocket: { activeConnections: 5 },
        collectedAt: new Date().toISOString(),
      } as any)

      const { status, body } = await request(app, '/health/detailed')

      expect(status).toBe(200)
      expect(body.status).toBe('ok')
      expect(typeof body.uptime).toBe('number')
      expect(body.memory).toBeDefined()
      expect(typeof body.memory.heapUsed).toBe('number')
      expect(typeof body.memory.heapTotal).toBe('number')
      expect(typeof body.memory.rss).toBe('number')
      expect(body.activeConnections).toBe(5)
      expect(body.version).toBeDefined()
      expect(body.metrics).toBeDefined()
    })
  })
})
