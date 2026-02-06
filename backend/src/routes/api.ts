/**
 * Central API router – mounts all sub-routes.
 */

import { Router } from 'express'
import { aiLimiter, modificationLimiter } from '../middleware/rate-limit.js'
import { asyncHandler } from '../middleware/error-handler.js'
import { generateXMLSample, isAzureAIConfigured } from '../services/ai-service.js'
import healthRouter from './health.js'
import backupRouter from './backup.js'

const router = Router()

// Health check
router.use(healthRouter)

// Backup & recovery
router.use('/backup', backupRouter)

// AI Generation endpoint with stricter rate limiting
router.post('/generate-xml', aiLimiter, modificationLimiter, asyncHandler(async (req, res) => {
  const { xsdString, context, temperature } = req.body

  if (!xsdString || !context) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: xsdString and context',
    })
  }

  if (!isAzureAIConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Azure OpenAI is not configured on the server',
    })
  }

  const result = await generateXMLSample(xsdString, context, temperature)
  res.json(result)
}))

export default router
