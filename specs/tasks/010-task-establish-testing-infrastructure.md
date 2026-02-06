# Task 010: Establish Testing Infrastructure & Achieve 40% Coverage

**Task ID**: TASK-010  
**Order**: 010  
**Phase**: Phase 1 - Testing Foundation  
**Priority**: HIGH  
**Estimated Effort**: 5-7 days  
**Status**: ✅ COMPLETE

## Description

Establish comprehensive testing infrastructure with proper configuration, utilities, and initial test suites to achieve minimum 40% code coverage across frontend and backend. Currently test coverage is ~10%, with only basic unit tests for xsd-utils.

## Dependencies

- Tasks 001-009 (tests for implemented features)

## Technical Requirements

### Coverage Goals

**Phase 1 Target**: 40% minimum coverage

- Frontend: 40% minimum (up from ~5%)
- Backend: 40% minimum (up from ~15%)

**Future Targets**:

- Phase 2: 70% coverage
- Phase 3: 85% coverage (production-ready)

### Testing Infrastructure Components

**1. Test Configuration**

**Frontend** (`frontend/vitest.config.ts`):

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types/',
      ],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 40,
        statements: 40,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Backend** (`backend/vitest.config.ts` or `jest.config.js`):

```typescript
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/test/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 40,
      functions: 40,
      branches: 40,
      statements: 40,
    },
  },
};
```

**2. Test Utilities**

**Frontend Test Utils** (`frontend/src/test/utils.tsx`):

```typescript
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Mock providers wrapper
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Test data factories
export const createTestProject = (overrides = {}) => ({
  id: 'test-project-1',
  name: 'Test Project',
  schemas: [],
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createTestSchema = (overrides = {}) => ({
  id: 'test-schema-1',
  name: 'Test Schema',
  elements: [],
  createdAt: new Date().toISOString(),
  ...overrides,
});
```

**Backend Test Utils** (`backend/src/test/utils.ts`):

```typescript
import request from 'supertest';
import { Express } from 'express';

export function createTestApp(): Express {
  // Create test app instance
  return app;
}

export const mockProjects = [
  { id: '1', name: 'Project 1', schemas: [] },
  { id: '2', name: 'Project 2', schemas: [] },
];

export const mockSchemas = [
  { id: '1', name: 'Schema 1', elements: [] },
];
```

**3. Mocking**

**API Mocking** (Frontend):

```typescript
// frontend/src/test/mocks/api.ts
export const mockApiSuccess = (data: any) => {
  return jest.fn(() => Promise.resolve({ data }));
};

export const mockApiError = (error: any) => {
  return jest.fn(() => Promise.reject(error));
};
```

**WebSocket Mocking**:

```typescript
// frontend/src/test/mocks/websocket.ts
export class MockWebSocket {
  on = jest.fn();
  emit = jest.fn();
  connect = jest.fn();
  disconnect = jest.fn();
}
```

**4. CI/CD Integration**

**GitHub Actions** (`.github/workflows/test.yml`):

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run backend tests
        run: cd backend && npm test -- --coverage

      - name: Run frontend tests
        run: cd frontend && npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info,./frontend/coverage/lcov.info
          fail_ci_if_error: true
```

### Test Suites to Create

**Frontend (Priority Order)**:

1. ✅ **xsd-utils.test.ts** (exists) - expand coverage
2. **store.test.ts** - Zustand store state management
3. **HomePage.test.tsx** - Project list, create/delete
4. **ProjectPage.test.tsx** - Project detail, schema list
5. **SchemaEditor.test.tsx** - Schema editing, element management
6. **Header.test.tsx** - Navigation, UI components
7. **ConfirmDialog.test.tsx** - Confirmation dialogs
8. **validation.test.ts** - Input validation rules
9. **error-handler.test.ts** - Error handling logic
10. **websocket.test.ts** - WebSocket service

**Backend (Priority Order)**:

1. **projects.routes.test.ts** - Project CRUD endpoints
2. **schemas.routes.test.ts** - Schema CRUD endpoints
3. **ai-service.test.ts** - AI generation logic
4. **rate-limit.test.ts** - Rate limiting middleware
5. **validation.test.ts** - Validation middleware
6. **error-handler.test.ts** - Error middleware
7. **websocket.test.ts** - Socket.IO event handlers

**E2E Tests**:

1. **basic.spec.ts** (exists) - expand to cover main flows
2. **project-management.spec.ts** - Full project lifecycle
3. **schema-editing.spec.ts** - Create, edit, export schema
4. **collaboration.spec.ts** - Real-time collaboration
5. **error-handling.spec.ts** - Error scenarios

## Acceptance Criteria

- ✅ Vitest configured in frontend with coverage thresholds
- ✅ Jest/Vitest configured in backend with coverage thresholds
- ✅ Test utilities created for both frontend and backend
- ✅ Mocking utilities for API, WebSocket, localStorage
- ✅ Test data factories for common entities
- ✅ CI/CD pipeline runs tests on every PR
- ✅ Coverage reports generated and uploaded
- ✅ Frontend coverage ≥ 40%
- ✅ Backend coverage ≥ 40%
- ✅ E2E tests pass in CI
- ✅ All existing tests pass
- ✅ Documentation for writing tests

## Testing Requirements

### Coverage Tracking

```bash
# Frontend coverage
cd frontend && npm test -- --coverage

# Backend coverage
cd backend && npm test -- --coverage

# Combined report
npm run test:coverage
```

### Coverage Reports

- HTML reports for local development
- LCOV format for CI integration
- Text summary in console
- JSON format for programmatic access

### Continuous Monitoring

- Coverage tracked in CI/CD
- PRs blocked if coverage drops below threshold
- Coverage badge in README
- Codecov dashboard for trends

## Related Documentation

- [specs/modernize/MODERNIZATION_SUMMARY.md](../modernize/MODERNIZATION_SUMMARY.md) - Critical Finding #4: Minimal Test Coverage
- [specs/modernize/assessment/technical-debt.md](../modernize/assessment/technical-debt.md) - Section 5: Testing
- [specs/modernize/strategy/roadmap.md](../modernize/strategy/roadmap.md) - Phase 1, Weeks 3-4

---

**Next Tasks**: 011 (Setup CI/CD Pipeline), 012 (Implement Azure AD Authentication - Phase 3)
