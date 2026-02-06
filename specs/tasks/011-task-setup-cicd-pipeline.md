# Task 011: Setup CI/CD Pipeline

**Task ID**: TASK-011
**Order**: 011
**Phase**: Phase 2 - Architecture & Quality
**Priority**: HIGH
**Estimated Effort**: 2-3 days
**Status**: NOT STARTED

## Description

Create GitHub Actions CI/CD pipeline for automated testing, linting, building, and coverage reporting on every PR and push to main.

## Dependencies

- Phase 1 complete (Tasks 001-010)

## Technical Requirements

### CI Pipeline (.github/workflows/ci.yml)

1. **Triggers**: Push to main, PRs to main
2. **Jobs**:
   - **lint**: Run ESLint on frontend and backend
   - **test-frontend**: Run Vitest with coverage, fail if below 40%
   - **test-backend**: Run Vitest with coverage, fail if below 40%
   - **build**: Build frontend (vite build) and backend (tsc)
   - **e2e** (optional): Run Playwright e2e tests
3. **Node version**: 20.x
4. **Caching**: Cache node_modules via actions/cache
5. **Coverage**: Upload coverage reports as artifacts
6. **Status badges**: Add CI badge to README.md

### Quality Gates

- All lint checks pass
- All unit tests pass
- Coverage thresholds met (40% min, will increase to 70% in Task 015)
- Build succeeds without errors

## Acceptance Criteria

- [ ] CI workflow runs on push to main and PRs
- [ ] All jobs pass on current codebase
- [ ] Coverage reports uploaded as artifacts
- [ ] Failed tests block PR merging
- [ ] README.md has CI status badge

## Files to Create/Modify

- `.github/workflows/ci.yml` - Main CI workflow
- `README.md` - Add CI badge
