# Architecture Overview

## System Architecture

Nexus Architect follows a **client-server architecture** with real-time collaboration capabilities. The system is composed of three main layers:

1. **Frontend Layer**: React-based SPA (Single Page Application)
2. **Backend Layer**: Express server with REST and WebSocket APIs
3. **External Services Layer**: Optional Azure OpenAI integration

### Architecture Type: Monolithic with Service Separation

The application is a **monolith with separated concerns**:
- Frontend and backend are separate Node.js applications
- Both reside in the same repository (monorepo structure)
- No shared code between frontend and backend (except similar types)
- Communication happens exclusively through HTTP REST and WebSocket protocols

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser/Client                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React Frontend (Port 3000)               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │   Routes    │  │   Zustand   │  │  Socket.IO   │  │  │
│  │  │  (Router)   │  │   Store     │  │   Client     │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │  XSD Utils  │  │  UI Pages   │  │  Components  │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │ │
                ┌───────────┘ └───────────┐
                │                         │
         HTTP/REST API            WebSocket (Socket.IO)
                │                         │
                └───────────┬─────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│               Express Backend Server (Port 3001)             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    HTTP Server                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │ REST Routes │  │  Socket.IO  │  │     CORS     │  │  │
│  │  │  /api/*     │  │   Server    │  │  Middleware  │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │          Services Layer                         │  │  │
│  │  │  ┌────────────────┐   ┌────────────────────┐   │  │  │
│  │  │  │   AI Service   │   │  Schema Rooms Mgmt │   │  │  │
│  │  │  │ (Azure OpenAI) │   │   (WebSocket)      │   │  │  │
│  │  │  └────────────────┘   └────────────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                    (Optional, Configured)
                            │
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Azure OpenAI Service                     │  │
│  │         (XML Generation from XSD Schemas)             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Structure

### Frontend Architecture

**Location**: [frontend/src/](frontend/src/)

#### Routing Structure
Implemented using React Router DOM v7:

```
/                            → HomePage
/project/:projectId          → ProjectPage
/schema/:projectId/:schemaId → SchemaEditor
```

**Implementation**: [frontend/src/App.tsx](frontend/src/App.tsx)

#### Component Organization

```
frontend/src/
├── App.tsx                    # Main app component with routing
├── main.tsx                   # Entry point, React DOM render
├── components/                # Shared UI components
│   └── Header.tsx            # Application header/navigation
├── features/                  # Feature-based organization
│   ├── home/
│   │   └── HomePage.tsx      # Projects list and management
│   ├── project/
│   │   └── ProjectPage.tsx   # Single project with schemas list
│   └── schema/
│       └── SchemaEditor.tsx  # XSD schema editor interface
├── lib/                       # Shared utilities and services
│   ├── store.ts              # Zustand state management
│   ├── websocket.ts          # Socket.IO client wrapper
│   ├── azure-ai.ts           # Azure OpenAI API client
│   └── xsd-utils.ts          # XSD generation and validation
├── types/
│   └── xsd.ts                # TypeScript type definitions
├── styles/
│   └── index.css             # Global styles and Tailwind imports
└── test/
    ├── setup.ts              # Vitest configuration
    └── xsd-utils.test.ts     # Unit tests for XSD utilities
```

#### State Management Pattern

**Technology**: Zustand with persistence middleware

**Store Location**: [frontend/src/lib/store.ts](frontend/src/lib/store.ts)

**State Structure**:
```typescript
{
  projects: XSDProject[]           // All projects
  currentProject: XSDProject | null  // Active project
  currentSchema: XSDSchema | null    // Active schema
  // Actions (createProject, deleteProject, createSchema, etc.)
}
```

**Persistence**: LocalStorage via Zustand persist middleware
- Key: `nexus-architect-storage`
- Auto-saves all state changes
- Restores on page reload

### Backend Architecture

**Location**: [backend/src/](backend/src/)

#### Server Structure

```
backend/src/
├── index.ts                   # Main server entry point
└── services/
    └── ai-service.ts          # Azure OpenAI integration service
```

**Server Type**: Single-file Express server with Socket.IO

#### API Endpoints

**File**: [backend/src/index.ts](backend/src/index.ts)

1. **Health Check** (`GET /api/health`)
   - Returns server status
   
2. **AI XML Generation** (`POST /api/generate-xml`)
   - Generates XML samples from XSD schemas
   - Optional feature (requires Azure OpenAI)

#### WebSocket Implementation

**Technology**: Socket.IO v4

**Room-Based Architecture**:
- Each XSD schema has its own room (`schema:${schemaId}`)
- Users join/leave rooms dynamically
- Updates broadcast only to room members

**Events**:
- `join-schema`: User joins a schema room
- `leave-schema`: User leaves a schema room
- `update-schema`: Schema content updated
- `collaboration-update`: Cursor/selection updates
- `user-joined`: Notification when user joins
- `user-left`: Notification when user leaves
- `schema-updated`: Broadcast schema changes

**Room Management**:
- In-memory Map: `schemaRooms: Map<schemaId, Set<socketId>>`
- Automatic cleanup on disconnect
- Memory leak prevention (empty rooms deleted)

## Data Flow

### Project Management Flow

1. **User creates project** (HomePage)
   - Frontend: `createProject()` in Zustand store
   - State persisted to localStorage
   - No backend interaction

2. **User creates schema** (ProjectPage)
   - Frontend: `createSchema()` in Zustand store
   - Empty schema object created with UUID
   - State persisted locally

3. **User edits schema** (SchemaEditor)
   - Frontend: Local state updated
   - `updateSchema()` called
   - Changes persisted to localStorage
   - WebSocket broadcast to collaborators (if any)

### Real-Time Collaboration Flow

1. **User opens schema editor**
   - WebSocket connection established (if not already)
   - Client emits `join-schema` event
   - Server adds user to room
   - Other users notified via `user-joined` event

2. **User makes schema changes**
   - Local state updated immediately (optimistic update)
   - Client emits `update-schema` event
   - Server broadcasts to room (except sender)
   - Other clients receive `schema-updated` event
   - **Note**: No conflict resolution implemented

3. **User closes editor**
   - Client emits `leave-schema` event
   - Server removes from room
   - Other users notified via `user-left` event

### AI XML Generation Flow

1. **User requests AI-generated XML** (SchemaEditor)
   - Frontend: Converts schema to XSD string using `generateXSDString()`
   - HTTP POST to `/api/generate-xml` with XSD and context
   - Backend: Calls Azure OpenAI via `ai-service.ts`
   - Response: Generated XML or error message
   - Frontend displays result

**Failure Handling**:
- If Azure OpenAI not configured: 503 Service Unavailable
- If AI call fails: Error message displayed to user
- Feature gracefully degrades (app works without AI)

### Data Persistence Flow

**Storage**: Browser LocalStorage only
- No database
- No server-side persistence
- All data client-side

**Export/Import Flow**:
1. **Export Project**:
   - Serialize project to JSON
   - Download as `.json` file
   
2. **Import Project**:
   - User selects `.json` file
   - Parse and validate
   - Generate new UUID (prevent conflicts)
   - Add to projects list

3. **Export Schema**:
   - Convert schema to XSD string
   - Download as `.xsd` file
   - Standard XML format

## Integration Points

### Internal Integrations

1. **Frontend ↔ Backend REST API**
   - Protocol: HTTP
   - Format: JSON
   - CORS: Enabled for frontend URL
   - Base URL: Configurable via `VITE_API_URL`

2. **Frontend ↔ Backend WebSocket**
   - Protocol: WebSocket (Socket.IO)
   - Transport: WebSocket with fallback
   - Rooms: Schema-based isolation
   - Reconnection: Automatic

### External Integrations

1. **Backend → Azure OpenAI** (Optional)
   - Protocol: HTTPS
   - SDK: @azure/openai v2.0.0
   - Authentication: API Key (AzureKeyCredential)
   - Model: Configurable deployment (default: gpt-4)
   - Purpose: XML sample generation from XSD

**Configuration**:
- `AZURE_OPENAI_ENDPOINT`: Service endpoint
- `AZURE_OPENAI_API_KEY`: Authentication key
- `AZURE_OPENAI_DEPLOYMENT`: Model deployment name

**Graceful Degradation**:
- If not configured: Feature disabled
- UI shows error message
- Rest of application functions normally

## Deployment Architecture

### Development Environment

**Ports**:
- Frontend: `3000` (Vite dev server)
- Backend: `3001` (Express server)

**Start Commands**:
```bash
npm run dev                 # Runs both concurrently
npm run dev:frontend        # Frontend only
npm run dev:backend         # Backend only
```

**Hot Reload**:
- Frontend: Vite HMR (instant)
- Backend: tsx watch mode (automatic restart)

### Production Build

**Frontend Build**:
```bash
npm run build:frontend
# Output: frontend/dist/
# Static files ready for CDN/web server
```

**Backend Build**:
```bash
npm run build:backend
# Output: backend/dist/
# Compiled JavaScript ready for Node.js
```

**Start Production**:
```bash
cd backend && npm start
# Runs: node dist/index.js
```

### Deployment Considerations

**Frontend Deployment Options**:
- Static hosting (Vercel, Netlify, Azure Static Web Apps)
- CDN distribution
- Any web server (nginx, Apache)

**Backend Deployment Options**:
- Node.js hosting (Azure App Service, Heroku, AWS)
- Container deployment (Docker)
- Serverless not suitable (WebSocket requirement)

**Environment Variables Required**:

Frontend:
- `VITE_API_URL`: Backend URL

Backend:
- `PORT`: Server port
- `FRONTEND_URL`: CORS origin
- `AZURE_OPENAI_*`: Optional AI credentials

### No Database Architecture

**Important**: This application has **no database**.

**Data Storage Strategy**:
- All data stored in browser localStorage
- Maximum ~5-10MB per origin (browser dependent)
- User responsible for backups (export feature)
- No user accounts or authentication
- No server-side state persistence

**Implications**:
- Simple deployment (no DB to manage)
- No data migration concerns
- User data portable (JSON export/import)
- Scalability: Stateless backend
- Limitation: No cross-device sync
- Risk: Data loss if localStorage cleared

## Scalability Considerations

### Current Architecture Limitations

1. **WebSocket Scaling**:
   - In-memory room management
   - Sticky sessions required for load balancing
   - No Redis pub/sub for multi-instance coordination

2. **No Horizontal Scaling Support**:
   - Single instance design
   - Room state not shared across instances
   - Would need Redis adapter for Socket.IO

3. **Client-Side Storage**:
   - Browser localStorage limits (~5-10MB)
   - No cloud synchronization
   - No backup/restore

### Potential Scaling Path

If backend needed to scale:
1. Add Redis for Socket.IO adapter
2. Implement sticky sessions (or Redis pub/sub)
3. Extract AI service to separate microservice
4. Add database for optional cloud sync

**Current Scale Target**: Single-user or small team use
- WebSocket rooms handle multiple users per schema
- Suitable for <100 concurrent users per instance
- No persistence means no DB bottlenecks

## Security Architecture

### Current Security Posture

**Frontend**:
- No authentication implemented
- No authorization checks
- All data client-side (public by nature)
- XSS protection via React (automatic escaping)

**Backend**:
- CORS enabled (restricts browser origins)
- No authentication middleware
- No rate limiting
- No input validation (beyond basic type checking)
- API keys for Azure OpenAI stored server-side (good)

**WebSocket**:
- No authentication on socket connections
- No room access control
- Anyone can join any schema room (if they know the ID)

### Security Gaps (Documented)

1. **No User Authentication**: Anyone can access any project/schema
2. **No Authorization**: No permission system
3. **No Rate Limiting**: API can be abused
4. **No Input Validation**: XSD/XML input not validated for malicious content
5. **No Schema Ownership**: Anyone can edit any schema in a room
6. **WebSocket Open**: No token-based socket authentication

**Note**: These are design decisions for a local-first, single-user tool. Not security bugs for the intended use case.

## Technology Choices Rationale

### Why Client-Side Storage?

**Decision**: Use localStorage instead of a database

**Rationale**:
- Simpler deployment (no DB infrastructure)
- Faster read/write (no network latency)
- User owns their data
- Offline-first capability
- Export/import for portability

**Trade-offs**:
- No cross-device sync
- Limited storage capacity
- Risk of data loss

### Why Socket.IO Over Native WebSocket?

**Decision**: Socket.IO instead of raw WebSocket API

**Rationale**:
- Automatic reconnection
- Fallback transports
- Room/namespace support built-in
- Event-based API (simpler than message parsing)
- Cross-browser compatibility

### Why No Database?

**Decision**: Intentionally stateless backend

**Rationale**:
- Target use case: Individual developers or small teams
- Simplifies deployment
- No data migration concerns
- No privacy concerns (no data stored on server)
- Scales horizontally (stateless)

### Why Zustand Over Redux?

**Decision**: Zustand for state management

**Rationale**:
- Much simpler API
- No boilerplate
- Built-in persistence middleware
- TypeScript support
- Smaller bundle size
- Sufficient for app complexity

## Future Architecture Considerations

### Potential Enhancements (Not Implemented)

1. **Cloud Sync Option**:
   - Optional backend persistence
   - User accounts for multi-device sync
   - Keep localStorage as primary with cloud backup

2. **Operational Transform for Collaboration**:
   - Current: Last write wins (potential conflicts)
   - Future: OT or CRDT for conflict-free merging

3. **Offline-First with Sync**:
   - Service worker for offline capability
   - Sync queue for updates
   - Conflict resolution strategy

4. **Microservices Split**:
   - Separate AI service
   - Separate collaboration service
   - API gateway

**Current Status**: None of these implemented. Documented for future reference.
