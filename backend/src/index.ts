import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

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
app.use(cors())
app.use(express.json())

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Nexus Architect API is running' })
})

// Store active users per schema
const schemaRooms = new Map<string, Set<string>>()

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join-schema', ({ schemaId }) => {
    socket.join(`schema:${schemaId}`)
    
    if (!schemaRooms.has(schemaId)) {
      schemaRooms.set(schemaId, new Set())
    }
    schemaRooms.get(schemaId)?.add(socket.id)
    
    // Notify others in the room
    socket.to(`schema:${schemaId}`).emit('user-joined', {
      userId: socket.id,
      schemaId,
    })
    
    console.log(`User ${socket.id} joined schema: ${schemaId}`)
  })

  socket.on('leave-schema', ({ schemaId }) => {
    socket.leave(`schema:${schemaId}`)
    
    schemaRooms.get(schemaId)?.delete(socket.id)
    
    // Notify others in the room
    socket.to(`schema:${schemaId}`).emit('user-left', {
      userId: socket.id,
      schemaId,
    })
    
    console.log(`User ${socket.id} left schema: ${schemaId}`)
  })

  socket.on('update-schema', ({ schemaId, schema }) => {
    // Broadcast schema update to all users in the room except sender
    socket.to(`schema:${schemaId}`).emit('schema-updated', {
      schemaId,
      schema,
      updatedBy: socket.id,
    })
    
    console.log(`Schema ${schemaId} updated by ${socket.id}`)
  })

  socket.on('collaboration-update', ({ schemaId, update }) => {
    // Broadcast collaboration updates (cursor position, selections, etc.)
    socket.to(`schema:${schemaId}`).emit('collaboration-update', {
      schemaId,
      update,
      userId: socket.id,
    })
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    
    // Clean up user from all schema rooms
    schemaRooms.forEach((users, schemaId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id)
        io.to(`schema:${schemaId}`).emit('user-left', {
          userId: socket.id,
          schemaId,
        })
      }
    })
  })
})

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`WebSocket server ready for connections`)
})
