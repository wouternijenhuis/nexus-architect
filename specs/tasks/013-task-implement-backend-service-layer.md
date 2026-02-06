# Task 013: Implement Backend Service Layer

**Task ID**: TASK-013
**Order**: 013
**Phase**: Phase 2 - Architecture & Quality
**Priority**: MEDIUM
**Estimated Effort**: 4-5 days
**Status**: NOT STARTED

## Description

Extract business logic from Express route handlers into a proper service layer with clear separation of concerns. Create repository pattern for future database migration.

## Dependencies

- Phase 1 complete (Tasks 001-010)

## Technical Requirements

### Service Layer Architecture

1. **Services**:
   - `services/project-service.ts` - Project management logic
   - `services/schema-service.ts` - Schema CRUD and validation
   - `services/ai-service.ts` - Already exists, refactor for consistency
   - `services/collaboration-service.ts` - WebSocket room management, presence

2. **Repository Pattern** (for future database):
   - `repositories/base-repository.ts` - Base interface
   - `repositories/project-repository.ts` - Project data access (in-memory for now)
   - `repositories/schema-repository.ts` - Schema data access

3. **Route Refactoring**:
   - `routes/api.ts` - API route definitions
   - `routes/health.ts` - Health check endpoints
   - Move from monolithic index.ts to modular route files

4. **Error handling**:
   - Service-level error types
   - Consistent error responses
   - Request/response DTOs

5. **WebSocket refactoring**:
   - `websocket/handlers.ts` - Socket event handlers
   - `websocket/rooms.ts` - Room management logic
   - Extract from index.ts into dedicated modules

### Testing

- Unit tests for all services
- Integration tests for routes
- Mock repository layer in service tests

## Acceptance Criteria

- [ ] Business logic extracted from index.ts to services
- [ ] Route handlers are thin (delegate to services)
- [ ] Repository interfaces defined
- [ ] WebSocket handlers extracted
- [ ] All 49 backend tests still pass
- [ ] New service tests achieve ≥85% coverage
- [ ] index.ts is < 50 lines

## Files to Create/Modify

- `backend/src/services/project-service.ts` - New
- `backend/src/services/schema-service.ts` - New
- `backend/src/services/collaboration-service.ts` - New
- `backend/src/repositories/base-repository.ts` - New
- `backend/src/repositories/project-repository.ts` - New
- `backend/src/routes/api.ts` - New
- `backend/src/routes/health.ts` - New
- `backend/src/websocket/handlers.ts` - New
- `backend/src/websocket/rooms.ts` - New
- `backend/src/index.ts` - Refactor to minimal entry point
