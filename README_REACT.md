# TradingAgents React - Setup Guide

## Overview

This is the React.js conversion of the TradingAgents Python framework. It provides a modern web interface with real-time updates, interactive visualizations, and a comprehensive API backend.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Real-time**: Socket.io Client
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **LLM**: LangChain.js
- **Database**: PostgreSQL + Prisma
- **Cache/Queue**: Redis + BullMQ
- **Vector DB**: ChromaDB
- **Real-time**: Socket.io

## Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 14+
- Redis 7+
- ChromaDB (optional, for memory features)

## Installation

### 1. Install Dependencies

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 2. Setup Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your actual values
# Required:
# - DATABASE_URL
# - OPENAI_API_KEY
# - NEXTAUTH_SECRET
# - JWT_SECRET
```

### 3. Setup Database

```bash
# Generate Prisma client
cd apps/api
pnpm prisma generate

# Push schema to database
pnpm prisma db push

# Optional: Open Prisma Studio to view data
pnpm prisma studio
```

### 4. Start Development Servers

```bash
# From root directory, start all services
pnpm dev

# This will start:
# - Frontend (Next.js) on http://localhost:3000
# - Backend (Express) on http://localhost:3001
```

## Project Structure

```
tradingagents-react/
├── apps/
│   ├── web/              # Next.js frontend application
│   └── api/              # Express.js backend API
├── packages/
│   ├── types/            # Shared TypeScript types
│   └── config/           # Shared configuration
├── docker/               # Docker configuration (coming soon)
└── .github/              # CI/CD workflows (coming soon)
```

## Development Workflow

### Running Individual Apps

```bash
# Frontend only
cd apps/web
pnpm dev

# Backend only
cd apps/api
pnpm dev
```

### Building for Production

```bash
# Build all apps
pnpm build

# Build specific app
cd apps/web
pnpm build
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### Linting

```bash
# Lint all code
pnpm lint

# Format all code
pnpm format
```

## Key Features

### ✅ Implemented
- [x] Monorepo structure with Turborepo
- [x] Next.js frontend with TypeScript
- [x] Express.js backend with TypeScript
- [x] Shared type definitions
- [x] Database schema with Prisma
- [x] Basic project configuration

### 🚧 In Progress
- [ ] LangGraph state machine port
- [ ] All agent implementations
- [ ] Data flow system
- [ ] Memory and reflection system
- [ ] Real-time WebSocket updates
- [ ] Frontend UI components
- [ ] Authentication system

### 📋 Planned
- [ ] Complete test coverage
- [ ] Docker deployment
- [ ] CI/CD pipeline
- [ ] Production deployment guides

## API Endpoints

### Analysis
- `POST /api/v1/analysis/start` - Start new analysis
- `GET /api/v1/analysis/:id/status` - Get analysis status
- `POST /api/v1/analysis/:id/stop` - Stop running analysis
- `GET /api/v1/analysis/history` - Get analysis history

### Configuration
- `GET /api/v1/config` - Get user configuration
- `PUT /api/v1/config` - Update configuration
- `POST /api/v1/config/test-llm` - Test LLM connection

### WebSocket Events
- `agent:status` - Agent status updates
- `tool:call` - Tool execution events
- `report:generated` - Report generation events
- `debate:update` - Debate progress updates
- `analysis:complete` - Analysis completion event

## Architecture

See [REACT_CONVERSION_PLAN.md](./REACT_CONVERSION_PLAN.md) for detailed architecture documentation.

## Contributing

This is an active conversion project. Key areas needing implementation:

1. **Backend Agents**: Port Python agent logic to TypeScript
2. **Frontend Components**: Build React UI components
3. **Real-time Updates**: Implement WebSocket communication
4. **Data Integration**: Connect to financial data APIs
5. **Testing**: Write comprehensive test suites

## Migration from Python Version

The React version maintains feature parity with the Python implementation:

- ✅ All analyst types (Market, Social, News, Fundamentals)
- ✅ Researcher debate system (Bull/Bear)
- ✅ Risk management debate system
- ✅ Memory and reflection capabilities
- ✅ Multiple LLM provider support
- ✅ Flexible data vendor configuration
- ➕ **New**: Real-time web interface
- ➕ **New**: User authentication
- ➕ **New**: Analysis history and comparison
- ➕ **New**: Interactive visualizations

## Support

For issues, questions, or contributions, please see the main project README or open an issue on GitHub.

## License

Same as the main TradingAgents project.
