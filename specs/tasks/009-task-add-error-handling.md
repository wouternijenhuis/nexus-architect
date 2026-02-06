# Task 009: Add Comprehensive Error Handling

**Task ID**: TASK-009  
**Order**: 009  
**Phase**: Foundation - Quality & Reliability  
**Priority**: MEDIUM  
**Estimated Effort**: 3-4 days
**Status**: ✅ COMPLETE

## Description

Implement comprehensive error handling across frontend and backend to gracefully handle failures, provide meaningful error messages to users, and log errors for debugging. Currently minimal error handling exists, leading to silent failures and poor user experience.

## Dependencies

- Task 008: Input Validation (some overlap in validation error handling)

## Technical Requirements

### Error Handling Strategy

**Frontend**:

- Try-catch blocks around async operations
- Error boundaries for React component errors
- Global error handler for unhandled promise rejections
- User-friendly error messages
- Retry mechanisms for transient failures
- Error logging to console (dev) or service (prod)

**Backend**:

- Try-catch blocks around all route handlers
- Global error middleware
- Structured error responses
- Error logging with context
- Graceful degradation
- Health check endpoint

### Error Categories

**User Errors** (4xx):

- Invalid input (400)
- Not found (404)
- Conflict (409)
- Rate limit exceeded (429)

**System Errors** (5xx):

- Internal server error (500)
- Service unavailable (503)
- Gateway timeout (504)

**Client Errors**:

- Network failure
- Timeout
- Parse error
- State corruption

### Implementation Structure

**Frontend Error Boundary** (`frontend/src/components/ErrorBoundary.tsx`):

```typescript
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service in production
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error!} reset={this.handleReset} />;
    }

    return this.props.children;
  }
}
```

**Frontend Error Handler** (`frontend/src/lib/error-handler.ts`):

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    if (status === 404) {
      return new AppError('Resource not found', 'NOT_FOUND', 404);
    }
    
    if (status === 429) {
      return new AppError('Too many requests. Please try again later.', 'RATE_LIMIT', 429);
    }
    
    if (status && status >= 500) {
      return new AppError('Server error. Please try again later.', 'SERVER_ERROR', status);
    }
    
    return new AppError(message, 'API_ERROR', status);
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR');
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR');
}

export function showErrorToast(error: AppError | Error) {
  // Toast notification library integration
  const message = error instanceof AppError 
    ? error.message 
    : 'An unexpected error occurred';
  
  // Show toast
  console.error('Error:', message, error);
}
```

**Backend Error Middleware** (`backend/src/middleware/error-handler.ts`):

```typescript
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.context && { details: err.context }),
    });
  }

  // Unhandled errors
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### Specific Error Scenarios

**API Call Failures**:

```typescript
try {
  const response = await api.createProject(data);
  return response.data;
} catch (error) {
  const appError = handleApiError(error);
  showErrorToast(appError);
  throw appError;
}
```

**Storage Failures**:

```typescript
try {
  localStorage.setItem('projects', JSON.stringify(projects));
} catch (error) {
  if (error instanceof DOMException && error.code === 22) {
    showErrorToast(new AppError('Storage quota exceeded', 'QUOTA_EXCEEDED'));
  } else {
    showErrorToast(new AppError('Failed to save data', 'STORAGE_ERROR'));
  }
}
```

**XSD Parse Failures**:

```typescript
try {
  const schema = parseXSD(xsdContent);
  if (schema.errors.length > 0) {
    throw new AppError(
      'Invalid XSD structure',
      'PARSE_ERROR',
      400,
      { errors: schema.errors }
    );
  }
  return schema;
} catch (error) {
  handleApiError(error);
}
```

**WebSocket Failures**:

```typescript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  showErrorToast(new AppError('Connection error', 'WS_ERROR'));
});

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    showErrorToast(new AppError('Disconnected by server', 'WS_DISCONNECT'));
  }
});
```

### Error Messages

User-friendly messages for common errors:

```typescript
const ERROR_MESSAGES = {
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMIT: 'You are making too many requests. Please slow down.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  QUOTA_EXCEEDED: 'Storage limit exceeded. Please delete some data.',
  PARSE_ERROR: 'Failed to parse file. Please check the file format.',
  VALIDATION_ERROR: 'Invalid input. Please check your data.',
};
```

## Acceptance Criteria

- ✅ Error boundary wraps entire React application
- ✅ All async operations wrapped in try-catch
- ✅ Backend error middleware registered
- ✅ All route handlers use asyncHandler wrapper
- ✅ User-friendly error messages displayed
- ✅ Errors logged with context (method, path, timestamp)
- ✅ Health check endpoint returns 200 or 503
- ✅ 404 errors handled for unknown routes
- ✅ Network errors show offline indicator
- ✅ Retry mechanism for transient failures (optional)
- ✅ Tests pass with ≥85% coverage

## Testing Requirements

### Unit Tests

**Test File**: `frontend/src/components/ErrorBoundary.test.tsx`

```typescript
describe('ErrorBoundary', () => {
  it('should render children when no error', () => {})
  it('should render fallback when error occurs', () => {})
  it('should reset error state on reset', () => {})
  it('should log error to console', () => {})
})
```

**Test File**: `frontend/src/lib/error-handler.test.ts`

```typescript
describe('handleApiError', () => {
  it('should handle 404 errors', () => {})
  it('should handle 429 rate limit', () => {})
  it('should handle 500 server errors', () => {})
  it('should handle network errors', () => {})
  it('should handle unknown errors', () => {})
})
```

**Test File**: `backend/src/middleware/error-handler.test.ts`

```typescript
describe('Error Handler Middleware', () => {
  it('should return 500 for unhandled errors', () => {})
  it('should return custom status for AppError', () => {})
  it('should log error with context', () => {})
  it('should not expose stack trace in production', () => {})
})

describe('asyncHandler', () => {
  it('should catch async errors', () => {})
  it('should pass to next middleware', () => {})
})
```

### Integration Tests

**Test File**: `frontend/src/test/error-handling.integration.test.tsx`

```typescript
describe('Error Handling Integration', () => {
  it('should show toast for API errors', async () => {
    // Mock API to return 500
    // Call API
    // Verify toast appears with error message
  })

  it('should show error boundary for component errors', () => {
    // Render component that throws error
    // Verify error boundary renders
    // Click reset button
    // Verify component re-renders
  })
})
```

**Test File**: `backend/src/test/error-handling.integration.test.ts`

```typescript
describe('API Error Handling', () => {
  it('should return 404 for unknown route', async () => {
    const response = await request(app).get('/api/unknown');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('NOT_FOUND');
  })

  it('should return 500 for unhandled errors', async () => {
    // Trigger route that throws error
    // Verify 500 response
    // Verify error logged
  })

  it('should handle validation errors', async () => {
    // Send invalid data
    // Verify 400 response with details
  })
})
```

### E2E Tests

**Test File**: `tests/e2e/tests/error-handling.spec.ts`

```typescript
test('should handle API failures gracefully', async ({ page }) => {
  // Block API requests
  await page.route('**/api/**', route => route.abort());
  
  // Try to create project
  await page.goto('/');
  await page.click('button:has-text("New Project")');
  await page.fill('input[name="name"]', 'Test');
  await page.click('button:has-text("Create")');
  
  // Verify error message appears
  await expect(page.locator('.toast-error')).toBeVisible();
  await expect(page.locator('.toast-error')).toContainText('Network connection failed');
});

test('should handle component errors with error boundary', async ({ page }) => {
  // Navigate to page that will error
  // Verify error boundary renders
  // Verify error message and reset button
});
```

### Manual Testing

1. Simulate network failure (throttle to offline)
2. Test all API endpoints with 500 responses
3. Trigger component errors (modify code to throw)
4. Test storage quota exceeded (fill localStorage)
5. Test malformed API responses
6. Test timeout scenarios (slow 3G)
7. Monitor console for unhandled errors

## Related Documentation

- [specs/modernize/assessment/technical-debt.md](../modernize/assessment/technical-debt.md) - Section 3.3: Missing Error Handling
- [specs/modernize/strategy/roadmap.md](../modernize/strategy/roadmap.md) - Phase 2, Week 6

---

**Next Tasks**: 010 (Establish Testing Infrastructure)
