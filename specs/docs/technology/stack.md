# Technology Stack

## Overview
Nexus Architect is an XSD Schema creation and management application built with a modern, full-stack JavaScript/TypeScript architecture. The application follows a monorepo structure with separate frontend and backend services.

## Programming Languages

### TypeScript 5.7.2
- **Primary Language**: Used across all application code
- **Target**: ES2020
- **Strict Mode**: Enabled with comprehensive type checking
- **Usage**:
  - Frontend application code
  - Backend server code
  - Type definitions and interfaces

### JavaScript (ES2020)
- **Module System**: ESModule (type: "module" in all package.json files)
- **Usage**:
  - Build scripts
  - Test configurations
  - Load testing scripts (k6)

## Frontend Stack

### Core Framework & UI
- **React 18.3.1**: Primary UI framework
  - Functional components with hooks
  - React Router DOM 7.1.1 for routing
  - React DOM 18.3.1
- **Vite 6.0.7**: Build tool and dev server
  - Fast HMR (Hot Module Replacement)
  - Optimized production builds
  - [@vitejs/plugin-react 4.3.4](frontend/vite.config.ts)

### Styling & UI Components
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
  - PostCSS 8.4.49 for processing
  - Autoprefixer 10.4.20 for browser compatibility
  - Custom configuration in [tailwind.config.js](frontend/tailwind.config.js)
- **Lucide React 0.469.0**: Icon library

### State Management & Data
- **Zustand 5.0.2**: Lightweight state management
  - Includes persist middleware for local storage
  - Used in [lib/store.ts](frontend/src/lib/store.ts)
- **fast-xml-parser 4.5.0**: XML parsing and building
  - Used for XSD generation and XML validation
  - Shared between frontend and backend

### Real-time Communication
- **Socket.IO Client 4.8.1**: WebSocket client
  - Real-time collaboration features
  - Schema synchronization
  - Implementation in [lib/websocket.ts](frontend/src/lib/websocket.ts)

### Development Tools (Frontend)
- **ESLint 9.18.0**: Code linting
  - @typescript-eslint/eslint-plugin 8.18.2
  - @typescript-eslint/parser 8.18.2
  - eslint-plugin-react-hooks 5.1.0
  - eslint-plugin-react-refresh 0.4.16
- **Prettier 3.4.2**: Code formatting
- **TypeScript 5.7.2**: Type checking
- **Vitest 2.1.8**: Unit testing framework
  - @testing-library/react 16.1.0
  - @testing-library/jest-dom 6.6.3
  - jsdom 25.0.1

## Backend Stack

### Server Framework
- **Express 4.21.2**: Web application framework
  - RESTful API endpoints
  - Middleware support
  - CORS enabled
- **Node.js**: Runtime environment (target ES2020)

### Real-time Communication
- **Socket.IO 4.8.1**: WebSocket server
  - Real-time schema collaboration
  - Multi-user editing support
  - Room-based communication

### Utilities & Services
- **cors 2.8.5**: CORS middleware
- **dotenv 16.4.7**: Environment variable management
- **fast-xml-parser 4.5.0**: XML processing (shared with frontend)

### AI Integration
- **@azure/openai 2.0.0**: Azure OpenAI SDK
  - XML generation from XSD schemas
  - AI-powered sample creation
  - Implementation in [services/ai-service.ts](backend/src/services/ai-service.ts)

### Development Tools (Backend)
- **tsx 4.19.2**: TypeScript execution for development
  - Watch mode for live reloading
- **ESLint 9.18.0**: Code linting
  - Same configuration as frontend
- **Prettier 3.4.2**: Code formatting
- **TypeScript 5.7.2**: Type checking

## Testing Stack

### Unit Testing
- **Vitest 2.1.8**: Fast unit test runner
  - Frontend component testing
  - Utility function testing
  - Configuration in [frontend/src/test/setup.ts](frontend/src/test/setup.ts)
- **Testing Library**:
  - @testing-library/react 16.1.0
  - @testing-library/jest-dom 6.6.3
- **jsdom 25.0.1**: DOM environment for testing

### End-to-End Testing
- **Playwright 1.49.1**: E2E testing framework
  - Cross-browser testing
  - UI testing capabilities
  - Configuration in [tests/e2e/playwright.config.ts](tests/e2e/playwright.config.ts)
  - Tests in [tests/e2e/tests/](tests/e2e/tests/)

### Load Testing
- **k6**: Load testing tool
  - Performance testing
  - Load testing script: [tests/load/load-test.js](tests/load/load-test.js)

## Documentation

### Documentation Framework
- **MkDocs**: Documentation generator
  - Material theme
  - Configuration in [docs/mkdocs.yml](docs/mkdocs.yml)
  - Markdown-based documentation
- **Features**:
  - Navigation tabs and sections
  - Search functionality
  - Dark/light mode support
  - Code syntax highlighting (Pygments)
  - Tabbed content support

## Build & Development Tools

### Package Management
- **npm**: Primary package manager
  - Workspaces not used (manual cd commands)
  - Scripts for monorepo management

### Build Tools
- **TypeScript Compiler (tsc)**: Backend compilation
  - Outputs to [backend/dist/](backend/dist/)
  - Configuration in [backend/tsconfig.json](backend/tsconfig.json)
- **Vite**: Frontend bundling
  - Development server with HMR
  - Production optimization

### Process Management
- **concurrently 9.1.0**: Run multiple npm scripts
  - Simultaneous frontend and backend development

### Code Quality
- **ESLint**: Linting across all TypeScript/JavaScript
- **Prettier**: Code formatting with consistent style
- **.prettierrc**: Shared formatting configuration

## CI/CD

### GitHub Actions
- **Workflow Files**:
  - [.github/workflows/ci.yml](.github/workflows/ci.yml): Main CI pipeline
  - [.github/workflows/package-release.yml](.github/workflows/package-release.yml): Release automation

### CI Pipeline ([ci.yml](.github/workflows/ci.yml))
- **Triggers**: Push to main/develop, PRs
- **Jobs**:
  1. **Lint Job**: Runs ESLint on frontend and backend
  2. **Test Unit Job**: Runs Vitest unit tests
  3. **Build Job**: Compiles frontend and backend
  4. **Test E2E Job**: Runs Playwright tests
- **Node Version**: 18
- **Package Manager**: npm with caching

## External Services & APIs

### Azure OpenAI
- **SDK**: @azure/openai 2.0.0
- **Purpose**: AI-powered XML sample generation
- **Configuration**: Environment variables
  - AZURE_OPENAI_ENDPOINT
  - AZURE_OPENAI_API_KEY
  - AZURE_OPENAI_DEPLOYMENT (default: 'gpt-4')
- **Optional**: System works without AI configuration

## Environment Configuration

### Frontend Environment Variables
- **VITE_API_URL**: Backend API URL (default: http://localhost:3001)

### Backend Environment Variables
- **PORT**: Server port (default: 3001)
- **FRONTEND_URL**: CORS allowed origin (default: http://localhost:3000)
- **AZURE_OPENAI_ENDPOINT**: Azure OpenAI endpoint
- **AZURE_OPENAI_API_KEY**: Azure OpenAI API key
- **AZURE_OPENAI_DEPLOYMENT**: Deployment name (default: gpt-4)

## Development Environment

### Recommended Tools
- **VS Code**: IDE with GitHub Copilot integration
  - MCP (Model Context Protocol) configured in [.vscode/mcp.json](.vscode/mcp.json)
  - Connected services: context7, github, microsoft.docs.mcp, playwright, deepwiki

### Browser Compatibility
- Modern browsers supporting ES2020
- WebSocket support required for real-time features

## Version Summary

### Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.7.2 | Type System |
| Express | 4.21.2 | Backend Server |
| Socket.IO | 4.8.1 | Real-time Communication |
| Vite | 6.0.7 | Build Tool |
| Tailwind CSS | 3.4.17 | Styling |
| Zustand | 5.0.2 | State Management |
| Vitest | 2.1.8 | Unit Testing |
| Playwright | 1.49.1 | E2E Testing |
| Azure OpenAI | 2.0.0 | AI Integration |

### Node.js Requirements
- **Minimum Version**: Node.js 18
- **Package Manager**: npm
- **Module System**: ESModule (type: "module")

## Technology Decisions & Rationale

### Why TypeScript?
- Type safety across entire stack
- Better IDE support and autocomplete
- Easier refactoring and maintenance

### Why Vite?
- Fast development server with HMR
- Optimized production builds
- Native ES module support

### Why Zustand?
- Lightweight state management
- Simple API without boilerplate
- Built-in persistence support

### Why Socket.IO?
- Reliable WebSocket communication
- Automatic reconnection
- Room-based messaging for collaboration

### Why Tailwind CSS?
- Rapid UI development
- Consistent design system
- Small production bundle size
- No CSS-in-JS runtime cost
