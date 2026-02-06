import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import http from 'http'

// Mock rate-limit middleware to be pass-through
vi.mock('../middleware/rate-limit.js', () => ({
  aiLimiter: (_req: any, _res: any, next: any) => next(),
  modificationLimiter: (_req: any, _res: any, next: any) => next(),
  generalLimiter: (_req: any, _res: any, next: any) => next(),
}))

// Mock ai-service
vi.mock('../services/ai-service.js', () => ({
  isAzureAIConfigured: vi.fn(),
  generateXMLSample: vi.fn(),
}))

// Mock metrics-service (used by health router which is mounted inside api)
vi.mock('../services/metrics-service.js', () => ({
  getMetrics: vi.fn().mockReturnValue({}),
  getActiveConnections: vi.fn().mockReturnValue(0),
}))

import apiRouter from './api.js'
import { isAzureAIConfigured, generateXMLSample } from '../services/ai-service.js'

// Helper to make a POST request
function postRequest(
  app: express.Express,
  path: string,
  body: any
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const addr = server.address() as { port: number }
      const postData = JSON.stringify(body)
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: addr.port,
          path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res) => {
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
        }
      )
      req.on('error', (err) => {
        server.close()
        reject(err)
      })
      req.write(postData)
      req.end()
    })
  })
}

describe('API Routes - /generate-xml', () => {
  let app: express.Express

  beforeEach(() => {
    vi.restoreAllMocks()
    app = express()
    app.use(express.json())
    app.use('/api', apiRouter)
  })

  it('should return 400 when xsdString is missing', async () => {
    const { status, body } = await postRequest(app, '/api/generate-xml', {
      context: 'some context',
    })

    expect(status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toContain('Missing required fields')
  })

  it('should return 400 when context is missing', async () => {
    const { status, body } = await postRequest(app, '/api/generate-xml', {
      xsdString: '<xs:schema/>',
    })

    expect(status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toContain('Missing required fields')
  })

  it('should return 503 when Azure AI is not configured', async () => {
    vi.mocked(isAzureAIConfigured).mockReturnValue(false)

    const { status, body } = await postRequest(app, '/api/generate-xml', {
      xsdString: '<xs:schema/>',
      context: 'test context',
    })

    expect(status).toBe(503)
    expect(body.success).toBe(false)
    expect(body.error).toContain('not configured')
  })

  it('should return generated XML on success', async () => {
    vi.mocked(isAzureAIConfigured).mockReturnValue(true)
    vi.mocked(generateXMLSample).mockResolvedValue({
      xml: '<root/>',
      success: true,
    })

    const { status, body } = await postRequest(app, '/api/generate-xml', {
      xsdString: '<xs:schema/>',
      context: 'test context',
      temperature: 0.5,
    })

    expect(status).toBe(200)
    expect(body.xml).toBe('<root/>')
    expect(body.success).toBe(true)
    expect(generateXMLSample).toHaveBeenCalledWith('<xs:schema/>', 'test context', 0.5)
  })
})
