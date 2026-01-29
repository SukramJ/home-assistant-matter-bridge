import express from "express";
import type { SystemInfoService } from "../services/system/system-info-service.js";

/**
 * System information API endpoints
 *
 * GET /api/system/info - Get complete system information
 */
export function systemApi(systemInfoService: SystemInfoService): express.Router {
  const router = express.Router();

  /**
   * GET /api/system/info
   * Get complete system information including CPU, memory, storage, process, platform, and network details
   */
  router.get("/info", async (_, res) => {
    try {
      const systemInfo = await systemInfoService.getSystemInfo();
      res.status(200).json(systemInfo);
    } catch (error) {
      res.status(500).json({
        error: "Failed to retrieve system information",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}
