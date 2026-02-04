# Architecture

This document describes the technical architecture of Nexus Architect.

## Overview

Nexus Architect follows a modern client-server architecture with:
- React-based SPA frontend
- Node.js/Express backend
- WebSocket for real-time features
- Local storage for persistence

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │   Router    │  │  Zustand │  │  Socket.IO       │   │
│  │   (Pages)   │◄─┤  (State) │◄─┤  (WebSocket)     │   │
│  └─────────────┘  └──────────┘  └──────────────────┘   │
│         │              │                  │              │
│         ▼              ▼                  ▼              │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Components  │  │  Local   │  │  Azure OpenAI    │   │
│  │             │  │ Storage  │  │  (AI Gen)        │   │
│  └─────────────┘  └──────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/WebSocket
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Backend (Express + Socket.IO)             │
│  ┌─────────────┐  ┌──────────────────┐                 │
│  │   REST API  │  │   WebSocket      │                 │
│  │   Routes    │  │   Events         │                 │
│  └─────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack

- **React 18**: UI framework with hooks
- **TypeScript 5**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management
- **React Router**: Client-side routing
- **Socket.IO Client**: WebSocket communication
- **Fast XML Parser**: XML/XSD parsing

### Directory Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   └── Header.tsx
│   ├── features/           # Feature-specific components
│   │   ├── home/           # Home page
│   │   ├── project/        # Project management
│   │   └── schema/         # Schema editor
│   ├── lib/                # Utilities and core logic
│   │   ├── store.ts        # Zustand state management
│   │   ├── xsd-utils.ts    # XSD generation/parsing
│   │   ├── azure-ai.ts     # AI integration
│   │   └── websocket.ts    # WebSocket client
│   ├── types/              # TypeScript type definitions
│   │   └── xsd.ts
│   ├── styles/             # Global styles
│   │   └── index.css
│   ├── test/               # Test utilities
│   │   └── setup.ts
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

### State Management

**Zustand Store** (`lib/store.ts`):
- Projects array
- Current project/schema
- CRUD operations
- Local storage persistence

**State Flow**:
1. User action triggers store method
2. Store updates state immutably
3. React re-renders affected components
4. State persisted to local storage
5. WebSocket broadcasts changes (optional)

### Data Flow

**Creating a Schema**:
```
User Input → Store Action → State Update → UI Re-render → Local Storage → WebSocket Broadcast
```

**Receiving Remote Updates**:
```
WebSocket Event → Store Action → State Update → UI Re-render
```

## Backend Architecture

### Technology Stack

- **Node.js**: Runtime environment
- **Express**: Web framework
- **Socket.IO**: WebSocket server
- **TypeScript**: Type safety
- **tsx**: TypeScript execution

### Directory Structure

```
backend/
├── src/
│   ├── index.ts            # Server entry point
│   ├── routes/             # REST API routes (future)
│   ├── services/           # Business logic (future)
│   └── middleware/         # Express middleware (future)
├── tsconfig.json           # TypeScript configuration
├── .env.example            # Environment template
└── package.json            # Dependencies
```

### Server Components

**Express Server**:
- REST API endpoints
- CORS middleware
- JSON body parsing

**Socket.IO Server**:
- Connection management
- Room-based communication
- Event broadcasting

### WebSocket Events

**Room Management**:
- Each schema has its own room
- Users join rooms when editing
- Updates broadcast only to room members

**Event Flow**:
```
Client A: emit('update-schema')
    ↓
Server: broadcast to room
    ↓
Clients B, C: receive 'schema-updated'
```

## Data Model

### Core Entities

**XSDProject**:
- id: string
- name: string
- description?: string
- schemas: XSDSchema[]
- timestamps

**XSDSchema**:
- id: string
- name: string
- targetNamespace?: string
- elements: XSDElement[]
- complexTypes: XSDComplexType[]
- simpleTypes: XSDSimpleType[]
- imports: XSDImport[]
- timestamps

**XSDElement**:
- id: string
- name: string
- type: string
- minOccurs?: string
- maxOccurs?: string
- documentation?: string

**XSDComplexType**:
- id: string
- name: string
- elements: XSDElement[]
- attributes: XSDAttribute[]
- documentation?: string

**XSDSimpleType**:
- id: string
- name: string
- base: string
- restrictions?: XSDRestriction[]
- documentation?: string

### Data Persistence

**Local Storage**:
- Key: `nexus-architect-storage`
- Format: JSON serialized state
- Automatic on state changes
- Loaded on app initialization

**Export/Import**:
- Format: JSON
- Includes all project data
- File extension: `.json`
- Compatible across instances

## Build Process

### Development

```bash
npm run dev
```

**Frontend**:
- Vite dev server on port 3000
- Hot module replacement
- Fast refresh for React
- Proxy to backend API

**Backend**:
- tsx watch mode
- Auto-reload on changes
- TypeScript compilation on-the-fly

### Production Build

```bash
npm run build
```

**Frontend**:
1. TypeScript compilation check
2. Vite production build
3. Output to `frontend/dist/`
4. Optimized bundles
5. Asset hashing

**Backend**:
1. TypeScript compilation
2. Output to `backend/dist/`
3. ES modules output

## Testing Architecture

### Unit Tests (Vitest)

- Frontend component testing
- Utility function testing
- State management testing
- Location: `frontend/src/**/*.test.ts`

### E2E Tests (Playwright)

- Full user flow testing
- Multi-browser testing
- Screenshot comparison
- Location: `tests/e2e/tests/`

### Load Tests (k6)

- API endpoint stress testing
- WebSocket connection testing
- Performance metrics
- Location: `tests/load/`

## Security Considerations

### Current Implementation

- No authentication (development mode)
- CORS enabled for configured origin
- XSS prevention via React
- Local storage only (no server persistence)

### Future Enhancements

- User authentication
- Role-based access control
- Encrypted storage
- API rate limiting
- Input sanitization

## Performance Optimizations

### Frontend

- Code splitting by route
- Lazy loading components
- Debounced WebSocket updates
- Optimistic UI updates
- Virtual scrolling for large lists

### Backend

- Efficient room management
- Connection pooling
- Memory-efficient event handling

## Deployment

### Frontend Deployment

Compatible with:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

### Backend Deployment

Compatible with:
- Heroku
- AWS EC2
- Digital Ocean
- Azure App Service

## Next Steps

- Read [Contributing Guide](contributing.md)
- Learn about [Testing](testing.md)
