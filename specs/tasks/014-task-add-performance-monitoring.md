# Task 014: Add Performance Monitoring

**Task ID**: TASK-014
**Order**: 014
**Phase**: Phase 2 - Architecture & Quality
**Priority**: MEDIUM
**Estimated Effort**: 2-3 days
**Status**: NOT STARTED

## Description

Add client-side and server-side performance monitoring to track API response times, WebSocket latency, frontend render performance, and resource usage.

## Dependencies

- Phase 1 complete (Tasks 001-010)

## Technical Requirements

### Backend Monitoring

1. **Request logging middleware**:
   - Log request method, path, status code, response time
   - Structured JSON logging format
   - Configurable log levels (debug/info/warn/error)

2. **Metrics collection**:
   - API response time histograms
   - Request count by endpoint
   - Active WebSocket connections
   - Memory usage snapshots

3. **Health endpoint enhancement**:
   - Add `/api/health/detailed` with system metrics
   - Uptime, memory usage, active connections
   - Version info

### Frontend Monitoring

1. **Performance observer**:
   - Track page load times (LCP, FID, CLS)
   - Track component render durations
   - WebSocket reconnection count

2. **Error tracking**:
   - Integration with ErrorBoundary
   - Uncaught error reporting
   - Console error aggregation

### Implementation

- Use lightweight custom implementation (no heavy APM libraries yet)
- Prepare hooks for Azure Application Insights (Phase 4, Task 024)
- Store metrics in memory with configurable flush interval

## Acceptance Criteria

- [ ] Request logging middleware with response times
- [ ] Health endpoint returns system metrics
- [ ] Frontend performance observer tracks web vitals
- [ ] Structured JSON logging format
- [ ] Tests for monitoring utilities

## Files to Create/Modify

- `backend/src/middleware/request-logger.ts` - New
- `backend/src/services/metrics-service.ts` - New
- `backend/src/routes/health.ts` - New or enhanced
- `frontend/src/lib/performance.ts` - New
- `frontend/src/lib/logger.ts` - New
