# Task 024: Setup Application Insights

**Task ID**: TASK-024
**Order**: 024
**Phase**: Phase 4 - DevOps & Monitoring
**Priority**: HIGH
**Estimated Effort**: 2-3 days
**Status**: NOT STARTED

## Description

Integrate Azure Application Insights for application performance monitoring (APM), distributed tracing, and error tracking.

## Dependencies

- Task 014 (Performance Monitoring - provides metrics infrastructure)

## Technical Requirements

### Backend

- Install applicationinsights SDK
- Auto-instrument Express requests
- Track custom events and metrics
- Distributed tracing for API calls
- Exception tracking with stack traces
- Dependency tracking (Azure OpenAI, database)

### Frontend

- Install @microsoft/applicationinsights-web
- Page view tracking
- Custom event tracking
- Error boundary integration
- Performance metric forwarding (from Task 014)

### Configuration

- Instrumentation key from Key Vault
- Sampling rate configuration
- Custom dimensions (environment, version)

## Acceptance Criteria

- [ ] Backend requests auto-tracked
- [ ] Frontend page views tracked
- [ ] Custom events and metrics visible in portal
- [ ] Exceptions tracked with context
- [ ] Sampling configured for cost control
- [ ] Tests verify telemetry calls (mocked)
