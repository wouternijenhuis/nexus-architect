import { io, Socket } from 'socket.io-client'
import { XSDSchema } from '../types/xsd'

let socket: Socket | null = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5
let currentRoom: string | null = null
let currentUserId: string | null = null

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Event callback types
type ConnectionCallback = (connected: boolean) => void
type UserCallback = (data: { userId: string; schemaId: string }) => void
type SchemaUpdateCallback = (data: { schemaId: string; schema: XSDSchema; updatedBy: string }) => void

// Event listeners storage
const eventListeners = {
  connection: new Set<ConnectionCallback>(),
  userJoined: new Set<UserCallback>(),
  userLeft: new Set<UserCallback>(),
  schemaUpdated: new Set<SchemaUpdateCallback>(),
}

export function connectWebSocket(): Socket | null {
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('WebSocket connected')
      reconnectAttempts = 0
      
      // Notify all connection listeners
      eventListeners.connection.forEach(cb => cb(true))
      
      // Rejoin room after reconnection
      if (currentRoom && currentUserId) {
        socket?.emit('join-schema', { schemaId: currentRoom, userId: currentUserId })
      }
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      eventListeners.connection.forEach(cb => cb(false))
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      reconnectAttempts++
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnection attempts reached')
      }
    })

    socket.on('user-joined', (data: { userId: string; schemaId: string }) => {
      console.log('User joined:', data)
      eventListeners.userJoined.forEach(cb => cb(data))
    })

    socket.on('user-left', (data: { userId: string; schemaId: string }) => {
      console.log('User left:', data)
      eventListeners.userLeft.forEach(cb => cb(data))
    })

    socket.on('schema-updated', (data: { schemaId: string; schema: XSDSchema; updatedBy: string }) => {
      console.log('Schema updated from server:', data)
      eventListeners.schemaUpdated.forEach(cb => cb(data))
    })

    socket.on('collaboration-update', (data: any) => {
      console.log('Collaboration update:', data)
    })
  }
  return socket
}

export function disconnectWebSocket(): void {
  if (socket) {
    // Leave current room before disconnecting
    if (currentRoom) {
      socket.emit('leave-schema', { schemaId: currentRoom })
    }
    
    // Remove all event listeners to prevent accumulation
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
    currentRoom = null
    currentUserId = null
  }
}

export function isConnected(): boolean {
  return socket?.connected ?? false
}

export function getSocketId(): string | null {
  return socket?.id ?? null
}

export function joinSchemaRoom(schemaId: string, userId?: string): void {
  if (socket && socket.connected) {
    // Leave previous room if any
    if (currentRoom && currentRoom !== schemaId) {
      socket.emit('leave-schema', { schemaId: currentRoom })
    }
    
    currentRoom = schemaId
    currentUserId = userId || socket.id || null
    socket.emit('join-schema', { schemaId, userId: currentUserId })
    console.log(`Joined schema room: ${schemaId}`)
  }
}

export function leaveSchemaRoom(schemaId: string): void {
  if (socket && socket.connected) {
    socket.emit('leave-schema', { schemaId })
    if (currentRoom === schemaId) {
      currentRoom = null
    }
    console.log(`Left schema room: ${schemaId}`)
  }
}

export function broadcastSchemaUpdate(schemaId: string, schema: XSDSchema, userId?: string): void {
  if (socket && socket.connected) {
    socket.emit('update-schema', { schemaId, schema, userId: userId || currentUserId })
  }
}

// Legacy function name for backwards compatibility
export function emitSchemaUpdate(schemaId: string, schema: XSDSchema): void {
  broadcastSchemaUpdate(schemaId, schema)
}

// Event subscription functions
export function onConnectionChange(callback: ConnectionCallback): () => void {
  eventListeners.connection.add(callback)
  // Immediately call with current state
  callback(isConnected())
  return () => eventListeners.connection.delete(callback)
}

export function onUserJoined(callback: UserCallback): () => void {
  eventListeners.userJoined.add(callback)
  return () => eventListeners.userJoined.delete(callback)
}

export function onUserLeft(callback: UserCallback): () => void {
  eventListeners.userLeft.add(callback)
  return () => eventListeners.userLeft.delete(callback)
}

export function onSchemaUpdated(callback: SchemaUpdateCallback): () => void {
  eventListeners.schemaUpdated.add(callback)
  return () => eventListeners.schemaUpdated.delete(callback)
}

export function getCurrentRoom(): string | null {
  return currentRoom
}

export function getSocket(): Socket | null {
  return socket
}

// For testing purposes - reset internal state
export function __resetForTesting(): void {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  currentRoom = null
  currentUserId = null
  reconnectAttempts = 0
  eventListeners.connection.clear()
  eventListeners.userJoined.clear()
  eventListeners.userLeft.clear()
  eventListeners.schemaUpdated.clear()
}
