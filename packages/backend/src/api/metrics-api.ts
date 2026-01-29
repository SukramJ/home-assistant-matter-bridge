import { BridgeStatus } from "@home-assistant-matter-bridge/common";
import express from "express";
import { collectDefaultMetrics, Gauge, Registry } from "prom-client";
import type { BridgeService } from "../services/bridges/bridge-service.js";

/**
 * Prometheus metrics API
 */
export function metricsApi(bridgeService: BridgeService): express.Router {
  const router = express.Router();

  // Create a custom registry for our metrics
  const register = new Registry();

  // Collect default Node.js metrics (CPU, memory, event loop, etc.)
  collectDefaultMetrics({ register, prefix: "hamb_" });

  // Custom bridge metrics
  const bridgeTotalGauge = new Gauge({
    name: "hamb_bridges_total",
    help: "Total number of configured bridges",
    registers: [register],
  });

  const bridgeStatusGauge = new Gauge({
    name: "hamb_bridge_status",
    help: "Bridge status (1=running, 0=stopped, -1=failed, -2=starting)",
    labelNames: ["bridge_id", "bridge_name"],
    registers: [register],
  });

  const bridgeDeviceCountGauge = new Gauge({
    name: "hamb_bridge_devices_total",
    help: "Total number of devices in a bridge",
    labelNames: ["bridge_id", "bridge_name"],
    registers: [register],
  });

  const bridgeFailedDeviceCountGauge = new Gauge({
    name: "hamb_bridge_failed_devices_total",
    help: "Number of failed devices in a bridge",
    labelNames: ["bridge_id", "bridge_name"],
    registers: [register],
  });

  const bridgeCommissionedGauge = new Gauge({
    name: "hamb_bridge_commissioned",
    help: "Whether bridge is commissioned (1=yes, 0=no)",
    labelNames: ["bridge_id", "bridge_name"],
    registers: [register],
  });

  const bridgeFabricCountGauge = new Gauge({
    name: "hamb_bridge_fabrics_total",
    help: "Number of fabrics connected to a bridge",
    labelNames: ["bridge_id", "bridge_name"],
    registers: [register],
  });

  /**
   * GET /api/metrics
   * Returns Prometheus metrics in text format
   */
  router.get("/", async (_, res) => {
    try {
      // Update bridge metrics
      const bridges = bridgeService.bridges;
      bridgeTotalGauge.set(bridges.length);

      for (const bridge of bridges) {
        const data = bridge.data;
        const labels = { bridge_id: data.id, bridge_name: data.name };

        // Bridge status: map to numeric values
        let statusValue: number;
        switch (data.status) {
          case BridgeStatus.Running:
            statusValue = 1;
            break;
          case BridgeStatus.Starting:
            statusValue = -2;
            break;
          case BridgeStatus.Stopped:
            statusValue = 0;
            break;
          case BridgeStatus.Failed:
            statusValue = -1;
            break;
          default:
            statusValue = 0;
        }
        bridgeStatusGauge.set(labels, statusValue);

        // Device counts
        bridgeDeviceCountGauge.set(labels, data.deviceCount);
        bridgeFailedDeviceCountGauge.set(
          labels,
          data.failedDevices?.length ?? 0,
        );

        // Commissioning status
        const isCommissioned = data.commissioning?.isCommissioned ?? false;
        bridgeCommissionedGauge.set(labels, isCommissioned ? 1 : 0);

        // Fabric count
        const fabricCount = data.commissioning?.fabrics.length ?? 0;
        bridgeFabricCountGauge.set(labels, fabricCount);
      }

      // Return metrics in Prometheus format
      res.set("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).json({
        error: "Failed to collect metrics",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}
