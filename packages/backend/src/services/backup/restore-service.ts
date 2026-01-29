import fs from "node:fs";
import path from "node:path";
import type { BetterLogger } from "../../core/app/logger.js";
import { Service } from "../../core/ioc/service.js";
import type { BackupData } from "./backup-service.js";

/**
 * Service for restoring from backups
 */
export class RestoreService extends Service {
  constructor(
    private readonly log: BetterLogger,
    private readonly storageLocation: string,
  ) {
    super("RestoreService");
  }

  /**
   * Validate a backup before restoring
   */
  validateBackup(backupJson: string): { valid: boolean; error?: string } {
    try {
      const backup = JSON.parse(backupJson) as BackupData;

      if (!backup.metadata) {
        return { valid: false, error: "Missing metadata" };
      }

      if (!backup.metadata.version) {
        return { valid: false, error: "Missing version in metadata" };
      }

      if (!backup.metadata.timestamp) {
        return { valid: false, error: "Missing timestamp in metadata" };
      }

      if (!backup.files || typeof backup.files !== "object") {
        return { valid: false, error: "Missing or invalid files data" };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Restore from a backup
   * WARNING: This will overwrite existing storage!
   */
  async restoreBackup(
    backupJson: string,
    options: { preserveExisting?: boolean } = {},
  ): Promise<void> {
    this.log.info("Restoring from backup...");

    const validation = this.validateBackup(backupJson);
    if (!validation.valid) {
      throw new Error(`Invalid backup: ${validation.error}`);
    }

    const backup = JSON.parse(backupJson) as BackupData;

    this.log.info(
      `Restoring backup from ${new Date(backup.metadata.timestamp).toISOString()}`,
    );
    this.log.info(`Backup version: ${backup.metadata.version}`);
    this.log.info(`Files to restore: ${Object.keys(backup.files).length}`);

    // Create backup of existing storage before restoring
    if (fs.existsSync(this.storageLocation) && !options.preserveExisting) {
      const backupDir = `${this.storageLocation}.backup.${Date.now()}`;
      this.log.info(`Creating backup of existing storage at ${backupDir}`);
      fs.cpSync(this.storageLocation, backupDir, { recursive: true });
    }

    // Restore each file
    for (const [relativePath, base64Content] of Object.entries(backup.files)) {
      const fullPath = path.join(this.storageLocation, relativePath);
      const dir = path.dirname(fullPath);

      // Create directory if needed
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file from base64
      const content = Buffer.from(base64Content, "base64");
      fs.writeFileSync(fullPath, content);
    }

    this.log.info("Restore completed successfully");
    this.log.warn(
      "Application restart required for changes to take effect",
    );
  }

  /**
   * Load backup from file
   */
  async loadBackupFromFile(inputPath: string): Promise<string> {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Backup file not found: ${inputPath}`);
    }

    return fs.readFileSync(inputPath, "utf-8");
  }
}
