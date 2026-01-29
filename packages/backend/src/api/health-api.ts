import {
  BridgeStatus,
  type BridgeHealthInfo,
  type DetailedHealthData,
  type HealthData,
  HealthStatus,
  type SystemInfo,
} from "@home-assistant-matter-bridge/common";
import express from "express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { BridgeService } from "../services/bridges/bridge-service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../../package.json"), "utf-8"),
) as { version: string };
const version = packageJson.version;

export function healthApi(bridgeService: BridgeService): express.Router {
  const router = express.Router();
  const startTime = Date.now();

  /**
   * Basic health check endpoint
   * GET /api/health
   */
  router.get("/", (_, res) => {
    const health: HealthData = {
      status: calculateOverallHealth(bridgeService),
      uptime: Date.now() - startTime,
      timestamp: Date.now(),
    };
    res.status(200).json(health);
  });

  /**
   * Detailed health endpoint with bridge and system information
   * GET /api/health/detailed
   */
  router.get("/detailed", (_, res) => {
    const bridges = bridgeService.bridges.map(
      (bridge): BridgeHealthInfo => ({
        id: bridge.data.id,
        name: bridge.data.name,
        status: bridge.data.status,
        deviceCount: bridge.data.deviceCount,
        failedDeviceCount: bridge.data.failedDevices?.length ?? 0,
        isCommissioned: bridge.data.commissioning?.isCommissioned ?? false,
      }),
    );

    const system: SystemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };

    const health: DetailedHealthData = {
      status: calculateOverallHealth(bridgeService),
      uptime: Date.now() - startTime,
      timestamp: Date.now(),
      version,
      bridges,
      system,
    };

    res.status(200).json(health);
  });

  return router;
}

/**
 * Calculate overall health status based on bridge states
 */
function calculateOverallHealth(bridgeService: BridgeService): HealthStatus {
  const bridges = bridgeService.bridges;

  if (bridges.length === 0) {
    // No bridges configured - consider this healthy (initial state)
    return HealthStatus.healthy;
  }

  let healthyCount = 0;
  let degradedCount = 0;
  let unhealthyCount = 0;

  for (const bridge of bridges) {
    const status = bridge.data.status;
    const failedDeviceCount = bridge.data.failedDevices?.length ?? 0;

    // Unhealthy: Bridge stopped or failed
    if (status === BridgeStatus.Stopped || status === BridgeStatus.Failed) {
      unhealthyCount++;
      continue;
    }

    // Degraded: Bridge running but has failed devices
    if (failedDeviceCount > 0) {
      degradedCount++;
      continue;
    }

    // Healthy: Bridge running with all devices loaded
    if (status === BridgeStatus.Running) {
      healthyCount++;
    }
  }

  // Overall status determination:
  // - If any bridge is unhealthy, overall is unhealthy
  // - If all bridges are healthy, overall is healthy
  // - Otherwise, overall is degraded

  if (unhealthyCount > 0) {
    return HealthStatus.unhealthy;
  }

  if (healthyCount === bridges.length) {
    return HealthStatus.healthy;
  }

  return HealthStatus.degraded;
}
