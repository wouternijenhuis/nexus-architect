/**
 * Room management for WebSocket schema collaboration.
 * Tracks active users per schema room using an in-memory Map.
 */

const schemaRooms = new Map<string, Set<string>>()

/**
 * Add a user to a schema room.
 * Creates the room if it doesn't exist.
 */
export function addUserToRoom(schemaId: string, socketId: string): void {
  if (!schemaRooms.has(schemaId)) {
    schemaRooms.set(schemaId, new Set())
  }
  schemaRooms.get(schemaId)!.add(socketId)
}

/**
 * Remove a user from a specific schema room.
 */
export function removeUserFromRoom(schemaId: string, socketId: string): void {
  const users = schemaRooms.get(schemaId)
  if (!users) return
  users.delete(socketId)
  if (users.size === 0) {
    schemaRooms.delete(schemaId)
  }
}

/**
 * Remove a user from ALL rooms they belong to.
 * Returns the list of schemaIds the user was removed from.
 */
export function removeUserFromAllRooms(socketId: string): string[] {
  const removedFrom: string[] = []
  schemaRooms.forEach((users, schemaId) => {
    if (users.has(socketId)) {
      users.delete(socketId)
      removedFrom.push(schemaId)
      if (users.size === 0) {
        schemaRooms.delete(schemaId)
      }
    }
  })
  return removedFrom
}

/**
 * Get the set of user socket IDs in a schema room.
 */
export function getRoomUsers(schemaId: string): Set<string> | undefined {
  return schemaRooms.get(schemaId)
}

/**
 * Get the number of active rooms.
 */
export function getRoomCount(): number {
  return schemaRooms.size
}

/**
 * Clear all rooms (useful for testing).
 */
export function clearAllRooms(): void {
  schemaRooms.clear()
}
