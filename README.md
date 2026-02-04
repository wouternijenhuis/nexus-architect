# Nexus Architect

> A comprehensive XSD Schema creation and management application with real-time collaboration and AI-powered XML generation.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ✨ Features

- 🎨 **Modern UI**: React 18 + TypeScript 5 + Tailwind CSS
- 📝 **XSD Schema Editor**: Visual editor for creating and managing XSD schemas
- 🔄 **Real-time Collaboration**: WebSocket-based multi-user editing
- 🤖 **AI-Powered**: Generate XML samples using Azure OpenAI
- ✅ **XML Validation**: Validate XML documents against XSD schemas
- 💾 **Local Storage**: Automatic saving with export/import functionality
- 📦 **Project Management**: Organize schemas into projects
- 🎯 **Complex Types**: Full support for complex and simple types
- 📁 **Multi-file Support**: Import and export multiple schemas
- 🌙 **Dark Mode**: Beautiful dark theme support

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/wouternijenhuis/nexus-architect.git
cd nexus-architect

# Install all dependencies
npm run install:all

# Start development servers
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- [Installation Guide](docs/docs/getting-started/installation.md)
- [Quick Start Tutorial](docs/docs/getting-started/quickstart.md)
- [User Guide](docs/docs/guide/projects.md)
- [API Reference](docs/docs/api/rest.md)
- [Architecture](docs/docs/dev/architecture.md)

### View Documentation Locally

```bash
npm run docs:serve
```

Visit http://localhost:8000 to view the documentation.

## 🏗️ Technology Stack

### Frontend
- **React 18**: Modern UI framework
- **TypeScript 5**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **Socket.IO Client**: Real-time communication
- **Azure OpenAI**: AI-powered XML generation

### Backend
- **Express**: Web application framework
- **Socket.IO**: WebSocket server for real-time features
- **TypeScript**: Type-safe server code
- **tsx**: TypeScript execution for development

### Testing
- **Vitest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **k6**: Load and performance testing

### Documentation
- **MkDocs**: Documentation generator
- **Material Theme**: Beautiful documentation theme

### Dev Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **concurrently**: Run multiple commands

## 📖 Usage

### Creating a Project

1. Click "New Project" on the home page
2. Enter a project name and description
3. Click "Create"

### Creating a Schema

1. Open a project
2. Click "New Schema"
3. Enter a schema name
4. Start adding elements, complex types, and simple types

### Generating XML with AI

1. Configure Azure OpenAI credentials in `backend/.env` (server-side only, never in frontend)
2. Restart the backend server
3. Open a schema editor
4. Go to "XSD Preview" tab
5. Enter context description
6. Click "Generate Sample"

**Security**: API keys are kept secure on the backend server and never exposed to the browser.

### Validating XML

1. Open a schema editor
2. Go to "Validate XML" tab
3. Paste your XML
4. Click "Validate"

## 🧪 Testing

```bash
# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run load tests
npm run test:load

# Run all tests
npm test
```

## 🛠️ Development

### Project Structure

```
nexus-architect/
├── frontend/          # React frontend application
├── backend/           # Express backend server
├── tests/             # Test suites
│   ├── e2e/           # Playwright E2E tests
│   └── load/          # k6 load tests
├── docs/              # MkDocs documentation
└── package.json       # Root package.json
```

### Available Scripts

```bash
npm run dev              # Start dev servers (frontend + backend)
npm run build            # Build for production
npm run test             # Run all tests
npm run lint             # Lint code
npm run format           # Format code with Prettier
npm run docs:serve       # Serve documentation locally
npm run docs:build       # Build documentation
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](docs/docs/dev/contributing.md) for details on our code of conduct and the process for submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add my feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Fast XML Parser for XML/XSD parsing
- Azure OpenAI for AI-powered features
- The React, TypeScript, and Vite communities
- All contributors who help improve this project

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using React, TypeScript, and modern web technologies.**