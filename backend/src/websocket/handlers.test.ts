import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock collaboration-service
vi.mock('../services/collaboration-service.js', () => ({
  joinSchema: vi.fn(),
  leaveSchema: vi.fn(),
  handleDisconnect: vi.fn(),
}))

import { setupWebSocket } from './handlers.js'
import { joinSchema, leaveSchema, handleDisconnect } from '../services/collaboration-service.js'

function createMockSocket() {
  const listeners: Record<string, Function> = {}
  return {
    id: 'test-socket-id',
    on: vi.fn((event: string, handler: Function) => {
      listeners[event] = handler
    }),
    join: vi.fn(),
    leave: vi.fn(),
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
    // Helper to trigger events in tests
    _trigger(event: string, ...args: any[]) {
      if (listeners[event]) {
        listeners[event](...args)
      }
    },
  }
}

function createMockIO() {
  let connectionHandler: Function | null = null
  return {
    on: vi.fn((event: string, handler: Function) => {
      if (event === 'connection') {
        connectionHandler = handler
      }
    }),
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
    // Helper to simulate a new connection
    _simulateConnection(socket: any) {
      if (connectionHandler) {
        connectionHandler(socket)
      }
    },
  }
}

describe('WebSocket Handlers', () => {
  let mockIO: ReturnType<typeof createMockIO>
  let mockSocket: ReturnType<typeof createMockSocket>

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    mockIO = createMockIO()
    mockSocket = createMockSocket()
  })

  it('should register connection handler on io', () => {
    setupWebSocket(mockIO as any)
    expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function))
  })

  it('should register all event handlers on socket connection', () => {
    setupWebSocket(mockIO as any)
    mockIO._simulateConnection(mockSocket)

    expect(mockSocket.on).toHaveBeenCalledWith('join-schema', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('leave-schema', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('update-schema', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('collaboration-update', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
  })

  describe('join-schema event', () => {
    it('should join room and emit user-joined to others', () => {
      vi.mocked(joinSchema).mockReturnValue({ roomKey: 'schema:s1' })

      setupWebSocket(mockIO as any)
      mockIO._simulateConnection(mockSocket)
      mockSocket._trigger('join-schema', { schemaId: 's1' })

      expect(joinSchema).toHaveBeenCalledWith('s1', 'test-socket-id')
      expect(mockSocket.join).toHaveBeenCalledWith('schema:s1')
      expect(mockSocket.to).toHaveBeenCalledWith('schema:s1')
      expect(mockSocket.emit).toHaveBeenCalledWith('user-joined', {
        userId: 'test-socket-id',
        schemaId: 's1',
      })
    })
  })

  describe('leave-schema event', () => {
    it('should leave room and emit user-left to others', () => {
      vi.mocked(leaveSchema).mockReturnValue({ roomKey: 'schema:s2' })

      setupWebSocket(mockIO as any)
      mockIO._simulateConnection(mockSocket)
      mockSocket._trigger('leave-schema', { schemaId: 's2' })

      expect(leaveSchema).toHaveBeenCalledWith('s2', 'test-socket-id')
      expect(mockSocket.leave).toHaveBeenCalledWith('schema:s2')
      expect(mockSocket.to).toHaveBeenCalledWith('schema:s2')
      expect(mockSocket.emit).toHaveBeenCalledWith('user-left', {
        userId: 'test-socket-id',
        schemaId: 's2',
      })
    })
  })

  describe('update-schema event', () => {
    it('should broadcast schema update to room', () => {
      setupWebSocket(mockIO as any)
      mockIO._simulateConnection(mockSocket)
      mockSocket._trigger('update-schema', { schemaId: 's3', schema: { name: 'test' } })

      expect(mockSocket.to).toHaveBeenCalledWith('schema:s3')
      expect(mockSocket.emit).toHaveBeenCalledWith('schema-updated', {
        schemaId: 's3',
        schema: { name: 'test' },
        updatedBy: 'test-socket-id',
      })
    })
  })

  describe('collaboration-update event', () => {
    it('should broadcast collaboration update to room', () => {
      setupWebSocket(mockIO as any)
      mockIO._simulateConnection(mockSocket)
      mockSocket._trigger('collaboration-update', { schemaId: 's4', update: { cursor: 10 } })

      expect(mockSocket.to).toHaveBeenCalledWith('schema:s4')
      expect(mockSocket.emit).toHaveBeenCalledWith('collaboration-update', {
        schemaId: 's4',
        update: { cursor: 10 },
        userId: 'test-socket-id',
      })
    })
  })

  describe('disconnect event', () => {
    it('should handle disconnect and notify rooms', () => {
      vi.mocked(handleDisconnect).mockReturnValue({ schemaIds: ['s1', 's2'] })

      setupWebSocket(mockIO as any)
      mockIO._simulateConnection(mockSocket)
      mockSocket._trigger('disconnect')

      expect(handleDisconnect).toHaveBeenCalledWith('test-socket-id')
      expect(mockIO.to).toHaveBeenCalledWith('schema:s1')
      expect(mockIO.to).toHaveBeenCalledWith('schema:s2')
      expect(mockIO.emit).toHaveBeenCalledWith('user-left', {
        userId: 'test-socket-id',
        schemaId: 's1',
      })
      expect(mockIO.emit).toHaveBeenCalledWith('user-left', {
        userId: 'test-socket-id',
        schemaId: 's2',
      })
    })

    it('should handle disconnect with no active rooms', () => {
      vi.mocked(handleDisconnect).mockReturnValue({ schemaIds: [] })

      setupWebSocket(mockIO as any)
      mockIO._simulateConnection(mockSocket)
      mockSocket._trigger('disconnect')

      expect(handleDisconnect).toHaveBeenCalledWith('test-socket-id')
      // io.to should not be called when there are no schemas
      expect(mockIO.to).not.toHaveBeenCalled()
    })
  })
})
