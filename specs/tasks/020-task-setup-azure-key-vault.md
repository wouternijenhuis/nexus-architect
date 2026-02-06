# Task 020: Setup Azure Key Vault

**Task ID**: TASK-020
**Order**: 020
**Phase**: Phase 3 - Production Readiness
**Priority**: HIGH
**Estimated Effort**: 2-3 days
**Status**: NOT STARTED

## Description

Move all secrets and configuration from environment variables to Azure Key Vault. Implement secure secret retrieval at application startup.

## Dependencies

- Task 013 (Backend Service Layer)

## Technical Requirements

### Backend
- Install @azure/identity and @azure/keyvault-secrets
- Implement secret retrieval service
- Replace direct env var reads with Key Vault lookups
- Cache secrets in-memory after retrieval (with TTL)
- Fallback to env vars for local development
- Secrets to manage: Azure OpenAI key, DB connection string, Azure AD client secret

### Configuration
- Key Vault URL via environment variable
- Managed Identity for production (no stored credentials)
- Service principal for development

## Acceptance Criteria

- [ ] Key Vault client initialized at startup
- [ ] All secrets retrieved from Key Vault in production
- [ ] Fallback to env vars in development
- [ ] Secrets cached with appropriate TTL
- [ ] Error handling for Key Vault unavailability
- [ ] Tests mock Key Vault client
