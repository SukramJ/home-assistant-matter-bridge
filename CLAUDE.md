# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Home Assistant Matter Hub is a bridge that exposes Home Assistant entities to Matter-compatible controllers (Alexa, Apple Home, Google Home). It's a TypeScript monorepo with backend services, React frontend, and shared libraries.

**Note**: This project is in end-of-maintenance mode as of January 2026.

## Common Commands

```bash
# Development
pnpm serve              # Start dev server with hot reload (frontend + backend)
pnpm run build          # Build all packages
pnpm run build:minimum  # Build only common package (required before other builds)

# Testing
pnpm test               # Run all tests (auto-builds common first)
pnpm --filter @home-assistant-matter-hub/backend test   # Backend tests only
pnpm --filter @home-assistant-matter-hub/common test    # Common tests only

# Linting
pnpm lint               # Check code with Biome
pnpm lint:fix           # Auto-fix linting/formatting issues

# Production
pnpm run production     # Build and start production app
```

## Architecture

### Monorepo Structure

- **packages/backend/** - Node.js server: Matter protocol, Home Assistant WebSocket integration, Express REST API
- **packages/frontend/** - React admin dashboard with Redux and Material-UI
- **packages/common/** - Shared TypeScript types, schemas, and utilities
- **apps/home-assistant-matter-hub/** - Final bundled application

### Data Flow

```
Home Assistant (WebSocket)
    ↓
HomeAssistantClient → HomeAssistantRegistry
    ↓
BridgeRegistry (entity filtering per bridge)
    ↓
BridgeEndpointManager (creates Matter endpoints)
    ↓
Matter Server Node → Controllers (Alexa/Apple/Google)
```

### Backend Key Components

- **Entry point**: `packages/backend/src/cli.ts` (yargs CLI)
- **Home Assistant integration**: `packages/backend/src/services/home-assistant/` - WebSocket connection, state sync, service calls
- **Bridge management**: `packages/backend/src/services/bridges/` - Bridge lifecycle, entity filtering, endpoint management
- **Matter protocol**: `packages/backend/src/matter/` - Behaviors and endpoints for supported device types
- **REST API**: `packages/backend/src/api/` - Express routes for bridge CRUD operations
- **IoC container**: `packages/backend/src/core/ioc/` - Dependency injection with AppEnvironment and BridgeEnvironment

### Frontend Key Components

- **State**: Redux Toolkit in `packages/frontend/src/state/`
- **Pages**: `packages/frontend/src/pages/` - Bridge list, details, edit forms
- **API client**: `packages/frontend/src/hooks/` - useApi, useBridges, useDevices hooks

### Storage

File-based JSON storage with migration system (v1→v5). Default location: `~/.hamh-development`

## Development Setup

Environment variables (see `.env.sample`):
- `HAMH_HOME_ASSISTANT_URL` - Home Assistant instance URL
- `HAMH_HOME_ASSISTANT_ACCESS_TOKEN` - HA long-lived access token
- `HAMH_STORAGE_LOCATION` - Config storage path
- `HAMH_LOG_LEVEL` - Logging verbosity (debug/info/warn/error)

Frontend dev server proxies `/api` requests to backend at `localhost:8482`.

## Code Style

- **Linter/Formatter**: Biome with 2-space indentation, 80-char line width
- **Module system**: ES Modules throughout
- **Material-UI imports**: Use path imports (e.g., `@mui/material/Button`) for tree-shaking
- **Tests**: Vitest with `.test.ts` files alongside source