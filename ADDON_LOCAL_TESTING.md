# Home Assistant Add-on Local Testing Guide

## Problem Fixed

The error you encountered:
```
Can't install ghcr.io/sukramj/home-assistant-matter-bridge-addon:2026.1.0:
DockerError(500, 'error from registry: denied\ndenied')
```

This occurred because the Docker image doesn't exist in the GitHub Container Registry yet (it's only published during releases).

## Solution

Added local build configuration so Home Assistant Supervisor can build the add-on locally instead of pulling from the registry.

## Files Added

### For `hamb` (stable add-on):
- ✅ `hamb/Dockerfile` - Docker build instructions
- ✅ `hamb/build.yaml` - Build configuration for Home Assistant

### For `hamb-beta` (beta add-on):
- ✅ `hamb-beta/Dockerfile` - Docker build instructions
- ✅ `hamb-beta/build.yaml` - Build configuration for Home Assistant

## How to Test Locally

### Step 1: Build the Package

First, ensure the package is built:

```bash
cd /path/to/home-assistant-matter-bridge
pnpm run build
```

This creates `apps/home-assistant-matter-bridge/package.tgz` which is needed by the Dockerfile.

### Step 2: Add Local Repository to Home Assistant

1. In Home Assistant, go to **Settings** → **Add-ons** → **Add-on Store**
2. Click the **⋮** menu (top right) → **Repositories**
3. Add your local repository:
   ```
   /config/addons/home-assistant-matter-bridge
   ```
   Or use a Git URL if you've committed the changes:
   ```
   https://github.com/SukramJ/home-assistant-matter-bridge
   ```

### Step 3: Install the Add-on

1. The add-on should now appear in your Add-on Store
2. Click on **Home Assistant Matter Bridge**
3. Click **Install**

Home Assistant Supervisor will now:
- ✅ Use the local `Dockerfile` in the `hamb/` directory
- ✅ Build the image locally using your code
- ✅ Install and run the add-on

### Step 4: Configure the Add-on

1. Go to the **Configuration** tab
2. Set your preferences:
   - `app_log_level`: `info` (or `debug` for more verbose logs)
   - `disable_log_colors`: `false`
   - `mdns_network_interface`: leave empty (auto-detect)

3. Click **Save**

### Step 5: Start the Add-on

1. Go to the **Info** tab
2. Click **Start**
3. Check the **Log** tab for any errors

## Development Workflow

When making changes:

```bash
# 1. Make your code changes
# 2. Rebuild the package
pnpm run build

# 3. Rebuild the add-on in Home Assistant
# Go to Add-ons → Matter Bridge → Rebuild
```

## Troubleshooting

### Build Fails

If the build fails, check:
- ✅ `package.tgz` exists in `apps/home-assistant-matter-bridge/`
- ✅ You've run `pnpm run build` successfully
- ✅ The add-on directory is accessible to Home Assistant

### Can't Find Repository

If Home Assistant can't find the repository:
1. Make sure the repository path is correct
2. Check file permissions
3. Try using the GitHub URL instead of local path

### Add-on Won't Start

Check the logs:
1. Go to Add-ons → Matter Bridge → Log
2. Look for error messages
3. Common issues:
   - Missing Home Assistant configuration
   - Port conflicts
   - Permission issues

## Production Deployment

For production, the Docker images will be published to:
- **Stable**: `ghcr.io/sukramj/home-assistant-matter-bridge-addon:2026.1.0`
- **Beta**: `ghcr.io/sukramj/home-assistant-matter-bridge-addon-beta:2026.1.0`

These are built and published automatically by the GitHub Actions release workflow.

## Notes

- Local builds are for development/testing only
- Production users will pull pre-built images from ghcr.io
- The `build.yaml` and `Dockerfile` files are ignored when using pre-built images
- To switch back to pre-built images, remove the `build.yaml` file
