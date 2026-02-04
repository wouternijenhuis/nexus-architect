# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-02-04

### Updated

#### Frontend Dependencies
- **React**: 18.2.0 → 18.3.1 (latest stable)
- **React DOM**: 18.2.0 → 18.3.1
- **Azure OpenAI**: 1.0.0-beta.11 → 2.0.0 (stable release)
- **fast-xml-parser**: 5.3.4 → 4.5.0 (latest stable v4)
- **Socket.IO Client**: 4.7.4 → 4.8.1
- **Zustand**: 4.5.0 → 5.0.2 (major version update)
- **React Router DOM**: 6.22.0 → 7.1.1 (major version update)
- **Lucide React**: 0.323.0 → 0.469.0
- **TypeScript**: 5.3.3 → 5.7.2
- **Vite**: 5.1.3 → 6.0.7 (major version update)
- **Vitest**: 1.2.2 → 2.1.8 (major version update)
- **ESLint**: 8.56.0 → 9.18.0 (major version update with flat config)
- **TypeScript ESLint**: 6.21.0 → 8.18.2 (major version update)
- **Tailwind CSS**: 3.4.1 → 3.4.17
- **Testing Library React**: 14.2.1 → 16.1.0 (major version update)
- **jsdom**: 24.0.0 → 25.0.1 (major version update)
- And many other dev dependencies to latest versions

#### Backend Dependencies
- **Express**: 4.18.2 → 4.21.2
- **Socket.IO**: 4.7.4 → 4.8.1
- **dotenv**: 16.4.1 → 16.4.7
- **TypeScript**: 5.3.3 → 5.7.2
- **tsx**: 4.7.1 → 4.19.2
- **ESLint**: 8.56.0 → 9.18.0 (major version update with flat config)
- **TypeScript ESLint**: 6.21.0 → 8.18.2 (major version update)
- **@types/express**: 4.17.21 → 5.0.0 (major version update)
- **@types/node**: 20.11.16 → 22.10.2 (major version update)

#### Testing Dependencies
- **Playwright**: 1.41.2 → 1.49.1
- **@types/node**: 20.11.16 → 22.10.2

#### Root Dependencies
- **concurrently**: 8.2.2 → 9.1.0 (major version update)
- **Prettier**: 3.2.5 → 3.4.2

### Changed
- Migrated ESLint configuration from `.eslintrc.cjs` to `eslint.config.js` (ESLint 9 flat config format)
- Updated ESLint config for both frontend and backend to use new flat config system
- Added required ESLint 9 dependencies: `@eslint/js`, `typescript-eslint`, `globals`

## [1.0.1] - 2024-02-04

### Security

- **CRITICAL**: Updated fast-xml-parser from 4.3.4 to 5.3.4 to fix CVE (RangeError DoS Numeric Entities Bug)
  - Vulnerability affected versions >= 4.3.6, <= 5.3.3
  - Patched in version 5.3.4

## [1.0.0] - 2024-02-04

### Added

#### Frontend
- React 18 + TypeScript 5 + Vite setup
- Tailwind CSS styling with dark mode support
- Zustand state management with local storage persistence
- Project and schema management UI
- XSD schema editor with tabs for elements, complex types, and simple types
- Real-time XSD preview generation
- XML validation against XSD schemas
- Azure OpenAI integration for AI-powered XML sample generation
- Socket.IO client for real-time collaboration
- Import/Export functionality for projects and schemas

#### Backend
- Express server with TypeScript
- Socket.IO server for real-time WebSocket communication
- Health check API endpoint
- Room-based collaboration for schema editing
- User presence tracking

#### Testing
- Vitest setup for unit tests
- Playwright setup for E2E tests with basic test suite
- k6 load testing configuration
- GitHub Actions CI/CD workflow

#### Documentation
- MkDocs with Material theme
- Comprehensive user guides
- API documentation
- Developer documentation
- Architecture overview
- Contributing guide

#### Developer Tools
- ESLint configuration for TypeScript
- Prettier code formatting
- TSX for TypeScript execution
- Concurrently for running multiple dev servers
- Environment variable templates

### Features
- Create and manage XSD projects
- Create and edit XSD schemas with visual editor
- Support for complex types with elements and attributes
- Support for simple types with restrictions (patterns, enumerations, length, etc.)
- Multi-file XSD imports
- Export schemas as .xsd files
- Export/import projects as JSON
- Local storage persistence
- Real-time collaboration via WebSocket
- AI-powered XML sample generation using Azure OpenAI
- XML validation against XSD schemas
- Dark mode support
- Responsive design

[1.0.0]: https://github.com/wouternijenhuis/nexus-architect/releases/tag/v1.0.0
