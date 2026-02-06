# Task 015: Achieve 70% Test Coverage

**Task ID**: TASK-015
**Order**: 015
**Phase**: Phase 2 - Architecture & Quality
**Priority**: HIGH
**Estimated Effort**: 7-10 days
**Status**: ✅ COMPLETE

## Description

Write comprehensive unit and integration tests to achieve ≥70% code coverage across both frontend and backend. Focus on testing all business logic, edge cases, and error paths.

## Dependencies

- Task 010 (Testing Infrastructure at 40%)
- Task 012 (Refactored stores - if done, test new structure)
- Task 013 (Service layer - if done, test services)

## Technical Requirements

### Frontend Coverage Targets

| Area | Current | Target | Priority |
|------|---------|--------|----------|
| src/lib/store.ts | ~49% | 85% | HIGH |
| src/lib/xsd-utils.ts | ~9% | 70% | HIGH |
| src/lib/websocket.ts | ~74% | 85% | MEDIUM |
| src/features/schema/SchemaEditor.tsx | 0% | 50% | HIGH |
| src/components/ActiveUsers.tsx | ~7% | 80% | MEDIUM |
| src/components/ConnectionStatus.tsx | 0% | 80% | MEDIUM |
| src/lib/azure-ai.ts | ~9% | 50% | LOW |

### Backend Coverage Targets

| Area | Current | Target | Priority |
|------|---------|--------|----------|
| src/index.ts | 0% | 60% | HIGH |
| src/services/ai-service.ts | ~48% | 80% | MEDIUM |
| src/middleware/* | ~98% | 98% | MAINTAIN |

### Test Strategy

1. **Unit tests**: All pure functions, store actions, utilities
2. **Component tests**: React components with mocked dependencies
3. **Integration tests**: API routes with supertest
4. **Edge case tests**: Error paths, boundary conditions, null/undefined handling

### Coverage Enforcement

- Update vitest.config coverage thresholds to 70%
- Add coverage check to CI pipeline (if Task 011 done)

## Acceptance Criteria

- [ ] Frontend overall coverage ≥70% statements
- [ ] Backend overall coverage ≥70% statements
- [ ] All new tests pass
- [ ] No reduction in existing test coverage
- [ ] Coverage thresholds enforced in config

## Files to Create/Modify

- Multiple test files across frontend and backend
- `frontend/vite.config.ts` - Update coverage thresholds
- `backend/vitest.config.ts` - Update coverage thresholds
