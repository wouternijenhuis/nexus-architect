import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initializeSecrets,
  getSecret,
  getAllSecrets,
  isKeyVaultConfigured,
  _resetCache,
} from './secrets-service';

describe('secrets-service', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    _resetCache();
    // Clear all relevant env vars before each test
    delete process.env.AZURE_KEY_VAULT_URL;
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_API_KEY;
    delete process.env.AZURE_OPENAI_DEPLOYMENT;
    delete process.env.DATABASE_URL;
    delete process.env.AZURE_AD_CLIENT_ID;
    delete process.env.AZURE_AD_TENANT_ID;
    delete process.env.AZURE_AD_CLIENT_SECRET;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
    _resetCache();
  });

  it('initializeSecrets loads from env vars when no Key Vault', async () => {
    process.env.AZURE_OPENAI_ENDPOINT = 'https://my-openai.openai.azure.com';
    process.env.AZURE_OPENAI_API_KEY = 'test-api-key';
    process.env.DATABASE_URL = 'postgres://localhost/test';

    const secrets = await initializeSecrets();

    expect(secrets.azureOpenAIEndpoint).toBe('https://my-openai.openai.azure.com');
    expect(secrets.azureOpenAIKey).toBe('test-api-key');
    expect(secrets.databaseUrl).toBe('postgres://localhost/test');
  });

  it('getSecret returns correct value from env', async () => {
    process.env.AZURE_OPENAI_ENDPOINT = 'https://endpoint.test';
    process.env.AZURE_OPENAI_API_KEY = 'key-123';

    await initializeSecrets();

    expect(getSecret('azureOpenAIEndpoint')).toBe('https://endpoint.test');
    expect(getSecret('azureOpenAIKey')).toBe('key-123');
  });

  it('getSecret returns empty string for unset env vars', async () => {
    await initializeSecrets();

    expect(getSecret('azureOpenAIEndpoint')).toBe('');
    expect(getSecret('azureOpenAIKey')).toBe('');
    expect(getSecret('databaseUrl')).toBe('');
    expect(getSecret('azureADClientId')).toBe('');
    expect(getSecret('azureADTenantId')).toBe('');
    expect(getSecret('azureADClientSecret')).toBe('');
  });

  it('getSecret uses default for azureOpenAIDeployment', async () => {
    await initializeSecrets();

    expect(getSecret('azureOpenAIDeployment')).toBe('gpt-4');
  });

  it('getAllSecrets returns complete config object', async () => {
    process.env.AZURE_OPENAI_ENDPOINT = 'https://endpoint.test';
    process.env.AZURE_OPENAI_API_KEY = 'key-123';
    process.env.AZURE_OPENAI_DEPLOYMENT = 'gpt-4o';
    process.env.DATABASE_URL = 'postgres://localhost/db';
    process.env.AZURE_AD_CLIENT_ID = 'client-id';
    process.env.AZURE_AD_TENANT_ID = 'tenant-id';
    process.env.AZURE_AD_CLIENT_SECRET = 'client-secret';

    await initializeSecrets();
    const all = getAllSecrets();

    expect(all).toEqual({
      azureOpenAIEndpoint: 'https://endpoint.test',
      azureOpenAIKey: 'key-123',
      azureOpenAIDeployment: 'gpt-4o',
      databaseUrl: 'postgres://localhost/db',
      azureADClientId: 'client-id',
      azureADTenantId: 'tenant-id',
      azureADClientSecret: 'client-secret',
    });
  });

  it('isKeyVaultConfigured returns false when AZURE_KEY_VAULT_URL not set', () => {
    expect(isKeyVaultConfigured()).toBe(false);
  });

  it('isKeyVaultConfigured returns true when AZURE_KEY_VAULT_URL is set', () => {
    process.env.AZURE_KEY_VAULT_URL = 'https://my-vault.vault.azure.net';
    expect(isKeyVaultConfigured()).toBe(true);
  });

  it('initializeSecrets logs Key Vault info when URL is set', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    process.env.AZURE_KEY_VAULT_URL = 'https://my-vault.vault.azure.net';

    await initializeSecrets();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Azure Key Vault configured: https://my-vault.vault.azure.net'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Key Vault SDK not installed — falling back to environment variables'
    );

    consoleSpy.mockRestore();
  });

  it('multiple calls to initializeSecrets use cached values', async () => {
    process.env.AZURE_OPENAI_ENDPOINT = 'https://first-call.test';
    const first = await initializeSecrets();

    // Change the env var — should NOT affect cached result
    process.env.AZURE_OPENAI_ENDPOINT = 'https://second-call.test';
    const second = await initializeSecrets();

    expect(first.azureOpenAIEndpoint).toBe('https://first-call.test');
    expect(second.azureOpenAIEndpoint).toBe('https://first-call.test');
    expect(first).toEqual(second);
  });

  it('getSecret throws if secrets not initialized', () => {
    expect(() => getSecret('databaseUrl')).toThrow(
      'Secrets not initialized. Call initializeSecrets() first.'
    );
  });

  it('getAllSecrets throws if secrets not initialized', () => {
    expect(() => getAllSecrets()).toThrow(
      'Secrets not initialized. Call initializeSecrets() first.'
    );
  });
});
