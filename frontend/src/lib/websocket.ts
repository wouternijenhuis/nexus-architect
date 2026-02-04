import { io, Socket } from 'socket.io-client'
import { XSDSchema } from '../types/xsd'

let socket: Socket | null = null

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function connectWebSocket() {
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      console.log('WebSocket connected')
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    socket.on('schema-updated', (data: { schemaId: string; schema: XSDSchema }) => {
      console.log('Schema updated from server:', data)
      // Handle real-time schema updates
    })

    socket.on('collaboration-update', (data: any) => {
      console.log('Collaboration update:', data)
      // Handle collaborative editing updates
    })
  }
  return socket
}

export function disconnectWebSocket() {
  if (socket) {
    // Remove all event listeners to prevent accumulation
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}

export function emitSchemaUpdate(schemaId: string, schema: XSDSchema) {
  if (socket && socket.connected) {
    socket.emit('update-schema', { schemaId, schema })
  }
}

export function joinSchemaRoom(schemaId: string) {
  if (socket && socket.connected) {
    socket.emit('join-schema', { schemaId })
  }
}

export function leaveSchemaRoom(schemaId: string) {
  if (socket && socket.connected) {
    socket.emit('leave-schema', { schemaId })
  }
}

export function getSocket() {
  return socket
}
