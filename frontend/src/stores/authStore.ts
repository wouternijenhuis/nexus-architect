import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createDebouncedStorage } from '../lib/debounced-storage'

// TODO: Replace with Azure AD in Phase 3
const FIXED_PASSWORD = 'nexusarchitect123'

export interface AzureUser {
  oid: string
  email: string
  name: string
}

export interface AuthState {
  isAuthenticated: boolean
  azureUser?: AzureUser
  accessToken?: string
  login: (password: string) => boolean
  loginWithAzureAD: (user: AzureUser & { accessToken: string }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      azureUser: undefined,
      accessToken: undefined,

      login: (password: string) => {
        if (password === FIXED_PASSWORD) {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },

      loginWithAzureAD: (user: AzureUser & { accessToken: string }) => {
        set({
          isAuthenticated: true,
          azureUser: {
            oid: user.oid,
            email: user.email,
            name: user.name,
          },
          accessToken: user.accessToken,
        })
      },

      logout: () => {
        set({
          isAuthenticated: false,
          azureUser: undefined,
          accessToken: undefined,
        })
      },
    }),
    {
      name: 'nexus-architect-auth',
      storage: createJSONStorage(() => createDebouncedStorage(500)),
    }
  )
)
