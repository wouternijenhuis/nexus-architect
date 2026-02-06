/**
 * Collaboration service – orchestrates room management and user tracking
 * for real-time schema collaboration over WebSockets.
 */

import {
  addUserToRoom,
  removeUserFromRoom,
  removeUserFromAllRooms,
  getRoomUsers,
  getRoomCount,
} from '../websocket/rooms.js'

export interface JoinResult {
  roomKey: string
}

export interface LeaveResult {
  roomKey: string
}

export interface DisconnectResult {
  schemaIds: string[]
}

/**
 * Handle a user joining a schema collaboration session.
 */
export function joinSchema(schemaId: string, socketId: string): JoinResult {
  addUserToRoom(schemaId, socketId)
  return { roomKey: `schema:${schemaId}` }
}

/**
 * Handle a user leaving a schema collaboration session.
 */
export function leaveSchema(schemaId: string, socketId: string): LeaveResult {
  removeUserFromRoom(schemaId, socketId)
  return { roomKey: `schema:${schemaId}` }
}

/**
 * Handle user disconnect – remove from every room they are in.
 */
export function handleDisconnect(socketId: string): DisconnectResult {
  const schemaIds = removeUserFromAllRooms(socketId)
  return { schemaIds }
}

/**
 * Return the set of users currently in a schema room.
 */
export function getSchemaUsers(schemaId: string): Set<string> | undefined {
  return getRoomUsers(schemaId)
}

/**
 * Return the number of active schema rooms.
 */
export function getActiveRoomCount(): number {
  return getRoomCount()
}
