import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { initializeAzureAI } from './services/ai-service.js'
import { generalLimiter } from './middleware/rate-limit.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { requestLogger } from './middleware/request-logger.js'
import { securityHeaders, httpsRedirect } from './middleware/security-headers.js'
import { auditMiddleware } from './middleware/audit-middleware.js'
import apiRouter from './routes/api.js'
import { setupWebSocket } from './websocket/handlers.js'

dotenv.config()

// Initialize AI service
initializeAzureAI()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

const PORT = process.env.PORT || 3001

// Middleware
app.use(securityHeaders)
app.use(httpsRedirect)
app.use(cors())
app.use(express.json())
app.use(requestLogger())
app.use(auditMiddleware)

// Apply general rate limiter to all API routes
app.use('/api', generalLimiter)

// Mount API routes
app.use('/api', apiRouter)

// 404 handler for unknown API routes
app.use('/api', notFoundHandler)

// Global error handler (must be last middleware)
app.use(errorHandler)

// Setup WebSocket handlers
setupWebSocket(io)

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`WebSocket server ready for connections`)
})

export { app, httpServer, io }
