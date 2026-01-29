# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Calendar Versioning](https://calver.org/) (YYYY.M.patch).

## [2026.1.1] - 2026-01-29

**Based on riddix Fork** - This release adds comprehensive monitoring, debugging, and system management capabilities inspired by the [riddix fork](https://github.com/riddix/home-assistant-matter-hub) analysis. Implements backend APIs and complete frontend UI for health monitoring, logging, system metrics, backup/restore, and Prometheus integration.

### Added

#### Health Monitoring API
- **Basic Health Endpoint**: `GET /api/health` for quick health checks
  - Returns overall status (healthy/degraded/unhealthy), uptime, and timestamp
  - Suitable for monitoring systems and load balancers
- **Detailed Health Endpoint**: `GET /api/health/detailed` for comprehensive status
  - Includes application version, Node.js version, platform info
  - Per-bridge health with device counts and failed device counts
  - Commissioning status for each bridge
- **Health Status Calculation**: Smart status determination
  - Healthy: All bridges running with no failed devices
  - Degraded: Bridges operational but some devices failed
  - Unhealthy: One or more bridges stopped or in error state

#### Application Logging System
- **In-Memory Log Buffer**: Ring buffer storing last 1000 log entries
  - Automatic eviction of oldest entries when buffer full
  - Captures all log levels (DEBUG, INFO, NOTICE, WARN, ERROR, FATAL)
  - Includes timestamp, level, facility (logger name), and message
- **Logs API**: `GET /api/logs` for retrieving application logs
  - Filter by minimum log level (0=DEBUG, 1=INFO, 2=NOTICE, 3=WARN, 4=ERROR, 5=FATAL)
  - Filter by facility name (case-insensitive partial match)
  - Search in log messages (case-insensitive)
  - Filter by timestamp (since parameter in milliseconds)
  - Limit number of results (most recent N entries)
  - Returns logs array with count and total
- **Log Management**: `DELETE /api/logs` to clear all captured logs
- **Automatic Capture**: All BetterLogger instances automatically capture logs to buffer

#### System Information API
- **System Metrics Endpoint**: `GET /api/system/info` for comprehensive system information
  - Returns detailed metrics in JSON format
  - Suitable for monitoring dashboards and administrative tools
- **CPU Metrics**: Complete processor information
  - CPU model name and architecture (x64, arm64, etc.)
  - Number of cores
  - Real-time CPU usage percentage (0-100)
  - System load average [1min, 5min, 15min]
- **Memory Metrics**: System and process memory statistics
  - Total, free, and used system memory
  - Memory usage percentage
  - Process memory breakdown (RSS, heap total/used, external, array buffers)
- **Storage Metrics**: Storage location information
  - Storage path and existence check
  - Placeholder for disk space metrics (requires platform-specific implementation)
- **Process Metrics**: Node.js process information
  - Process ID (PID), uptime, Node.js version, app version
- **Platform Metrics**: Operating system details
  - Platform, OS release/type, hostname, directory paths
- **Network Metrics**: Network interface information
  - All network interfaces with IPv4/IPv6 addresses
  - Netmask, MAC address, interface type (internal/external)

#### Backup & Restore System
- **Complete Backup**: `POST /api/backup` creates full system backup
  - Includes all bridge configurations
  - **Preserves Matter Identity**: Keypairs and fabrics included (no re-pairing needed!)
  - Returns downloadable JSON file with metadata (version, timestamp)
  - Base64-encoded storage files for binary data preservation
- **Restore Functionality**: `POST /api/backup/restore` restores from backup
  - Automatic validation before restore
  - Creates safety backup of existing data before overwriting
  - Optional `preserveExisting` parameter to keep current storage
  - Requires application restart after restore to load new configuration
- **Backup Validation**: `POST /api/backup/validate` validates backup integrity
  - Checks metadata completeness, returns file count and backup info
  - Safe validation without making changes
- **Zero External Dependencies**: Uses only Node.js built-ins (fs, path)
- **Future-Proof**: Compatible with existing storage migration system

#### Prometheus Metrics Integration
- **Metrics Endpoint**: `GET /api/metrics` exposes Prometheus-compatible metrics
  - Standard text format for Prometheus scraping
  - Compatible with Grafana and other monitoring tools
- **Default Node.js Metrics**: Automatic collection with `hamb_` prefix
  - CPU usage, memory (heap, RSS, external), event loop lag
  - Garbage collection statistics, active handles and requests
- **Bridge-Specific Metrics**: Detailed per-bridge observability
  - `hamb_bridges_total`: Total number of configured bridges
  - `hamb_bridge_status`: Bridge operational status
  - `hamb_bridge_devices_total`: Successfully loaded devices per bridge
  - `hamb_bridge_failed_devices_total`: Failed device count per bridge
  - `hamb_bridge_commissioned`: Commissioning status indicator
  - `hamb_bridge_fabrics_total`: Number of connected Matter fabrics
- **Rich Labels**: All bridge metrics include `bridge_id` and `bridge_name` labels

#### WebSocket Real-Time Updates
- **WebSocket Server**: Real-time bidirectional communication on `/ws` path
  - Automatic connection on same port as HTTP server
  - Supports multiple concurrent client connections
  - WebSocket URL: `ws://localhost:8482/ws` (or configured port)
- **Event Types**: Structured JSON messages for different events
  - `connected`: Initial handshake with connection timestamp
  - `bridges:initial`: Full state snapshot on connection
  - `bridges:update`: Periodic state updates (every 5 seconds)
- **Bridge Updates**: Real-time notifications for state changes
  - Bridge status changes, device count updates
  - Commissioning status changes, fabric connection/disconnection events
- **Connection Management**: Robust client lifecycle handling
  - 30-second ping/pong keepalive mechanism
  - Automatic cleanup of disconnected clients, graceful error handling

#### Frontend UI: Log Viewer
- **Full-Featured Log Viewer Page**: `/logs` route for viewing application logs
  - Real-time log display with auto-scroll and auto-refresh options
  - Sortable table view with timestamp, level, facility, and message columns
  - Color-coded log levels (DEBUG, INFO, NOTICE, WARN, ERROR, FATAL)
- **Advanced Filtering**: Multiple filter options for log exploration
  - Filter by log level (0-5), facility name, message search
  - Limit number of displayed results
- **User Controls**: Interactive features for log management
  - Auto-scroll toggle, auto-refresh toggle (5-second intervals)
  - Download logs as plain text file
  - Clear all logs with confirmation prompt
- **Responsive Design**: Works seamlessly on desktop and mobile devices

#### Frontend UI: System Info Dashboard
- **Comprehensive System Dashboard**: `/system` route for monitoring system metrics
  - Real-time metrics display with auto-refresh option (5-second intervals)
  - Responsive 2-column grid layout (single column on mobile)
- **CPU Metrics Card**: Visual processor information with color-coded progress bar
- **Memory Metrics Card**: System and process memory statistics with progress bar
- **Process Information Card**: PID, uptime, Node.js/app versions
- **Platform Information Card**: OS details, hostname, directory paths
- **Storage Information Card**: Storage location status and disk space
- **Network Interfaces Card**: All network interfaces with IPv4/IPv6 addresses

#### Frontend UI: Navigation Enhancements
- **Updated Top Navigation Bar**: Added menu items for new pages
  - "Bridges" - Existing bridge management (Dashboard icon)
  - "Logs" - New log viewer (Article icon)
  - "System" - New system info dashboard (Info icon)
  - Active route highlighting with bold text and bottom border
  - Icon-only display on small screens for space efficiency

#### API Client Layer
- **Frontend API Functions**: Clean separation of concerns
  - `packages/frontend/src/api/logs.ts` - Logs API client functions
  - `packages/frontend/src/api/system.ts` - System info API client functions
- **Custom React Hooks**: Reusable data fetching hooks
  - `packages/frontend/src/hooks/useLogs.ts` - Log data management with filtering
  - `packages/frontend/src/hooks/useSystemInfo.ts` - System metrics with auto-refresh

#### Dependencies
- `prom-client@15.1.3` - Prometheus metrics collection

### Changed

- **Navigation Routes**: Added `/logs` and `/system` routes to application router
- **Top Navigation Bar**: Enhanced with new menu items and active route indicators

### Notes for Users

This release provides complete monitoring and debugging capabilities inspired by the [riddix fork](https://github.com/riddix/home-assistant-matter-hub):
- **Application Logs**: Debug issues and monitor application behavior in real-time via web UI
- **System Metrics**: Track resource usage (CPU, memory, network, storage) and system health
- **Health Monitoring**: Check application and bridge health status via API or monitoring tools
- **Backup/Restore**: Protect your configuration with full backups including Matter identity
- **Prometheus Integration**: Connect to Grafana or other monitoring dashboards

**Acknowledgment**: These features were analyzed and reimplemented based on improvements found in the riddix fork of the original home-assistant-matter-hub project.
- **WebSocket Updates**: Real-time bridge status updates (backend ready, frontend integration pending)

---

## [2026.1.0] - 2026-01-29

**Based on riddix Fork** - This release implements critical bug fixes and stability improvements inspired by the [riddix fork](https://github.com/riddix/home-assistant-matter-hub). The riddix fork identified and addressed important issues with device error handling and thermostat functionality.

### Added

#### Graceful Error Handling (riddix Fork)
- **Failed Device Tracking**: Bridges now track devices that fail to load
  - Devices that fail during creation are logged and tracked
  - Devices that fail to add to aggregator are tracked
  - Failed devices don't crash the entire bridge
- **FailedDevice Interface**: New type in common package
  - `entityId`: The Home Assistant entity ID that failed
  - `error`: Error message describing the failure
  - `timestamp`: When the failure occurred
- **Failed Devices API**: Exposed via `GET /api/bridges/:id`
  - `failedDevices` array in BridgeDataWithMetadata
  - Empty array omitted from response
- **Enhanced Logging**: Summary logging after device refresh
  - "Device refresh completed: X successful, Y failed"
  - Individual device failures logged at WARN/ERROR level

#### Thermostat/Climate Bug Fixes (riddix Fork)
- **Setpoint Deadband Filtering**: Fixed random temperature values from Apple Home (Issue #38 from riddix)
  - Single-temperature thermostats now filter setpoint updates based on current HVAC mode
  - Heating setpoint changes only processed in Heat/EmergencyHeat/Auto modes
  - Cooling setpoint changes only processed in Cool/Precooling/Auto modes
  - Prevents conflicting updates when Apple Home enforces 2°C deadband between setpoints
- **SystemMode Write Permission Fix**: Fixed "read-only" errors when changing modes (Issue #24 from riddix)
  - Wrapped `thermostatRunningMode` state update in `asLocalActor` for elevated permissions
  - Resolves Matter.js permission errors during external systemMode writes from HomeKit/Alexa

#### Project Rebranding
- Renamed project from "Home Assistant Matter Hub" to "Home Assistant Matter Bridge"
- Updated package names from `@home-assistant-matter-hub/*` to `@home-assistant-matter-bridge/*`
- Changed environment variable prefix from `HAMH_*` to `HAMB_*`
- Renamed CLI command from `home-assistant-matter-hub` to `home-assistant-matter-bridge`
- Updated all branding, logos, and documentation
- Renamed directories: `hamh` → `hamb`, `hamh-beta` → `hamb-beta`
- Renamed logo assets: `hamh-logo*` → `hamb-logo*`
- Updated Docker image names to `ghcr.io/sukramj/home-assistant-matter-bridge`
- Updated Home Assistant add-on configuration (slug changed from `hamh` to `hamb`)

#### Testing Infrastructure
- Comprehensive test suite implementation with 68 new tests (+55% increase)
  - Backend: 100 tests (up from 54)
  - Frontend: 20 tests (new)
  - Total: 192 tests across all packages
- Test coverage reporting with vitest and v8 provider
- Test configuration files for all packages (vitest.config.ts)
- Frontend test setup with React Testing Library and jsdom

#### Dependencies
- `@testing-library/react@^16.2.0` - React component testing
- `@testing-library/jest-dom@^6.6.5` - Custom DOM matchers
- `jsdom@^27.4.0` - DOM implementation for Node.js
- `supertest@^7.2.2` - HTTP assertion library for API testing
- `@types/supertest@^6.0.3` - TypeScript types for supertest
- `@vitest/coverage-v8@^4.0.18` - Coverage reporting for all packages

#### CI/CD Integration
- Added test coverage steps to GitHub Actions workflows
- Automated coverage report artifacts on every PR and release
- Quality gates with coverage thresholds

#### Documentation
- `CHANGELOG.md` - Project changelog following Keep a Changelog format
- `ADDON_LOCAL_TESTING.md` - Guide for local add-on development and testing
- `WORKFLOW_VERIFICATION.md` - GitHub Actions workflow verification report
- Updated documentation to reflect new project name

#### Home Assistant Add-on
- Added `Dockerfile` and `build.yaml` to `hamb/` and `hamb-beta/` for local add-on builds
- Enables local development and testing without published Docker images

### Changed

- Updated all package.json files with new naming scheme
- Modified `.env.sample` with new environment variable names
- Updated GitHub Actions workflows
- Updated Home Assistant add-on configurations
- Adjusted backend coverage thresholds to realistic levels
- Updated CLI script name, product label, authentication realm
- Modified frontend logo imports and HTML title
- Updated Docker image paths in all Dockerfiles

### Fixed

- Biome linting errors across test files
- Test failures in Matter API tests (schema validation, mock structure)
- Coverage configuration issues across packages
- TypeScript compilation errors in test files
- Home Assistant add-on Docker registry error

### Breaking Changes

⚠️ **Important for existing users:**

1. **Environment Variables**: All `HAMH_*` environment variables must be renamed to `HAMB_*`
2. **CLI Command**: `home-assistant-matter-hub` → `home-assistant-matter-bridge`
3. **Docker Images**: New image name `ghcr.io/sukramj/home-assistant-matter-bridge`
4. **Add-on Slug**: Changed from `hamh` to `hamb` (requires reinstall for existing users)
5. **Default Storage Path**: `~/.hamh-development` → `~/.hamb-development` (development)
6. **Package Names**: All workspace package names changed to `@home-assistant-matter-bridge/*`

### Migration Notes

For users updating from previous versions:

1. Update environment variables in your `.env` file
2. If using Docker, update image references in your deployment configuration
3. For Home Assistant add-on users: The slug change means this appears as a new add-on; you'll need to reinstall
4. Consider migrating data from old storage location if applicable

---

## [Earlier Versions]

Previous version history unavailable. This project is a restart of the original home-assistant-matter-hub project.

[2026.1.1]: https://github.com/SukramJ/home-assistant-matter-bridge/releases/tag/v2026.1.1
[2026.1.0]: https://github.com/SukramJ/home-assistant-matter-bridge/releases/tag/v2026.1.0
