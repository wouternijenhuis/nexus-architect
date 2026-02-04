# Testing

Nexus Architect uses multiple testing strategies to ensure quality and reliability.

## Testing Stack

- **Vitest**: Unit and integration tests
- **Playwright**: End-to-end tests
- **k6**: Load and performance tests

## Unit Tests

### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run in watch mode (frontend)
cd frontend
npm run test

# Run with coverage
cd frontend
npm run test -- --coverage
```

### Writing Unit Tests

Location: `frontend/src/**/*.test.ts`

Example test:

```typescript
import { describe, it, expect } from 'vitest'
import { generateXSDString } from '../lib/xsd-utils'
import { XSDSchema } from '../types/xsd'

describe('XSD Utils', () => {
  it('should generate basic XSD string', () => {
    const schema: XSDSchema = {
      id: '1',
      name: 'test-schema',
      elements: [
        {
          id: '1',
          name: 'testElement',
          type: 'xs:string',
        },
      ],
      complexTypes: [],
      simpleTypes: [],
      imports: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const xsd = generateXSDString(schema)
    expect(xsd).toContain('xs:schema')
    expect(xsd).toContain('testElement')
  })
})
```

### What to Test

**Utilities**:
- XSD generation logic
- XML parsing
- Validation functions
- State transformations

**Components** (if adding tests):
- User interactions
- Conditional rendering
- Props validation
- Event handlers

**Store**:
- CRUD operations
- State updates
- Persistence logic

## End-to-End Tests

### Running E2E Tests

```bash
# Install Playwright browsers (first time)
cd tests/e2e
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in headed mode
cd tests/e2e
npm run test:headed

# Run with UI mode
cd tests/e2e
npm run test:ui
```

### Writing E2E Tests

Location: `tests/e2e/tests/*.spec.ts`

Example test:

```typescript
import { test, expect } from '@playwright/test'

test('should create a new project', async ({ page }) => {
  await page.goto('/')
  
  // Click new project button
  await page.getByRole('button', { name: /New Project/i }).click()
  
  // Fill in project details
  await page.getByPlaceholder(/My XSD Project/i).fill('Test Project')
  
  // Create project
  await page.getByRole('button', { name: /Create$/i }).click()
  
  // Verify project appears
  await expect(page.locator('text=Test Project')).toBeVisible()
})
```

### E2E Testing Best Practices

1. **Use Semantic Selectors**: Prefer `getByRole`, `getByText` over CSS selectors
2. **Test User Flows**: Complete workflows, not individual actions
3. **Handle Async**: Use Playwright's auto-waiting
4. **Clean State**: Each test should be independent
5. **Screenshot on Failure**: Automatic in Playwright

### E2E Test Coverage

Current tests cover:
- ✅ Home page display
- ✅ Project creation
- ✅ Schema creation
- ✅ Element addition
- ✅ XSD export

To add:
- Complex type creation
- Simple type restrictions
- XML validation
- AI generation
- Multi-user collaboration

## Load Tests

### Running Load Tests

Requires [k6](https://k6.io/) to be installed.

```bash
# Run load test
npm run test:load

# Run with custom URL
cd tests/load
k6 run --env BASE_URL=http://production.example.com load-test.js

# Run with custom stages
k6 run --stage 30s:10,1m:50,30s:0 load-test.js
```

### Load Test Configuration

File: `tests/load/load-test.js`

**Stages**:
```javascript
stages: [
  { duration: '30s', target: 10 },  // Ramp up
  { duration: '1m', target: 10 },   // Stay
  { duration: '30s', target: 20 },  // Ramp up more
  { duration: '1m', target: 20 },   // Stay
  { duration: '30s', target: 0 },   // Ramp down
]
```

**Thresholds**:
```javascript
thresholds: {
  http_req_duration: ['p(95)<500'],  // 95% under 500ms
  http_req_failed: ['rate<0.01'],    // <1% error rate
}
```

### What to Load Test

Current tests:
- ✅ API health endpoint
- ✅ WebSocket connection endpoint

To add:
- Schema CRUD operations
- Concurrent WebSocket updates
- AI generation under load
- Export/import operations

## Test Data

### Test Fixtures

Create reusable test data:

```typescript
// tests/fixtures/schemas.ts
export const mockSchema: XSDSchema = {
  id: 'test-1',
  name: 'test-schema',
  elements: [],
  complexTypes: [],
  simpleTypes: [],
  imports: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}
```

### Factories

Use factories for dynamic test data:

```typescript
// tests/factories/schema.ts
export function createMockSchema(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: 'test-schema',
    elements: [],
    complexTypes: [],
    simpleTypes: [],
    imports: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}
```

## Continuous Integration

### GitHub Actions

File: `.github/workflows/test.yml` (to be created)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm run install:all
      - run: npm run test:unit

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm run install:all
      - run: cd tests/e2e && npx playwright install
      - run: npm run test:e2e
```

## Code Coverage

### Generating Coverage

```bash
cd frontend
npm run test -- --coverage
```

### Coverage Goals

- **Utilities**: 80%+ coverage
- **Store**: 80%+ coverage
- **Components**: 60%+ coverage (nice to have)

### Viewing Coverage

Coverage report generated in:
- `frontend/coverage/index.html`

## Testing Checklist

Before submitting code:

- [ ] All unit tests pass
- [ ] New features have tests
- [ ] E2E tests pass locally
- [ ] No console errors
- [ ] Linter passes
- [ ] Code formatted

## Debugging Tests

### Vitest

```bash
# Debug in VS Code
# Add breakpoint, press F5

# Console logging
console.log('Debug:', value)
```

### Playwright

```bash
# Run in headed mode
npm run test:headed

# Run in UI mode (interactive)
npm run test:ui

# Debug mode
cd tests/e2e
npx playwright test --debug
```

### k6

```bash
# Verbose output
k6 run --verbose load-test.js

# HTTP debug
k6 run --http-debug load-test.js
```

## Best Practices

1. **Write Tests First**: TDD when possible
2. **Keep Tests Fast**: Unit tests should be < 100ms
3. **Isolate Tests**: No dependencies between tests
4. **Mock External Calls**: Don't hit real Azure AI in tests
5. **Test Edge Cases**: Not just happy paths
6. **Descriptive Names**: Test names should explain what they test
7. **Arrange-Act-Assert**: Structure tests clearly

## Next Steps

- Read [Contributing Guide](contributing.md)
- Learn about [Architecture](architecture.md)
