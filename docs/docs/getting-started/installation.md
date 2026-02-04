# Installation

This guide will help you install and set up Nexus Architect on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18 or higher
- npm or yarn package manager
- Git

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/nexus-architect.git
cd nexus-architect
```

### 2. Install Dependencies

Install all project dependencies:

```bash
npm run install:all
```

This will install dependencies for:
- Root project
- Frontend
- Backend
- E2E tests

### 3. Configure Environment Variables

#### Frontend Configuration

Create a `.env` file in the `frontend` directory:

```env
# Optional: Azure OpenAI Configuration for AI-powered XML generation
VITE_AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
VITE_AZURE_OPENAI_API_KEY=your-api-key
VITE_AZURE_OPENAI_DEPLOYMENT=gpt-4
```

#### Backend Configuration

Copy the example environment file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` as needed:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Start Development Servers

From the root directory, start both frontend and backend:

```bash
npm run dev
```

This will start:
- Frontend at http://localhost:3000
- Backend at http://localhost:3001

## Verify Installation

1. Open your browser and navigate to http://localhost:3000
2. You should see the Nexus Architect home page
3. Try creating a new project to verify everything works

## Optional: Install Testing Tools

### Playwright for E2E Tests

```bash
cd tests/e2e
npx playwright install
```

### k6 for Load Tests

Follow the [k6 installation guide](https://k6.io/docs/getting-started/installation/) for your platform.

## Troubleshooting

### Port Already in Use

If ports 3000 or 3001 are already in use, you can change them in:
- Frontend: `vite.config.ts`
- Backend: `.env` file

### Module Not Found Errors

Try clearing the node_modules and reinstalling:

```bash
npm run install:all
```

## Next Steps

- Read the [Quick Start Guide](quickstart.md)
- Learn about [Projects](../guide/projects.md)
- Explore [XSD Features](../guide/xsd-features.md)
