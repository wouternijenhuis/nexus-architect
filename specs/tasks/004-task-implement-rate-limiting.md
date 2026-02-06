# Task 004: Implement Rate Limiting

**Task ID**: TASK-004  
**Order**: 004  
**Phase**: Foundation - Security  
**Priority**: CRITICAL  
**Estimated Effort**: 1-2 days
**Status**: ✅ COMPLETE

## Description

Implement rate limiting across all API endpoints and WebSocket connections to prevent abuse, DoS attacks, and resource exhaustion. Use express-rate-limit for HTTP endpoints and custom logic for WebSocket connections.

## Dependencies

- None (can run in parallel with Tasks 001-003)

## Technical Requirements

### Rate Limiting Strategy

**Tier 1 - General API Endpoints** (most permissive):

- Limit: 100 requests per 15 minutes per IP
- Applies to: GET endpoints, health checks
- Response on limit: HTTP 429 with Retry-After header

**Tier 2 - Resource Modification Endpoints** (moderate):

- Limit: 50 requests per 15 minutes per IP
- Applies to: POST, PUT, DELETE endpoints
- Response on limit: HTTP 429 with Retry-After header

**Tier 3 - AI Generation Endpoints** (most restrictive):

- Limit: 10 requests per hour per IP
- Applies to: `/api/ai/generate`
- Response on limit: HTTP 429 with custom message about AI quotas

**Tier 4 - WebSocket Connections**:

- Limit: 5 concurrent connections per IP
- Room join limit: 10 rooms per connection
- Message rate: 30 messages per minute per connection
- Response on limit: Socket disconnect with reason code

### Implementation Requirements

**Backend Package**:

```json
{
  "dependencies": {
    "express-rate-limit": "^7.1.5"
  }
}
```

**Middleware Structure**:

```
backend/src/middleware/
  rate-limit.ts          # Rate limiting configuration
  websocket-rate-limit.ts # WebSocket rate limiting logic
```

**Configuration**:

```typescript
// Configurable via environment variables
RATE_LIMIT_WINDOW_MS=900000  // 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AI_MAX=10
RATE_LIMIT_AI_WINDOW_MS=3600000  // 1 hour
RATE_LIMIT_WS_MAX_CONNECTIONS=5
```

**Error Responses**:

```json
{
  "error": "Too Many Requests",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": 123,
  "limit": 100,
  "window": "15 minutes"
}
```

### Endpoints to Protect

**General Rate Limit (Tier 1)**:

- `GET /api/health`
- `GET /api/projects`
- `GET /api/projects/:id`
- `GET /api/schemas/:id`

**Resource Modification Rate Limit (Tier 2)**:

- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/schemas`
- `PUT /api/schemas/:id`
- `DELETE /api/schemas/:id`
- `POST /api/projects/:id/export`
- `POST /api/projects/import`

**AI Rate Limit (Tier 3)**:

- `POST /api/ai/generate`

**WebSocket Rate Limit (Tier 4)**:

- Connection limit per IP
- Room join rate limit
- Message broadcast rate limit

### Monitoring & Logging

- Log rate limit violations with IP, endpoint, and timestamp
- Track rate limit metrics (requests/minute, violations/hour)
- Alert on suspicious patterns (same IP hitting limits repeatedly)

## Acceptance Criteria

- ✅ express-rate-limit package installed in backend
- ✅ Rate limit middleware created with 4 tiers
- ✅ All HTTP endpoints protected with appropriate tier
- ✅ WebSocket connections have connection and message rate limits
- ✅ Rate limit exceeded returns HTTP 429 with proper headers
- ✅ Rate limit configuration via environment variables
- ✅ Rate limit violations logged with details
- ✅ Documentation updated with rate limit policies
- ✅ Tests pass with ≥85% coverage

## Testing Requirements

### Unit Tests

**Test File**: `backend/src/middleware/rate-limit.test.ts`

```typescript
describe('Rate Limit Middleware', () => {
  describe('General API Rate Limit', () => {
    it('should allow requests under limit', () => {})
    it('should block requests over limit', () => {})
    it('should return 429 with Retry-After header', () => {})
    it('should reset counter after window expires', () => {})
  })

  describe('AI Generation Rate Limit', () => {
    it('should enforce 10 requests per hour limit', () => {})
    it('should return custom AI quota message', () => {})
  })

  describe('Configuration', () => {
    it('should load limits from environment variables', () => {})
    it('should use defaults if env vars not set', () => {})
  })
})
```

**Test File**: `backend/src/middleware/websocket-rate-limit.test.ts`

```typescript
describe('WebSocket Rate Limit', () => {
  it('should allow up to 5 connections per IP', () => {})
  it('should reject 6th connection from same IP', () => {})
  it('should allow connection after disconnect', () => {})
  it('should limit room joins to 10 per connection', () => {})
  it('should rate limit messages to 30/minute', () => {})
})
```

### Integration Tests

**Test File**: `backend/src/test/rate-limit.integration.test.ts`

1. **General API Rate Limit**:
   - Make 100 GET requests to `/api/projects`
   - Verify all succeed (HTTP 200)
   - Make 101st request
   - Verify rate limit error (HTTP 429)
   - Wait for window to expire
   - Verify requests allowed again

2. **AI Rate Limit**:
   - Make 10 POST requests to `/api/ai/generate`
   - Verify all succeed
   - Make 11th request
   - Verify rate limit error with custom message
   - Verify Retry-After header present

3. **Different IPs**:
   - Make 100 requests from IP 1
   - Make 100 requests from IP 2 (different)
   - Verify both succeed (rate limits per-IP)

4. **WebSocket Rate Limit**:
   - Open 5 WebSocket connections from same IP
   - Verify all connected
   - Attempt 6th connection
   - Verify rejection
   - Close 1 connection
   - Attempt new connection
   - Verify allowed

### Manual Testing

1. Use tool like Apache Bench or Artillery to simulate load:

```bash
# Test general API rate limit
ab -n 150 -c 1 http://localhost:3000/api/projects

# Verify ~100 succeed, ~50 return 429
```

2. Monitor logs for rate limit violations
3. Verify application remains responsive under load
4. Verify legitimate users not impacted

### Load Testing

**Test File**: `tests/load/rate-limit-test.js`

- Simulate 10 concurrent users
- Each makes requests at different rates
- Verify rate limits enforced correctly
- Verify no false positives (legitimate use not blocked)

## Related Documentation

- [specs/modernize/assessment/security-audit.md](../modernize/assessment/security-audit.md) - Section 2.2: Rate Limiting
- [specs/modernize/assessment/technical-debt.md](../modernize/assessment/technical-debt.md) - Section 3.1: Missing Rate Limiting
- [specs/modernize/strategy/roadmap.md](../modernize/strategy/roadmap.md) - Phase 1, Week 1

---

**Next Tasks**: 005 (Remediate HIGH vulnerabilities), 006 (Add Delete Confirmation)
