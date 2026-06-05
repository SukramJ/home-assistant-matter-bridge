import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { type Environment, StorageService } from "@matter/main";
import { FileStorageDriver } from "@matter/nodejs";
import { CustomStorage } from "./storage/custom-storage.js";

export interface StorageOptions {
  location?: string;
}

export function storage(environment: Environment, options: StorageOptions) {
  const location = resolveStorageLocation(options.location);
  fs.mkdirSync(location, { recursive: true });
  environment.vars.set("storage.path", location);
  const storageService = environment.get(StorageService);
  storageService.registerDriver({
    id: FileStorageDriver.id,
    async create(namespace) {
      const driver = new CustomStorage(namespace);
      await driver.initialize();
      return driver;
    },
  });
  storageService.defaultDriver = FileStorageDriver.id;
}

function resolveStorageLocation(storageLocation: string | undefined) {
  const homedir = os.homedir();
  return storageLocation
    ? path.resolve(storageLocation.replace(/^~\//, `${homedir}/`))
    : path.join(homedir, ".home-assistant-matter-bridge");
}
