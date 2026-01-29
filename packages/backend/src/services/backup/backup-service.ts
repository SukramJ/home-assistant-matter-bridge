import fs from "node:fs";
import path from "node:path";
import type { BetterLogger } from "../../core/app/logger.js";
import { Service } from "../../core/ioc/service.js";

export interface BackupMetadata {
  version: string;
  timestamp: number;
  storageLocation: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  files: Record<string, string>; // filepath -> base64 content
}

/**
 * Service for creating backups of application storage
 */
export class BackupService extends Service {
  constructor(
    private readonly log: BetterLogger,
    private readonly storageLocation: string,
    private readonly appVersion: string,
  ) {
    super("BackupService");
  }

  /**
   * Create a backup of all storage data
   * Returns a JSON string containing all storage files and metadata
   */
  async createBackup(): Promise<string> {
    this.log.info("Creating backup...");

    const backup: BackupData = {
      metadata: {
        version: this.appVersion,
        timestamp: Date.now(),
        storageLocation: this.storageLocation,
      },
      files: {},
    };

    // Read all files recursively from storage directory
    await this.readDirectory(this.storageLocation, "", backup.files);

    const backupJson = JSON.stringify(backup, null, 2);
    this.log.info(
      `Backup created: ${Object.keys(backup.files).length} files, ${(backupJson.length / 1024).toFixed(2)} KB`,
    );

    return backupJson;
  }

  /**
   * Recursively read all files from a directory
   */
  private async readDirectory(
    basePath: string,
    relativePath: string,
    files: Record<string, string>,
  ): Promise<void> {
    const fullPath = path.join(basePath, relativePath);

    if (!fs.existsSync(fullPath)) {
      return;
    }

    const entries = fs.readdirSync(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryRelativePath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        await this.readDirectory(basePath, entryRelativePath, files);
      } else if (entry.isFile()) {
        const content = fs.readFileSync(path.join(basePath, entryRelativePath));
        // Store as base64 to preserve binary data
        files[entryRelativePath] = content.toString("base64");
      }
    }
  }

  /**
   * Save backup to a file
   */
  async saveBackupToFile(backupData: string, outputPath: string): Promise<void> {
    fs.writeFileSync(outputPath, backupData, "utf-8");
    this.log.info(`Backup saved to ${outputPath}`);
  }
}
