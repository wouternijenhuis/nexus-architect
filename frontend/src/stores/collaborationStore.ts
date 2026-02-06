import { create } from 'zustand'

export interface CollaborationUser {
  id: string
  name: string
  color?: string
}

export interface CollaborationState {
  activeUsers: CollaborationUser[]
  isConnected: boolean
  currentRoom: string | null
  setActiveUsers: (users: CollaborationUser[]) => void
  addUser: (user: CollaborationUser) => void
  removeUser: (userId: string) => void
  setConnected: (connected: boolean) => void
  setCurrentRoom: (room: string | null) => void
  clearCollaboration: () => void
}

export const useCollaborationStore = create<CollaborationState>()((set) => ({
  activeUsers: [],
  isConnected: false,
  currentRoom: null,

  setActiveUsers: (users: CollaborationUser[]) => {
    set({ activeUsers: users })
  },

  addUser: (user: CollaborationUser) => {
    set((state) => {
      // Avoid duplicates
      if (state.activeUsers.some((u) => u.id === user.id)) {
        return state
      }
      return { activeUsers: [...state.activeUsers, user] }
    })
  },

  removeUser: (userId: string) => {
    set((state) => ({
      activeUsers: state.activeUsers.filter((u) => u.id !== userId),
    }))
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected })
  },

  setCurrentRoom: (room: string | null) => {
    set({ currentRoom: room })
  },

  clearCollaboration: () => {
    set({ activeUsers: [], currentRoom: null })
  },
}))
