import { describe, it, expect, beforeEach } from 'vitest'
import { joinSchema, leaveSchema, handleDisconnect, getSchemaUsers, getActiveRoomCount } from './collaboration-service.js'
import { clearAllRooms } from '../websocket/rooms.js'

describe('Collaboration Service', () => {
  beforeEach(() => {
    clearAllRooms()
  })

  describe('joinSchema', () => {
    it('should return room key when joining a schema', () => {
      const result = joinSchema('schema-1', 'socket-1')
      expect(result.roomKey).toBe('schema:schema-1')
    })

    it('should track user in the room', () => {
      joinSchema('schema-1', 'socket-1')
      const users = getSchemaUsers('schema-1')
      expect(users).toBeDefined()
      expect(users!.has('socket-1')).toBe(true)
    })

    it('should allow multiple users to join same schema', () => {
      joinSchema('schema-1', 'socket-1')
      joinSchema('schema-1', 'socket-2')
      const users = getSchemaUsers('schema-1')
      expect(users!.size).toBe(2)
    })
  })

  describe('leaveSchema', () => {
    it('should return room key when leaving a schema', () => {
      joinSchema('schema-1', 'socket-1')
      const result = leaveSchema('schema-1', 'socket-1')
      expect(result.roomKey).toBe('schema:schema-1')
    })

    it('should remove user from the room', () => {
      joinSchema('schema-1', 'socket-1')
      leaveSchema('schema-1', 'socket-1')
      expect(getActiveRoomCount()).toBe(0)
    })
  })

  describe('handleDisconnect', () => {
    it('should remove user from all rooms and return affected schema IDs', () => {
      joinSchema('schema-1', 'socket-1')
      joinSchema('schema-2', 'socket-1')
      joinSchema('schema-3', 'socket-2')

      const result = handleDisconnect('socket-1')
      expect(result.schemaIds).toHaveLength(2)
      expect(result.schemaIds).toContain('schema-1')
      expect(result.schemaIds).toContain('schema-2')
    })

    it('should return empty array if user is in no rooms', () => {
      const result = handleDisconnect('unknown')
      expect(result.schemaIds).toHaveLength(0)
    })
  })

  describe('getActiveRoomCount', () => {
    it('should return 0 when no rooms exist', () => {
      expect(getActiveRoomCount()).toBe(0)
    })

    it('should track active rooms', () => {
      joinSchema('schema-1', 'socket-1')
      joinSchema('schema-2', 'socket-2')
      expect(getActiveRoomCount()).toBe(2)
    })
  })
})
