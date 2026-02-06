import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('auth-config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('isAzureADConfigured', () => {
    it('should return false when env vars are not set', async () => {
      vi.stubEnv('VITE_AZURE_AD_CLIENT_ID', '')
      vi.stubEnv('VITE_AZURE_AD_TENANT_ID', '')

      const { isAzureADConfigured } = await import('./auth-config')
      expect(isAzureADConfigured()).toBe(false)
    })

    it('should return false when only client ID is set', async () => {
      vi.stubEnv('VITE_AZURE_AD_CLIENT_ID', 'some-client-id')
      vi.stubEnv('VITE_AZURE_AD_TENANT_ID', '')

      const { isAzureADConfigured } = await import('./auth-config')
      expect(isAzureADConfigured()).toBe(false)
    })

    it('should return false when only tenant ID is set', async () => {
      vi.stubEnv('VITE_AZURE_AD_CLIENT_ID', '')
      vi.stubEnv('VITE_AZURE_AD_TENANT_ID', 'some-tenant-id')

      const { isAzureADConfigured } = await import('./auth-config')
      expect(isAzureADConfigured()).toBe(false)
    })

    it('should return true when both client ID and tenant ID are set', async () => {
      vi.stubEnv('VITE_AZURE_AD_CLIENT_ID', 'some-client-id')
      vi.stubEnv('VITE_AZURE_AD_TENANT_ID', 'some-tenant-id')

      const { isAzureADConfigured } = await import('./auth-config')
      expect(isAzureADConfigured()).toBe(true)
    })
  })

  describe('msalConfig', () => {
    it('should have expected structure', async () => {
      const { msalConfig } = await import('./auth-config')

      expect(msalConfig).toHaveProperty('auth')
      expect(msalConfig).toHaveProperty('cache')
      expect(msalConfig.auth).toHaveProperty('clientId')
      expect(msalConfig.auth).toHaveProperty('authority')
      expect(msalConfig.auth).toHaveProperty('redirectUri')
      expect(msalConfig.cache.cacheLocation).toBe('sessionStorage')
      expect(msalConfig.cache.storeAuthStateInCookie).toBe(false)
    })

    it('should use common authority when tenant ID is not set', async () => {
      vi.stubEnv('VITE_AZURE_AD_TENANT_ID', '')

      const { msalConfig } = await import('./auth-config')
      expect(msalConfig.auth.authority).toContain('common')
    })
  })

  describe('loginRequest', () => {
    it('should have expected scopes', async () => {
      const { loginRequest } = await import('./auth-config')

      expect(loginRequest.scopes).toContain('User.Read')
      expect(loginRequest.scopes).toContain('openid')
      expect(loginRequest.scopes).toContain('profile')
      expect(loginRequest.scopes).toContain('email')
    })
  })
})
