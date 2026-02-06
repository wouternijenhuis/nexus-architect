# Task 012: Refactor Frontend State Management

**Task ID**: TASK-012
**Order**: 012
**Phase**: Phase 2 - Architecture & Quality
**Priority**: MEDIUM
**Estimated Effort**: 3-4 days
**Status**: NOT STARTED

## Description

Refactor the Zustand store into domain-specific slices with proper TypeScript types, selectors, and actions. Improve state normalization and reduce component re-renders.

## Dependencies

- Phase 1 complete (Tasks 001-010)

## Technical Requirements

### Store Architecture

1. **Split monolithic store into domain slices**:
   - `stores/projectStore.ts` - Project CRUD operations
   - `stores/schemaStore.ts` - Schema CRUD and editing operations
   - `stores/authStore.ts` - Authentication state (already exists, keep)
   - `stores/collaborationStore.ts` - WebSocket/collaboration state (already exists, keep)
   - `stores/uiStore.ts` - UI state (modals, sidebar, theme)

2. **Implement selectors** for computed/derived state:
   - `useCurrentProject()` - Get project by current route params
   - `useCurrentSchema()` - Get schema by current route params
   - `useProjectSchemas(projectId)` - Get schemas for a project
   - `useSchemaStats(schemaId)` - Element/type counts

3. **State normalization**:
   - Store entities by ID for O(1) lookups
   - Use `Record<string, Project>` instead of `Project[]`
   - Memoize selectors with `useShallow` from zustand

4. **Type safety improvements**:
   - Strict action types with proper return types
   - Discriminated unions for loading/error/success states

### Migration Strategy

- Keep backward compatibility during migration
- Update all component imports
- Ensure all existing tests still pass

## Acceptance Criteria

- [ ] Store split into domain-specific files
- [ ] All existing 143 frontend tests pass
- [ ] Selectors for derived state created
- [ ] State normalized (entities by ID)
- [ ] New tests for store slices (≥85% coverage for stores/)
- [ ] No regressions in UI behavior

## Files to Create/Modify

- `frontend/src/stores/projectStore.ts` - New
- `frontend/src/stores/schemaStore.ts` - New
- `frontend/src/stores/uiStore.ts` - New
- `frontend/src/stores/index.ts` - Re-export barrel
- `frontend/src/lib/store.ts` - Deprecated, re-export from new stores
- All components using useStore - Update imports
