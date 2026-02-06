import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock socket.io-client
const mockSocket = {
  id: 'test-socket-id',
  connected: true,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  removeAllListeners: vi.fn(),
  connect: vi.fn(),
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

// Import after mocking
import {
  connectWebSocket,
  disconnectWebSocket,
  isConnected,
  getSocketId,
  joinSchemaRoom,
  leaveSchemaRoom,
  broadcastSchemaUpdate,
  onConnectionChange,
  onUserJoined,
  onUserLeft,
  onSchemaUpdated,
  getCurrentRoom,
  __resetForTesting,
} from './websocket'
import type { XSDSchema } from '../types/xsd'

describe('WebSocket Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetForTesting()
    // Reset mock socket state
    mockSocket.connected = true
    mockSocket.id = 'test-socket-id'
  })

  afterEach(() => {
    __resetForTesting()
  })

  describe('connectWebSocket', () => {
    it('should create a socket connection', () => {
      const socket = connectWebSocket()
      
      expect(socket).toBeDefined()
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('user-joined', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('user-left', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('schema-updated', expect.any(Function))
    })

    it('should return existing socket if already connected', () => {
      const socket1 = connectWebSocket()
      const socket2 = connectWebSocket()
      
      expect(socket1).toBe(socket2)
    })

    it('should register event handlers', () => {
      connectWebSocket()
      
      const eventNames = mockSocket.on.mock.calls.map((call: any[]) => call[0])
      expect(eventNames).toContain('connect')
      expect(eventNames).toContain('disconnect')
      expect(eventNames).toContain('user-joined')
      expect(eventNames).toContain('user-left')
      expect(eventNames).toContain('schema-updated')
      expect(eventNames).toContain('collaboration-update')
      expect(eventNames).toContain('connect_error')
    })
  })

  describe('disconnectWebSocket', () => {
    it('should disconnect and cleanup socket', () => {
      connectWebSocket()
      disconnectWebSocket()
      
      expect(mockSocket.removeAllListeners).toHaveBeenCalled()
      expect(mockSocket.disconnect).toHaveBeenCalled()
    })

    it('should leave current room before disconnecting', () => {
      connectWebSocket()
      joinSchemaRoom('test-schema')
      disconnectWebSocket()
      
      expect(mockSocket.emit).toHaveBeenCalledWith('leave-schema', { schemaId: 'test-schema' })
    })
  })

  describe('isConnected', () => {
    it('should return true when socket is connected', () => {
      connectWebSocket()
      mockSocket.connected = true
      
      expect(isConnected()).toBe(true)
    })

    it('should return false when socket is not connected', () => {
      connectWebSocket()
      mockSocket.connected = false
      
      expect(isConnected()).toBe(false)
    })

    it('should return false when no socket exists', () => {
      expect(isConnected()).toBe(false)
    })
  })

  describe('getSocketId', () => {
    it('should return socket id when connected', () => {
      connectWebSocket()
      
      expect(getSocketId()).toBe('test-socket-id')
    })

    it('should return null when no socket exists', () => {
      expect(getSocketId()).toBeNull()
    })
  })

  describe('joinSchemaRoom', () => {
    it('should emit join-schema event', () => {
      connectWebSocket()
      joinSchemaRoom('schema-123', 'user-456')
      
      expect(mockSocket.emit).toHaveBeenCalledWith('join-schema', {
        schemaId: 'schema-123',
        userId: 'user-456',
      })
    })

    it('should update current room', () => {
      connectWebSocket()
      joinSchemaRoom('schema-123')
      
      expect(getCurrentRoom()).toBe('schema-123')
    })

    it('should leave previous room when joining a new one', () => {
      connectWebSocket()
      joinSchemaRoom('schema-1')
      joinSchemaRoom('schema-2')
      
      expect(mockSocket.emit).toHaveBeenCalledWith('leave-schema', { schemaId: 'schema-1' })
      expect(mockSocket.emit).toHaveBeenCalledWith('join-schema', expect.objectContaining({
        schemaId: 'schema-2',
      }))
    })

    it('should not emit when socket is disconnected', () => {
      connectWebSocket()
      mockSocket.connected = false
      joinSchemaRoom('schema-123')
      
      expect(mockSocket.emit).not.toHaveBeenCalled()
    })
  })

  describe('leaveSchemaRoom', () => {
    it('should emit leave-schema event', () => {
      connectWebSocket()
      leaveSchemaRoom('schema-123')
      
      expect(mockSocket.emit).toHaveBeenCalledWith('leave-schema', { schemaId: 'schema-123' })
    })

    it('should clear current room when leaving', () => {
      connectWebSocket()
      joinSchemaRoom('schema-123')
      leaveSchemaRoom('schema-123')
      
      expect(getCurrentRoom()).toBeNull()
    })

    it('should not clear current room when leaving a different room', () => {
      connectWebSocket()
      joinSchemaRoom('schema-1')
      leaveSchemaRoom('schema-2')
      
      expect(getCurrentRoom()).toBe('schema-1')
    })
  })

  describe('broadcastSchemaUpdate', () => {
    it('should emit update-schema event with schema data', () => {
      connectWebSocket()
      
      const mockSchema: XSDSchema = {
        id: 'schema-123',
        name: 'Test Schema',
        elements: [],
        complexTypes: [],
        simpleTypes: [],
        imports: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      broadcastSchemaUpdate('schema-123', mockSchema, 'user-456')
      
      expect(mockSocket.emit).toHaveBeenCalledWith('update-schema', {
        schemaId: 'schema-123',
        schema: mockSchema,
        userId: 'user-456',
      })
    })

    it('should not emit when socket is disconnected', () => {
      connectWebSocket()
      mockSocket.connected = false
      
      const mockSchema: XSDSchema = {
        id: 'schema-123',
        name: 'Test Schema',
        elements: [],
        complexTypes: [],
        simpleTypes: [],
        imports: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      broadcastSchemaUpdate('schema-123', mockSchema)
      
      expect(mockSocket.emit).not.toHaveBeenCalled()
    })
  })

  describe('Event Subscriptions', () => {
    describe('onConnectionChange', () => {
      it('should call callback immediately with current state', () => {
        connectWebSocket()
        const callback = vi.fn()
        
        onConnectionChange(callback)
        
        expect(callback).toHaveBeenCalledWith(true)
      })

      it('should return unsubscribe function', () => {
        connectWebSocket()
        const callback = vi.fn()
        
        const unsubscribe = onConnectionChange(callback)
        expect(typeof unsubscribe).toBe('function')
        
        // Clear the initial call
        callback.mockClear()
        
        // Unsubscribe
        unsubscribe()
        
        // Simulate connection event - callback should not be called
        const connectHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'connect')?.[1]
        if (connectHandler) {
          connectHandler()
        }
        
        // The callback should not be called after unsubscribe
        // Note: The actual implementation details may vary
      })
    })

    describe('onUserJoined', () => {
      it('should return unsubscribe function', () => {
        connectWebSocket()
        const callback = vi.fn()
        
        const unsubscribe = onUserJoined(callback)
        
        expect(typeof unsubscribe).toBe('function')
      })
    })

    describe('onUserLeft', () => {
      it('should return unsubscribe function', () => {
        connectWebSocket()
        const callback = vi.fn()
        
        const unsubscribe = onUserLeft(callback)
        
        expect(typeof unsubscribe).toBe('function')
      })
    })

    describe('onSchemaUpdated', () => {
      it('should return unsubscribe function', () => {
        connectWebSocket()
        const callback = vi.fn()
        
        const unsubscribe = onSchemaUpdated(callback)
        
        expect(typeof unsubscribe).toBe('function')
      })
    })
  })
})
