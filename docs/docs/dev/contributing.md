# Contributing

Thank you for your interest in contributing to Nexus Architect! This guide will help you get started.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/nexus-architect.git`
3. Create a branch: `git checkout -b feature/my-feature`
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

See the [Installation Guide](../getting-started/installation.md) for detailed setup instructions.

Quick start:
```bash
npm run install:all
npm run dev
```

## Project Structure

```
nexus-architect/
├── frontend/           # React frontend
├── backend/            # Express backend
├── tests/              # Test suites
│   ├── e2e/            # Playwright tests
│   └── load/           # k6 tests
└── docs/               # MkDocs documentation
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types
- Use interfaces for objects
- Use type inference when clear

### Formatting

Run Prettier before committing:
```bash
npm run format
```

### Linting

Fix linting issues:
```bash
npm run lint
```

### Naming Conventions

- **Files**: kebab-case (`my-component.tsx`)
- **Components**: PascalCase (`MyComponent`)
- **Functions**: camelCase (`handleClick`)
- **Types**: PascalCase (`XSDSchema`)
- **Constants**: UPPER_CASE (`MAX_LENGTH`)

## Making Changes

### 1. Frontend Changes

**Adding a Component**:
```bash
# Create component file
frontend/src/components/MyComponent.tsx

# Add styles if needed
# Use Tailwind classes

# Export from index
# frontend/src/components/index.ts
```

**Adding a Feature**:
```bash
# Create feature directory
frontend/src/features/my-feature/

# Add page component
frontend/src/features/my-feature/MyFeaturePage.tsx

# Update router
frontend/src/App.tsx
```

### 2. Backend Changes

**Adding an Endpoint**:
```typescript
// backend/src/routes/my-route.ts
import { Router } from 'express'

const router = Router()

router.get('/my-endpoint', (req, res) => {
  res.json({ data: 'response' })
})

export default router
```

**Adding a WebSocket Event**:
```typescript
// backend/src/index.ts
socket.on('my-event', (data) => {
  // Handle event
  socket.emit('my-response', result)
})
```

### 3. Documentation Changes

```bash
# Edit markdown files
docs/docs/**/*.md

# Preview locally
npm run docs:serve

# Build docs
npm run docs:build
```

## Testing Your Changes

### Unit Tests

Add tests for new utilities:
```bash
# Create test file
frontend/src/lib/my-util.test.ts

# Run tests
cd frontend
npm run test
```

### E2E Tests

Add tests for new features:
```bash
# Create test file
tests/e2e/tests/my-feature.spec.ts

# Run tests
npm run test:e2e
```

### Manual Testing

1. Test in development: `npm run dev`
2. Test the build: `npm run build && npm start`
3. Test in multiple browsers
4. Test on mobile if UI change

## Commit Guidelines

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Examples**:
```
feat(schema): add simple type restrictions

fix(validation): handle empty XML input

docs(guide): update installation steps

test(xsd): add complex type tests
```

### Branch Naming

- `feature/my-feature`
- `fix/bug-description`
- `docs/update-readme`
- `refactor/component-cleanup`

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New features have tests
- [ ] Documentation updated
- [ ] No console warnings
- [ ] Commit messages are clear

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots
If UI change, add screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
```

### Review Process

1. Submit PR with clear description
2. Wait for automated checks
3. Address reviewer feedback
4. Get approval from maintainer
5. PR will be merged

## Areas for Contribution

### High Priority

- [ ] Improve XSD validation
- [ ] Add more complex type features
- [ ] Enhance AI generation
- [ ] Add more E2E tests
- [ ] Improve mobile responsiveness

### Good First Issues

- [ ] Add loading states
- [ ] Improve error messages
- [ ] Add more XSD examples
- [ ] Enhance documentation
- [ ] Fix UI/UX issues

### Advanced Features

- [ ] Backend persistence (database)
- [ ] User authentication
- [ ] Version control for schemas
- [ ] Schema diff viewer
- [ ] Import from XSD file

## Getting Help

- Open an issue for bugs
- Start a discussion for questions
- Join our community chat (if available)
- Read the documentation

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Nexus Architect! 🎉
