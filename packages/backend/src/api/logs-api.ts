import { LogLevel } from "@matter/general";
import express from "express";
import type { LogCaptureService } from "../core/app/log-capture.js";

export function logsApi(logCapture: LogCaptureService): express.Router {
  const router = express.Router();

  /**
   * Get application logs with optional filtering
   * GET /api/logs
   *
   * Query parameters:
   * - level: Minimum log level (DEBUG=0, INFO=1, NOTICE=2, WARN=3, ERROR=4, FATAL=5)
   * - facility: Filter by logger name (partial match, case-insensitive)
   * - search: Search in log messages (partial match, case-insensitive)
   * - since: Timestamp to filter logs from (milliseconds since epoch)
   * - limit: Maximum number of logs to return (most recent)
   */
  router.get("/", (req, res) => {
    const level = req.query.level
      ? Number.parseInt(req.query.level as string, 10)
      : undefined;
    const facility = req.query.facility as string | undefined;
    const search = req.query.search as string | undefined;
    const since = req.query.since
      ? Number.parseInt(req.query.since as string, 10)
      : undefined;
    const limit = req.query.limit
      ? Number.parseInt(req.query.limit as string, 10)
      : undefined;

    // Validate level
    if (
      level !== undefined &&
      (Number.isNaN(level) || level < LogLevel.DEBUG || level > LogLevel.FATAL)
    ) {
      res.status(400).json({
        error: "Invalid level parameter. Must be 0-5.",
      });
      return;
    }

    // Validate since
    if (since !== undefined && Number.isNaN(since)) {
      res.status(400).json({
        error: "Invalid since parameter. Must be a number.",
      });
      return;
    }

    // Validate limit
    if (limit !== undefined && (Number.isNaN(limit) || limit <= 0)) {
      res.status(400).json({
        error: "Invalid limit parameter. Must be a positive number.",
      });
      return;
    }

    const logs = logCapture.getFilteredLogs({
      level,
      facility,
      search,
      since,
      limit,
    });

    res.status(200).json({
      logs,
      count: logs.length,
      total: logCapture.logCount,
    });
  });

  /**
   * Clear all captured logs
   * DELETE /api/logs
   */
  router.delete("/", (_, res) => {
    logCapture.clearLogs();
    res.status(204).send();
  });

  return router;
}
