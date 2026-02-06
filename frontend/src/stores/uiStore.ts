import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createDebouncedStorage } from '../lib/debounced-storage'

export interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  activeModal: string | null

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  openModal: (modalId: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      activeModal: null,

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }))
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open })
      },

      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme })
      },

      openModal: (modalId: string) => {
        set({ activeModal: modalId })
      },

      closeModal: () => {
        set({ activeModal: null })
      },
    }),
    {
      name: 'nexus-architect-ui',
      storage: createJSONStorage(() => createDebouncedStorage(500)),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
)
