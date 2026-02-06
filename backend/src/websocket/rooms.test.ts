import { describe, it, expect, beforeEach } from 'vitest'
import {
  addUserToRoom,
  removeUserFromRoom,
  removeUserFromAllRooms,
  getRoomUsers,
  getRoomCount,
  clearAllRooms,
} from './rooms.js'

describe('WebSocket Rooms', () => {
  beforeEach(() => {
    clearAllRooms()
  })

  describe('addUserToRoom', () => {
    it('should add a user to a room', () => {
      addUserToRoom('schema-1', 'socket-1')
      const users = getRoomUsers('schema-1')
      expect(users).toBeDefined()
      expect(users!.has('socket-1')).toBe(true)
    })

    it('should create a new room if it does not exist', () => {
      expect(getRoomCount()).toBe(0)
      addUserToRoom('schema-1', 'socket-1')
      expect(getRoomCount()).toBe(1)
    })

    it('should allow multiple users in same room', () => {
      addUserToRoom('schema-1', 'socket-1')
      addUserToRoom('schema-1', 'socket-2')
      const users = getRoomUsers('schema-1')
      expect(users!.size).toBe(2)
    })

    it('should allow same user in different rooms', () => {
      addUserToRoom('schema-1', 'socket-1')
      addUserToRoom('schema-2', 'socket-1')
      expect(getRoomCount()).toBe(2)
    })
  })

  describe('removeUserFromRoom', () => {
    it('should remove a user from a room', () => {
      addUserToRoom('schema-1', 'socket-1')
      addUserToRoom('schema-1', 'socket-2')
      removeUserFromRoom('schema-1', 'socket-1')
      const users = getRoomUsers('schema-1')
      expect(users!.has('socket-1')).toBe(false)
      expect(users!.has('socket-2')).toBe(true)
    })

    it('should delete empty rooms', () => {
      addUserToRoom('schema-1', 'socket-1')
      removeUserFromRoom('schema-1', 'socket-1')
      expect(getRoomCount()).toBe(0)
      expect(getRoomUsers('schema-1')).toBeUndefined()
    })

    it('should handle removing from non-existent room', () => {
      expect(() => removeUserFromRoom('no-room', 'socket-1')).not.toThrow()
    })
  })

  describe('removeUserFromAllRooms', () => {
    it('should remove user from all rooms and return affected schemaIds', () => {
      addUserToRoom('schema-1', 'socket-1')
      addUserToRoom('schema-2', 'socket-1')
      addUserToRoom('schema-3', 'socket-2')

      const removed = removeUserFromAllRooms('socket-1')
      expect(removed).toHaveLength(2)
      expect(removed).toContain('schema-1')
      expect(removed).toContain('schema-2')
      expect(getRoomCount()).toBe(1) // Only schema-3 remains
    })

    it('should return empty array if user is in no rooms', () => {
      const removed = removeUserFromAllRooms('unknown')
      expect(removed).toHaveLength(0)
    })

    it('should clean up empty rooms after removal', () => {
      addUserToRoom('schema-1', 'socket-1')
      removeUserFromAllRooms('socket-1')
      expect(getRoomCount()).toBe(0)
    })
  })

  describe('getRoomUsers', () => {
    it('should return undefined for non-existent room', () => {
      expect(getRoomUsers('unknown')).toBeUndefined()
    })
  })

  describe('clearAllRooms', () => {
    it('should clear all rooms', () => {
      addUserToRoom('schema-1', 'socket-1')
      addUserToRoom('schema-2', 'socket-2')
      clearAllRooms()
      expect(getRoomCount()).toBe(0)
    })
  })
})
