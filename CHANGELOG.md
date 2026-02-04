# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
