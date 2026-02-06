/**
 * MSAL (Microsoft Authentication Library) configuration for Azure AD.
 *
 * These settings are used when Azure AD authentication is enabled.
 * Set VITE_AZURE_AD_CLIENT_ID and VITE_AZURE_AD_TENANT_ID environment
 * variables to activate Azure AD login.
 */

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID || 'common'}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage' as const,
    storeAuthStateInCookie: false,
  },
}

export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
}

/**
 * Check whether Azure AD is configured via environment variables.
 * Returns true only when both client ID and tenant ID are provided.
 */
export function isAzureADConfigured(): boolean {
  return !!(import.meta.env.VITE_AZURE_AD_CLIENT_ID && import.meta.env.VITE_AZURE_AD_TENANT_ID)
}
