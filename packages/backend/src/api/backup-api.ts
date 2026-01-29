import express from "express";
import type { BackupService } from "../services/backup/backup-service.js";
import type { RestoreService } from "../services/backup/restore-service.js";

export function backupApi(
  backupService: BackupService,
  restoreService: RestoreService,
): express.Router {
  const router = express.Router();

  /**
   * Create a backup of all storage data
   * POST /api/backup
   *
   * Returns a JSON backup that can be saved by the client
   */
  router.post("/", async (_, res) => {
    try {
      const backupData = await backupService.createBackup();

      // Set headers for file download
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `hamb-backup-${timestamp}.json`;

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.status(200).send(backupData);
    } catch (error) {
      res.status(500).json({
        error: "Failed to create backup",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Restore from a backup
   * POST /api/backup/restore
   *
   * Body: JSON backup data (from /api/backup)
   * Query params:
   * - preserveExisting: If true, keep existing storage as backup
   */
  router.post("/restore", async (req, res) => {
    try {
      const backupJson =
        typeof req.body === "string" ? req.body : JSON.stringify(req.body);

      const preserveExisting = req.query.preserveExisting === "true";

      // Validate backup first
      const validation = restoreService.validateBackup(backupJson);
      if (!validation.valid) {
        res.status(400).json({
          error: "Invalid backup",
          message: validation.error,
        });
        return;
      }

      // Restore the backup
      await restoreService.restoreBackup(backupJson, { preserveExisting });

      res.status(200).json({
        success: true,
        message:
          "Backup restored successfully. Please restart the application.",
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to restore backup",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Validate a backup without restoring
   * POST /api/backup/validate
   *
   * Body: JSON backup data
   */
  router.post("/validate", async (req, res) => {
    try {
      const backupJson =
        typeof req.body === "string" ? req.body : JSON.stringify(req.body);

      const validation = restoreService.validateBackup(backupJson);

      if (validation.valid) {
        // Parse to get metadata
        const backup = JSON.parse(backupJson);
        res.status(200).json({
          valid: true,
          metadata: backup.metadata,
          fileCount: Object.keys(backup.files).length,
        });
      } else {
        res.status(400).json({
          valid: false,
          error: validation.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        error: "Failed to validate backup",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}
