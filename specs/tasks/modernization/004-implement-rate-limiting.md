# Task 004: Implement Rate Limiting

**Task ID**: TASK-004  
**Priority**: CRITICAL  
**Phase**: Phase 1 - Foundation  
**Estimated Effort**: 1-2 days  
**Complexity**: Low-Medium  
**Status**: Ready for Implementation

## Description

Implement comprehensive rate limiting across all API endpoints and WebSocket connections to prevent abuse, protect against DoS attacks, and control Azure OpenAI costs. This is a **critical security control** that prevents unlimited API calls and protects the application from cost abuse on the AI generation endpoint.

## Dependencies

- **Depends on**: None (can be implemented independently)
- **Blocks**: Public deployment (unsafe to deploy without rate limiting)

## Current State (From Reverse Engineering Analysis)

**Files Affected**:
- [backend/src/index.ts](../../backend/src/index.ts) - Express server and Socket.IO setup

**Current Implementation**:
- ❌ No rate limiting on any endpoint
- ❌ No request throttling
- ❌ No connection limits on WebSocket
- ❌ No protection against abuse

**API Endpoints**: [specs/docs/integration/apis.md](../docs/integration/apis.md)
- `GET /api/health` - Unprotected health check
- `POST /api/generate-xml` - **CRITICAL**: Unprotected AI endpoint (costs $0.03-$0.10 per request)
- WebSocket `/` - Unprotected real-time collaboration

**Issues Identified**:
- **Cost Risk**: Attacker can spam AI endpoint → unlimited Azure OpenAI costs
  - Example: 10,000 malicious requests = $300-$1,000 in costs
- **DoS Risk**: Attacker opens thousands of WebSocket connections → server crashes
- **Resource Exhaustion**: Rapid requests exhaust CPU/memory

## Target State (After Modernization)

**Expected Outcome**:
- All API endpoints protected with rate limiting
- AI endpoint strictly rate-limited (10 requests/hour per IP)
- General endpoints moderately rate-limited (100 requests/15min per IP)
- WebSocket connections limited (5 per IP)
- User-friendly error messages when limits exceeded
- Rate limit headers in responses for API transparency

**Technical Improvements**:
- Cost abuse prevention (Azure OpenAI costs controlled)
- DoS attack mitigation
- Fair resource allocation across users
- Monitoring data for usage patterns

**Benefits**:
- **Cost Savings**: Prevents runaway Azure OpenAI costs
- **Availability**: Prevents resource exhaustion
- **Fair Usage**: Ensures all users get reasonable access
- **Security**: Blocks automated attacks and scrapers

## Technical Requirements

**Dependencies to Add**:
```json
{
  "express-rate-limit": "^7.1.5"
}
```

**Rate Limit Configuration**:

1. **General API Rate Limiting**:
   - Window: 15 minutes
   - Max requests: 100 per IP
   - Applies to: All `/api/*` routes

2. **AI Endpoint Rate Limiting** (STRICT):
   - Window: 1 hour
   - Max requests: 10 per IP
   - Applies to: `POST /api/generate-xml`
   - Cost protection: Prevents >$1/hour per IP

3. **WebSocket Connection Limiting**:
   - Max connections: 5 per IP
   - Prevents connection pool exhaustion

**Rate Limit Headers** (standard headers):
- `X-RateLimit-Limit`: Total requests allowed in window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Timestamp when limit resets (Unix epoch)
- `Retry-After`: Seconds until next request allowed (when limit exceeded)

**Error Responses**:
- Status Code: `429 Too Many Requests`
- Body: `{ "error": "Too many requests, please try again later." }`

## Implementation Approach

**Strategy**: Apply layered rate limiting with express-rate-limit middleware

### Step 1: Install Dependency (10 minutes)

```bash
cd /Users/ibeast/Documents/repos/nexus-architect/backend
npm install express-rate-limit
```

### Step 2: Create Rate Limiter Configuration (30 minutes)

Create new file: `backend/src/middleware/rateLimiting.ts`

```typescript
import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * Protects all API routes from excessive requests
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Trust proxy if behind reverse proxy (Azure App Service)
  skip: (req) => req.path === '/api/health', // Don't rate limit health checks
});

/**
 * Strict rate limiter for AI generation endpoint
 * Prevents cost abuse on Azure OpenAI API
 */
export const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 AI generations per hour per IP
  message: {
    error: 'AI generation limit reached. Please try again later.',
    retryAfter: '1 hour',
    costProtection: 'This limit prevents excessive Azure OpenAI costs.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Log when limit is hit for monitoring
  handler: (req, res) => {
    console.warn(`AI rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'AI generation limit reached. Please try again later.',
      retryAfter: '1 hour',
      limit: 10,
      window: '1 hour'
    });
  },
});

/**
 * Rate limiter for health check endpoint
 * More permissive since it's used for monitoring
 */
export const healthCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Max 30 health checks per minute (for monitoring tools)
  message: {
    error: 'Too many health check requests'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Step 3: Apply Rate Limiters to Express Routes (15 minutes)

Update `backend/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { generateXMLFromDescription } from './services/ai-service.js';
import { generalLimiter, aiGenerationLimiter, healthCheckLimiter } from './middleware/rateLimiting.js';

const app = express();
const server = createServer(app);

// ... existing CORS and Socket.IO setup ...

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// Health check endpoint with specific limiter
app.get('/api/health', healthCheckLimiter, (req, res) => {
  res.json({ status: 'ok' });
});

// AI generation endpoint with strict rate limiting
app.post('/api/generate-xml', aiGenerationLimiter, async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const xml = await generateXMLFromDescription(description);
    res.json({ xml });
  } catch (error) {
    console.error('Error generating XML:', error);
    res.status(500).json({ error: 'Failed to generate XML' });
  }
});

// ... existing Socket.IO setup ...
```

### Step 4: Implement WebSocket Connection Limiting (45 minutes)

Add connection tracking to Socket.IO in `backend/src/index.ts`:

```typescript
// Track connections per IP address
const connectionsByIP = new Map<string, number>();
const MAX_CONNECTIONS_PER_IP = 5;

io.use((socket, next) => {
  const clientIP = socket.handshake.address;
  const currentConnections = connectionsByIP.get(clientIP) || 0;
  
  if (currentConnections >= MAX_CONNECTIONS_PER_IP) {
    console.warn(`WebSocket connection limit exceeded for IP: ${clientIP}`);
    return next(new Error('Connection limit exceeded. Maximum 5 connections per IP address.'));
  }
  
  // Increment connection count
  connectionsByIP.set(clientIP, currentConnections + 1);
  
  // Decrement on disconnect
  socket.on('disconnect', () => {
    const count = connectionsByIP.get(clientIP) || 0;
    if (count > 0) {
      connectionsByIP.set(clientIP, count - 1);
    }
  });
  
  next();
});

// Clean up stale connections every 5 minutes
setInterval(() => {
  connectionsByIP.forEach((count, ip) => {
    if (count === 0) {
      connectionsByIP.delete(ip);
    }
  });
}, 5 * 60 * 1000);
```

### Step 5: Add Configuration for Proxy Trust (15 minutes)

When deployed behind Azure App Service or other reverse proxy, Express needs to trust proxy headers for accurate IP detection:

Update `backend/src/index.ts`:

```typescript
// Trust first proxy (Azure App Service)
app.set('trust proxy', 1);
```

### Step 6: Update Frontend to Handle 429 Responses (30 minutes)

Update `frontend/src/lib/azure-ai.ts` to handle rate limiting:

```typescript
export async function generateXMLFromDescription(description: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:3000/api/generate-xml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    if (response.status === 429) {
      // Rate limit exceeded
      const data = await response.json();
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(
        `Rate limit exceeded. ${data.error || 'Please try again later.'}\n` +
        `Try again in: ${data.retryAfter || retryAfter || 'a few minutes'}`
      );
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate XML');
    }

    const data = await response.json();
    return data.xml;
  } catch (error) {
    console.error('Error generating XML:', error);
    throw error;
  }
}
```

### Step 7: Add User-Friendly Error Messages in UI (30 minutes)

Update schema editor or relevant UI components to display rate limit errors clearly to users.

## Acceptance Criteria

### Installation & Configuration
- ✅ express-rate-limit installed in backend/package.json
- ✅ Rate limiting middleware created in `backend/src/middleware/rateLimiting.ts`
- ✅ TypeScript types properly configured (no compilation errors)

### Rate Limiting Implementation
- ✅ General API limiter applied to all `/api/*` routes (100 req/15min)
- ✅ AI endpoint limiter applied to `POST /api/generate-xml` (10 req/hour)
- ✅ Health check limiter applied to `GET /api/health` (30 req/min)
- ✅ WebSocket connection limiter implemented (5 connections/IP)

### Headers & Responses
- ✅ Rate limit headers present in responses:
  - `RateLimit-Limit`
  - `RateLimit-Remaining`
  - `RateLimit-Reset`
- ✅ 429 status code returned when limit exceeded
- ✅ User-friendly error messages in JSON response
- ✅ `Retry-After` header present in 429 responses

### Proxy Configuration
- ✅ Express configured to trust proxy (for accurate IP detection behind Azure App Service)
- ✅ Rate limiting works correctly with proxied requests

### Frontend Handling
- ✅ Frontend handles 429 responses gracefully
- ✅ User-friendly error message displayed when rate limited
- ✅ Retry-after time shown to user

### Testing Validation
- ✅ All acceptance criteria validated through tests (see Testing Requirements section)
- ✅ No regression in existing functionality

## Testing Requirements

### Unit Tests

**Test File**: `backend/src/middleware/rateLimiting.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { generalLimiter, aiGenerationLimiter, healthCheckLimiter } from './rateLimiting';

describe('Rate Limiting Middleware', () => {
  describe('generalLimiter', () => {
    it('should allow requests within limit', async () => {
      const app = express();
      app.use('/api', generalLimiter);
      app.get('/api/test', (req, res) => res.json({ ok: true }));

      const response = await request(app).get('/api/test');
      expect(response.status).toBe(200);
    });

    it('should return 429 when limit exceeded', async () => {
      const app = express();
      app.use('/api', generalLimiter);
      app.get('/api/test', (req, res) => res.json({ ok: true }));

      // Make 101 requests (limit is 100)
      for (let i = 0; i < 101; i++) {
        const response = await request(app).get('/api/test');
        if (i < 100) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(429);
          expect(response.body).toHaveProperty('error');
        }
      }
    });
  });

  describe('aiGenerationLimiter', () => {
    it('should allow requests within limit', async () => {
      const app = express();
      app.post('/api/generate-xml', aiGenerationLimiter, (req, res) => res.json({ ok: true }));

      const response = await request(app).post('/api/generate-xml');
      expect(response.status).toBe(200);
    });

    it('should return 429 after 10 requests in 1 hour', async () => {
      const app = express();
      app.post('/api/generate-xml', aiGenerationLimiter, (req, res) => res.json({ ok: true }));

      // Make 11 requests (limit is 10)
      for (let i = 0; i < 11; i++) {
        const response = await request(app).post('/api/generate-xml');
        if (i < 10) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(429);
          expect(response.body.error).toContain('AI generation limit');
        }
      }
    });

    it('should include rate limit headers', async () => {
      const app = express();
      app.post('/api/generate-xml', aiGenerationLimiter, (req, res) => res.json({ ok: true }));

      const response = await request(app).post('/api/generate-xml');
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });
  });
});
```

**Coverage Target**: 85%+ for rate limiting middleware

### Integration Tests

**Test File**: `backend/src/integration/rateLimiting.integration.test.ts`

Test full application with rate limiting:

1. **General API Rate Limiting**:
   - Make 100 requests to any API endpoint
   - Verify all succeed
   - Make 101st request, verify 429 response

2. **AI Endpoint Strict Limiting**:
   - Make 10 requests to `/api/generate-xml`
   - Verify all succeed
   - Make 11th request, verify 429 response with specific message

3. **Health Check Permissive Limiting**:
   - Make 30 requests to `/api/health` in 1 minute
   - Verify all succeed
   - Make 31st request, verify 429 response

4. **WebSocket Connection Limiting**:
   - Open 5 WebSocket connections from same IP
   - Verify all succeed
   - Attempt 6th connection, verify connection refused

### Manual Testing

**Test Scenario 1: AI Endpoint Rate Limiting**

1. Start backend: `npm run dev` in backend/
2. Make 10 POST requests to `http://localhost:3000/api/generate-xml`
   ```bash
   for i in {1..10}; do
     curl -X POST http://localhost:3000/api/generate-xml \
       -H "Content-Type: application/json" \
       -d '{"description": "test schema"}' \
       -w "\nStatus: %{http_code}\n"
   done
   ```
3. Expected: First 10 succeed (200), 11th fails (429)
4. Verify error message includes "AI generation limit"

**Test Scenario 2: WebSocket Connection Limiting**

1. Open 5 browser tabs to application
2. All should connect successfully to WebSocket
3. Open 6th tab
4. Expected: 6th tab shows connection error
5. Close one tab, open new tab
6. Expected: New connection succeeds (slot available)

**Test Scenario 3: Rate Limit Headers**

```bash
curl -v http://localhost:3000/api/generate-xml \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"description": "test"}'
```

Expected headers in response:
```
RateLimit-Limit: 10
RateLimit-Remaining: 9
RateLimit-Reset: <timestamp>
```

### Performance Testing

**Load Test**: Verify rate limiting doesn't significantly impact latency

```bash
# Using Apache Bench (if available)
ab -n 1000 -c 10 http://localhost:3000/api/health

# Or using k6 (already in project)
cd tests/load
k6 run --vus 10 --duration 30s load-test.js
```

Expected: Latency increases <10ms with rate limiting enabled

## Risk Mitigation

### Identified Risks

**Risk 1: Legitimate Users Blocked**
- **Probability**: MEDIUM (users behind NAT/corporate proxy share IP)
- **Impact**: MEDIUM (user frustration, support tickets)
- **Mitigation**: Set reasonable limits (10/hour for AI is generous for single user)
- **Contingency**: Implement user-based rate limiting (requires authentication) instead of IP-based

**Risk 2: Bypass via IP Rotation**
- **Probability**: LOW (requires sophisticated attacker)
- **Impact**: MEDIUM (rate limiting partially ineffective)
- **Mitigation**: Monitor usage patterns, add CAPTCHA if abuse detected
- **Contingency**: Implement additional security measures (authentication, API keys)

**Risk 3: Performance Overhead**
- **Probability**: LOW (express-rate-limit is highly optimized)
- **Impact**: LOW (<10ms latency increase)
- **Mitigation**: Use in-memory store (default), benchmark before/after
- **Contingency**: Use Redis for distributed rate limiting if needed

**Risk 4: Breaks Existing Clients**
- **Probability**: LOW (new error response, existing clients should handle)
- **Impact**: MEDIUM (existing integrations may fail)
- **Mitigation**: Comprehensive testing, frontend updated to handle 429
- **Contingency**: Temporarily disable rate limiting, fix clients, re-enable

### Rollback Plan

**Rollback Trigger**: 
- Rate limiting causes >10% increase in error rate
- Legitimate users consistently blocked
- Performance degrades >20ms

**Rollback Steps**:
1. Comment out rate limiting middleware in `backend/src/index.ts`:
   ```typescript
   // app.use('/api', generalLimiter); // ROLLBACK: Disabled rate limiting
   ```
2. Restart backend
3. Verify error rate returns to normal
4. Investigate root cause
5. Adjust limits or implementation
6. Re-enable with updated configuration

**Recovery Time**: <5 minutes (simple code change + restart)

### Contingency

**Alternative Approach 1**: If IP-based limiting causes issues for corporate users:
- Implement user-based rate limiting (requires authentication from Task 011)
- Store limits per user ID instead of IP address
- More accurate and fair for shared IPs

**Alternative Approach 2**: If express-rate-limit has bugs:
- Use alternative library: `rate-limiter-flexible`
- Implement custom rate limiting with Redis

**Support Plan**:
- Monitor rate limit errors in Application Insights (Phase 4)
- Create support documentation for users hitting limits
- Add admin dashboard to view rate limit status (future enhancement)

## Estimated Effort

**Complexity**: Low-Medium  
**Estimated Time**: 1-2 days

**Breakdown**:
- Install dependency: 10 minutes
- Create rate limiting middleware: 1 hour
- Apply to Express routes: 30 minutes
- Implement WebSocket limiting: 1 hour
- Configure proxy trust: 15 minutes
- Update frontend error handling: 1 hour
- Write unit tests: 2 hours
- Write integration tests: 2 hours
- Manual testing and validation: 2 hours
- Documentation: 1 hour

**Total**: 10-12 hours (1.5-2 days)

**Required Skills**:
- Express.js middleware development
- Understanding of rate limiting algorithms
- TypeScript
- Testing with Vitest and Supertest

## Related Documentation

**Reverse Engineering**:
- [specs/ANALYSIS_SUMMARY.md](../ANALYSIS_SUMMARY.md) - Critical finding: No rate limiting
- [specs/docs/integration/apis.md](../docs/integration/apis.md) - API endpoints documentation

**Modernization Strategy**:
- [specs/modernize/assessment/security-audit.md](../modernize/assessment/security-audit.md) - Section 2.2: Rate Limiting
- [specs/modernize/assessment/technical-debt.md](../modernize/assessment/technical-debt.md) - Security gaps
- [specs/modernize/strategy/roadmap.md](../modernize/strategy/roadmap.md) - Phase 1, Week 1: Rate Limiting

## Success Criteria Summary

✅ **Rate Limiting Active**: All endpoints protected  
✅ **AI Endpoint Secured**: Strict 10 req/hour limit prevents cost abuse  
✅ **WebSocket Protected**: 5 connections per IP limit  
✅ **Headers Present**: Standard rate limit headers in responses  
✅ **Frontend Updated**: Graceful handling of 429 responses  
✅ **Tests Pass**: 85%+ coverage with unit and integration tests  
✅ **No Regression**: All existing functionality works  
✅ **Performance**: <10ms latency overhead

## Next Steps (After Task Completion)

1. **Monitor rate limit hits** in logs (implement logging middleware)
2. **Task 005**: Complete real-time collaboration feature
3. **Task 011**: Implement authentication (enables user-based rate limiting)
4. **Phase 4**: Add Application Insights monitoring for rate limit analytics

---

**Task Owner**: Dev Agent  
**Reviewer**: Modernization Strategy Agent  
**Stakeholder**: Technical Lead / Security Lead
