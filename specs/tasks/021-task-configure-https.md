# Task 021: Configure HTTPS & Security Headers

**Task ID**: TASK-021
**Order**: 021
**Phase**: Phase 3 - Production Readiness
**Priority**: HIGH
**Estimated Effort**: 2-3 days
**Status**: NOT STARTED

## Description

Enforce HTTPS for all communications. Configure TLS certificates, HTTP-to-HTTPS redirection, and security headers.

## Dependencies

- Task 011 (CI/CD Pipeline)

## Technical Requirements

### Backend
- Install helmet for security headers
- HTTPS redirect middleware
- HSTS header configuration
- Configure CSP (Content Security Policy)
- Secure cookie flags (if using cookies)

### Security Headers
- Strict-Transport-Security
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

### Infrastructure
- TLS certificate management (Azure App Service managed certs or Let's Encrypt)
- Custom domain configuration
- Force HTTPS in production

## Acceptance Criteria

- [ ] Helmet middleware configured
- [ ] All security headers present
- [ ] HTTP redirects to HTTPS in production
- [ ] HSTS configured with appropriate max-age
- [ ] CSP policy allows required resources
- [ ] Tests verify security headers
