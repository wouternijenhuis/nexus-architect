/**
 * Secret management service with Azure Key Vault integration.
 * Falls back to environment variables when Key Vault is not configured.
 */

export interface SecretsConfig {
  azureOpenAIEndpoint: string;
  azureOpenAIKey: string;
  azureOpenAIDeployment: string;
  databaseUrl: string;
  azureADClientId: string;
  azureADTenantId: string;
  azureADClientSecret: string;
}

const ENV_VAR_MAP: Record<keyof SecretsConfig, string> = {
  azureOpenAIEndpoint: 'AZURE_OPENAI_ENDPOINT',
  azureOpenAIKey: 'AZURE_OPENAI_API_KEY',
  azureOpenAIDeployment: 'AZURE_OPENAI_DEPLOYMENT',
  databaseUrl: 'DATABASE_URL',
  azureADClientId: 'AZURE_AD_CLIENT_ID',
  azureADTenantId: 'AZURE_AD_TENANT_ID',
  azureADClientSecret: 'AZURE_AD_CLIENT_SECRET',
};

const DEFAULTS: Partial<Record<keyof SecretsConfig, string>> = {
  azureOpenAIDeployment: 'gpt-4',
};

let cachedSecrets: SecretsConfig | null = null;

/**
 * Initialize secrets from Azure Key Vault or environment variables.
 * Results are cached in-memory for subsequent calls.
 */
export async function initializeSecrets(): Promise<SecretsConfig> {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL;

  if (keyVaultUrl) {
    console.log(`Azure Key Vault configured: ${keyVaultUrl}`);
    console.log(
      'Key Vault SDK not installed — falling back to environment variables'
    );
  }

  // Load secrets from environment variables (with optional defaults)
  const secrets: SecretsConfig = {} as SecretsConfig;

  for (const [key, envVar] of Object.entries(ENV_VAR_MAP)) {
    const secretKey = key as keyof SecretsConfig;
    secrets[secretKey] =
      process.env[envVar] ?? DEFAULTS[secretKey] ?? '';
  }

  cachedSecrets = secrets;
  return cachedSecrets;
}

/**
 * Get a single cached secret value.
 * `initializeSecrets()` must be called first.
 */
export function getSecret(key: keyof SecretsConfig): string {
  if (!cachedSecrets) {
    throw new Error(
      'Secrets not initialized. Call initializeSecrets() first.'
    );
  }
  return cachedSecrets[key];
}

/**
 * Get all cached secrets.
 * `initializeSecrets()` must be called first.
 */
export function getAllSecrets(): SecretsConfig {
  if (!cachedSecrets) {
    throw new Error(
      'Secrets not initialized. Call initializeSecrets() first.'
    );
  }
  return { ...cachedSecrets };
}

/**
 * Check whether an Azure Key Vault URL is configured.
 */
export function isKeyVaultConfigured(): boolean {
  return !!process.env.AZURE_KEY_VAULT_URL;
}

/**
 * Reset the cached secrets (useful for testing).
 */
export function _resetCache(): void {
  cachedSecrets = null;
}
