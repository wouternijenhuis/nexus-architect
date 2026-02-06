/**
 * WebSocket (Socket.IO) event handlers.
 * Delegates room management to the collaboration service.
 */

import { Server } from 'socket.io'
import {
  joinSchema,
  leaveSchema,
  handleDisconnect,
} from '../services/collaboration-service.js'

/**
 * Register all Socket.IO event handlers on the given server instance.
 */
export function setupWebSocket(io: Server): void {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-schema', ({ schemaId }: { schemaId: string }) => {
      const { roomKey } = joinSchema(schemaId, socket.id)
      socket.join(roomKey)

      socket.to(roomKey).emit('user-joined', {
        userId: socket.id,
        schemaId,
      })

      console.log(`User ${socket.id} joined schema: ${schemaId}`)
    })

    socket.on('leave-schema', ({ schemaId }: { schemaId: string }) => {
      const { roomKey } = leaveSchema(schemaId, socket.id)
      socket.leave(roomKey)

      socket.to(roomKey).emit('user-left', {
        userId: socket.id,
        schemaId,
      })

      console.log(`User ${socket.id} left schema: ${schemaId}`)
    })

    socket.on('update-schema', ({ schemaId, schema }: { schemaId: string; schema: unknown }) => {
      socket.to(`schema:${schemaId}`).emit('schema-updated', {
        schemaId,
        schema,
        updatedBy: socket.id,
      })

      console.log(`Schema ${schemaId} updated by ${socket.id}`)
    })

    socket.on('collaboration-update', ({ schemaId, update }: { schemaId: string; update: unknown }) => {
      socket.to(`schema:${schemaId}`).emit('collaboration-update', {
        schemaId,
        update,
        userId: socket.id,
      })
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)

      const { schemaIds } = handleDisconnect(socket.id)
      for (const schemaId of schemaIds) {
        io.to(`schema:${schemaId}`).emit('user-left', {
          userId: socket.id,
          schemaId,
        })
      }
    })
  })
}
