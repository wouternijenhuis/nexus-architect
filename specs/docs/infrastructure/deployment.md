# Infrastructure & Deployment

## Overview

Nexus Architect is a client-server application with a React frontend and Express backend. The architecture is designed for simple deployment with minimal infrastructure requirements.

## Deployment Architecture

### Current Architecture: Development-Focused

**Target Environment**: Local development or internal team deployment
**Scale**: Single user or small team (<100 concurrent users)
**Infrastructure**: Minimal - No database, no message queue, no cache

### Deployment Options

## Option 1: Local Development

**Configuration**:
- Frontend: Vite dev server (port 3000)
- Backend: Express with tsx watch (port 3001)
- WebSocket: Integrated with backend

**Commands**:
```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:frontend  # Port 3000
npm run dev:backend   # Port 3001
```

**Environment Variables**:

Frontend (.env or .env.local):
```bash
VITE_API_URL=http://localhost:3001
```

Backend (.env):
```bash
PORT=3001
FRONTEND_URL=http://localhost:3000

# Optional: Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

**Requirements**:
- Node.js 18+
- npm
- Modern browser (Chrome, Firefox, Edge, Safari)

## Option 2: Production Build (Single Server)

**Build Process**:
```bash
# Build frontend
cd frontend && npm run build
# Output: frontend/dist/

# Build backend
cd backend && npm run build
# Output: backend/dist/
```

**Deployment**:
```bash
# Serve frontend static files (option 1: separate web server)
# Copy frontend/dist/* to nginx/Apache/CDN

# Run backend (serves API + WebSocket)
cd backend
node dist/index.js
```

**Alternative: Backend Serves Frontend**:
```typescript
// Add to backend/src/index.ts
import path from 'path'

app.use(express.static(path.join(__dirname, '../../frontend/dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'))
})
```

**Environment Variables**:
```bash
# Backend .env
PORT=3001
FRONTEND_URL=https://your-domain.com
NODE_ENV=production

# Azure OpenAI (optional)
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

## Option 3: Azure Deployment

### Frontend: Azure Static Web Apps

**Steps**:
1. Build frontend: `npm run build:frontend`
2. Deploy `frontend/dist/` to Azure Static Web Apps
3. Configure custom domain (optional)
4. Set environment variable:
   - `VITE_API_URL=https://your-backend.azurewebsites.net`

**GitHub Actions**: Can use [.github/workflows/ci.yml](.github/workflows/ci.yml) as base

### Backend: Azure App Service (Node.js)

**Steps**:
1. Create Azure App Service (Node.js 18+)
2. Deploy backend code
3. Configure environment variables in App Service:
   - `PORT` (provided by Azure)
   - `FRONTEND_URL` (your Static Web App URL)
   - Azure OpenAI credentials (if used)
4. Enable WebSocket in App Service:
   - Set `WEBSITES_ENABLE_APP_SERVICE_STORAGE=true`
   - Set `WEBSITE_NODE_DEFAULT_VERSION=18`

**Scaling**: 
- Single instance only (WebSocket rooms in memory)
- For multiple instances, need Redis adapter for Socket.IO

### Database: None Required

**Storage**: All data client-side (browser localStorage)

**Implications**:
- No Azure SQL Database needed
- No Cosmos DB needed
- No storage account for app data
- Simplifies deployment significantly

## Option 4: Container Deployment (Docker)

### Frontend Dockerfile (Production)
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - FRONTEND_URL=http://localhost:3000
      # Add Azure OpenAI vars if needed
    
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://localhost:3001
    depends_on:
      - backend
```

**Note**: Dockerfiles NOT included in repository. These are examples for implementation.

## Environment Configuration

### Development Environment

**Frontend Environment Variables**:
- `VITE_API_URL`: Backend URL (default: http://localhost:3001)

**Backend Environment Variables**:
- `PORT`: Server port (default: 3001)
- `FRONTEND_URL`: CORS allowed origin (default: http://localhost:3000)
- `AZURE_OPENAI_ENDPOINT`: Optional
- `AZURE_OPENAI_API_KEY`: Optional
- `AZURE_OPENAI_DEPLOYMENT`: Optional (default: gpt-4)

**Configuration Files**:
- `.env.local` or `.env` (not committed to git)
- `.gitignore` includes `.env` files

### Production Environment

**Required**:
- `PORT`: Server port (provided by hosting or custom)
- `FRONTEND_URL`: Production frontend URL for CORS
- `NODE_ENV=production` (recommended)

**Optional**:
- Azure OpenAI credentials (feature gracefully degrades without)

**Security**:
- Never commit `.env` files
- Use hosting platform's environment variable management
- Rotate API keys regularly

## Data Persistence

### Client-Side Storage

**Technology**: Browser LocalStorage

**Storage Key**: `nexus-architect-storage`

**Format**: JSON string (serialized by Zustand persist middleware)

**Capacity**: ~5-10 MB (browser dependent)

**Data Stored**:
- All projects
- All schemas within projects
- Current project and schema state

**Backup Strategy**: Export to JSON file (user-initiated)

**Migration**: None required (client-side only)

### No Server-Side Persistence

**Important**: Backend stores NO data

**Implications**:
- ✅ No database setup required
- ✅ Stateless backend (easy horizontal scaling)
- ✅ No data migration concerns
- ✅ Fast deployment
- ❌ No cross-device sync
- ❌ No cloud backup
- ❌ Data loss if localStorage cleared

### Data Persistence Trade-offs

**Advantages**:
- Simple deployment
- No database costs
- No data privacy concerns
- Offline-capable
- Fast read/write

**Disadvantages**:
- Limited storage capacity
- No synchronization across devices
- Risk of data loss (browser clear, uninstall)
- No version history
- No collaboration persistence

## Scaling Considerations

### Current Limitations

**Single Instance Design**:
- WebSocket rooms stored in memory
- Cannot scale horizontally without changes
- Sticky sessions required if load balanced

**Capacity Estimates**:
- Single instance can handle ~100 concurrent users
- WebSocket connections limited by Node.js event loop
- No database bottleneck (no database!)

### Scaling Requirements

**If horizontal scaling needed**:

1. **Add Redis for Socket.IO**:
```bash
npm install @socket.io/redis-adapter redis
```

```typescript
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

const pubClient = createClient({ url: 'redis://localhost:6379' })
const subClient = pubClient.duplicate()

io.adapter(createAdapter(pubClient, subClient))
```

2. **Load Balancer Configuration**:
- Enable sticky sessions (IP hash or cookie-based)
- Or use Redis adapter for cross-instance communication

3. **Health Checks**:
- Add `/api/health` endpoint monitoring
- Configure load balancer health checks

**Current Status**: ❌ None of these implemented

### Vertical Scaling

**Current Approach**: Increase server resources
- More CPU: Better concurrent request handling
- More RAM: Support more WebSocket connections
- Faster network: Reduced latency

**Sufficient For**: Small to medium teams (< 100 users)

## Monitoring & Observability

### Current Status: ⚠️ Minimal

**Logging**:
- ✅ Console logging only
- ✅ WebSocket connection events
- ✅ Schema update events
- ✅ AI generation errors
- ❌ No structured logging
- ❌ No log aggregation
- ❌ No log levels (debug, info, warn, error)

**Example Logs**:
```
Client connected: socket-id-123
User socket-id-123 joined schema: schema-uuid-456
Schema schema-uuid-456 updated by socket-id-123
```

### Metrics: ❌ Not Implemented

**No metrics collected**:
- Request counts
- Response times
- WebSocket connection counts
- Active room counts
- Error rates
- AI generation success/failure rates

**Recommended**: Add Application Insights for Azure deployments

### Health Checks

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "ok",
  "message": "Nexus Architect API is running"
}
```

**Status**: Basic (only checks if server responds)

**Improvements Needed**:
- Check Azure OpenAI connectivity (if configured)
- Check memory usage
- Check active WebSocket connections
- Return HTTP 503 if unhealthy

### Error Tracking: ❌ Not Implemented

**No error tracking service**:
- No Sentry integration
- No Application Insights
- No error aggregation
- No alerting

**Errors**: Only logged to console, then lost

## Security Configuration

### CORS Configuration

**File**: [backend/src/index.ts#L15-L19](backend/src/index.ts)

**Configuration**:
```typescript
io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})
```

**Environment Variable**: `FRONTEND_URL`

**Default**: http://localhost:3000

**Production**: Set to actual frontend domain

**Limitations**: Single origin only (no array support in code)

### TLS/HTTPS

**Current**: None (HTTP only in code)

**Production Requirements**:
- Frontend: HTTPS (handled by hosting platform)
- Backend: HTTPS (reverse proxy or App Service handles)
- WebSocket: WSS (Socket.IO auto-upgrades with HTTPS)

**Configuration**: Set URLs to https:// in environment variables

### API Keys

**Azure OpenAI**: Stored in backend environment variables
- ✅ Not exposed to frontend
- ✅ Server-side only
- ❌ No key rotation mechanism
- ❌ No key expiration handling

**No Other Secrets**: Application has no database, auth tokens, etc.

## Backup & Recovery

### Backup Strategy

**Current**: User-initiated export only

**Process**:
1. User exports project to JSON file
2. User stores file in safe location
3. User re-imports if data lost

**Limitations**:
- Manual process
- No scheduled backups
- No automatic cloud backup
- User responsibility

### Recovery

**Data Loss Scenarios**:

1. **Browser cache cleared**: 
   - All data lost
   - Recovery: Re-import from JSON export (if available)
   
2. **Browser uninstall/reinstall**: 
   - All data lost
   - Recovery: Re-import from JSON export
   
3. **Server restart**: 
   - No impact (no server-side data)
   
4. **Deployment**: 
   - No impact (no database to migrate)

### Disaster Recovery

**RTO (Recovery Time Objective)**: Minutes (deploy new instance)

**RPO (Recovery Point Objective)**: Last export (user-dependent)

**Process**:
1. Deploy new backend instance
2. Deploy new frontend instance
3. Users import their data from exports

**No Data Loss on Server Failure**: Server stores no user data!

## CI/CD Pipeline

### GitHub Actions

**Workflows**:
1. [.github/workflows/ci.yml](.github/workflows/ci.yml) - CI Pipeline
2. [.github/workflows/package-release.yml](.github/workflows/package-release.yml) - Release automation

### CI Pipeline ([ci.yml](.github/workflows/ci.yml))

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs**:

1. **Lint**: 
   - Runs ESLint on frontend and backend
   - Node.js 18
   
2. **Test Unit**: 
   - Runs Vitest unit tests
   - Node.js 18
   
3. **Build**: 
   - Compiles frontend (Vite)
   - Compiles backend (TypeScript)
   
4. **Test E2E**: 
   - Runs Playwright tests
   - Requires build artifacts

**Status**: ✅ Functional CI pipeline

### Deployment Pipeline

**Current Status**: ❌ No automated deployment

**Manual Deployment Required**:
- Build locally
- Deploy to hosting platform
- Configure environment variables

**Recommended Additions**:
- Automated deployment on merge to main
- Environment-specific deployments (staging, production)
- Automated environment variable injection

## Infrastructure Requirements

### Minimum Requirements

**Frontend**:
- Static file hosting
- CDN (optional but recommended)
- HTTPS support

**Backend**:
- Node.js 18+ runtime
- WebSocket support
- HTTPS support
- ~512MB RAM (small scale)
- ~1 CPU core

**No Requirements**:
- ✅ No database
- ✅ No message queue
- ✅ No cache/Redis (unless scaling)
- ✅ No storage account
- ✅ No CDN for user data (no uploads)

### Recommended Resources

**Small Team (<20 users)**:
- Frontend: Static hosting (Azure Static Web Apps free tier)
- Backend: Basic App Service (1 vCPU, 1.75GB RAM)

**Medium Team (20-100 users)**:
- Frontend: Static hosting + CDN
- Backend: Standard App Service (2 vCPU, 3.5GB RAM)

**Large Team (>100 users)**:
- Frontend: Static hosting + CDN
- Backend: Multiple instances with Redis adapter
- Load balancer with sticky sessions

## Cost Estimation (Azure Example)

### Small Deployment

**Frontend**: Azure Static Web Apps (Free tier)
- Cost: $0/month

**Backend**: Azure App Service B1 (Basic)
- Cost: ~$13/month
- Specs: 1 core, 1.75GB RAM

**Optional: Azure OpenAI**
- Cost: Pay per token (varies by usage)
- Example: $0.03 per 1K tokens (GPT-4)

**Total**: ~$13-50/month (depending on AI usage)

### Medium Deployment

**Frontend**: Azure Static Web Apps (Standard)
- Cost: $9/month

**Backend**: Azure App Service S1 (Standard)
- Cost: ~$70/month
- Specs: 1 core, 1.75GB RAM, better SLA

**Optional: Azure OpenAI + Application Insights**
- Cost: Variable

**Total**: ~$80-200/month

### No Database Costs!

**Savings**: ~$50-500/month by not using database
- No Azure SQL Database
- No Cosmos DB
- No storage account for data
- No backup storage

## Network Configuration

### Ports

**Development**:
- Frontend: 3000 (Vite dev server)
- Backend: 3001 (Express + WebSocket)

**Production**:
- Frontend: 80/443 (HTTP/HTTPS)
- Backend: 80/443 or custom port

### Protocols

**HTTP/REST**: 
- GET, POST for API calls
- JSON request/response bodies

**WebSocket**:
- Socket.IO protocol
- Automatic transport selection (WebSocket preferred)
- Fallback to long-polling if needed

### Firewall Rules

**Incoming**:
- Allow HTTP/HTTPS to frontend
- Allow HTTP/HTTPS to backend
- Allow WebSocket (ports 80/443)

**Outgoing**:
- Allow HTTPS to Azure OpenAI (if used)
- Allow npm registry (for builds)

## Related Documentation

- [Architecture Overview](../architecture/overview.md) - System architecture
- [Technology Stack](../technology/stack.md) - Tech choices
- [API Documentation](../integration/apis.md) - API details
- [Security Assessment](../architecture/security.md) - Security posture
