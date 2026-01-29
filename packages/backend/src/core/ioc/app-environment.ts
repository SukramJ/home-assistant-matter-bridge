import { type Environment, StorageService } from "@matter/main";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WebApi } from "../../api/web-api.js";
import { WebSocketServerService } from "../../api/websocket-server.js";
import { BackupService } from "../../services/backup/backup-service.js";
import { RestoreService } from "../../services/backup/restore-service.js";
import { BridgeFactory } from "../../services/bridges/bridge-factory.js";
import { BridgeService } from "../../services/bridges/bridge-service.js";
import { SystemInfoService } from "../../services/system/system-info-service.js";
import { HomeAssistantActions } from "../../services/home-assistant/home-assistant-actions.js";
import { HomeAssistantClient } from "../../services/home-assistant/home-assistant-client.js";
import { HomeAssistantConfig } from "../../services/home-assistant/home-assistant-config.js";
import { HomeAssistantRegistry } from "../../services/home-assistant/home-assistant-registry.js";
import { AppStorage } from "../../services/storage/app-storage.js";
import { BridgeStorage } from "../../services/storage/bridge-storage.js";
import { LogCaptureService } from "../app/log-capture.js";
import { LoggerService } from "../app/logger.js";
import type { Options } from "../app/options.js";
import { BridgeEnvironmentFactory } from "./bridge-environment.js";
import { EnvironmentBase } from "./environment-base.js";

// Get app version from package.json (same approach as health-api.ts)
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../../package.json"), "utf-8"),
) as { version: string };
const APP_VERSION = packageJson.version;

export class AppEnvironment extends EnvironmentBase {
  static async create(rootEnv: Environment, options: Options) {
    const app = new AppEnvironment(rootEnv, options);
    await app.construction;
    return app;
  }

  private readonly construction: Promise<void>;

  private constructor(
    rootEnv: Environment,
    private readonly options: Options,
  ) {
    const logger = rootEnv.get(LoggerService);

    super({
      id: "App",
      log: logger.get("AppContainer"),
      parent: rootEnv,
    });
    this.construction = this.init();
  }

  private async init() {
    const logger = this.get(LoggerService);

    this.set(LoggerService, logger);

    // Initialize log capture service for in-memory log storage
    const logCapture = new LogCaptureService();
    this.set(LogCaptureService, logCapture);
    // Make log capture available globally for logger hooks
    (globalThis as unknown as { __logCapture?: LogCaptureService }).__logCapture = logCapture;

    this.set(AppStorage, new AppStorage(await this.load(StorageService)));
    this.set(BridgeStorage, new BridgeStorage(await this.load(AppStorage)));

    this.set(
      HomeAssistantClient,
      new HomeAssistantClient(logger, this.options.homeAssistant),
    );
    this.set(
      HomeAssistantConfig,
      new HomeAssistantConfig(await this.load(HomeAssistantClient)),
    );
    this.set(
      HomeAssistantActions,
      new HomeAssistantActions(logger, await this.load(HomeAssistantClient)),
    );
    this.set(
      HomeAssistantRegistry,
      new HomeAssistantRegistry(
        await this.load(HomeAssistantClient),
        this.options.homeAssistant,
      ),
    );

    this.set(BridgeFactory, new BridgeEnvironmentFactory(this));
    this.set(
      BridgeService,
      new BridgeService(
        await this.load(BridgeStorage),
        await this.load(BridgeFactory),
        this.options.bridgeService,
      ),
    );

    // Initialize backup/restore services
    const storageService = await this.load(StorageService);
    const storageLocation = storageService.location ?? this.options.storage.location ?? "";

    this.set(
      BackupService,
      new BackupService(logger.get("BackupService"), storageLocation, APP_VERSION),
    );
    this.set(
      RestoreService,
      new RestoreService(logger.get("RestoreService"), storageLocation),
    );

    // Initialize system info service
    this.set(
      SystemInfoService,
      new SystemInfoService(storageLocation, APP_VERSION),
    );

    // Initialize WebSocket server
    const bridgeService = await this.load(BridgeService);
    this.set(
      WebSocketServerService,
      new WebSocketServerService(logger.get("WebSocketServer"), bridgeService),
    );

    this.set(
      WebApi,
      new WebApi(
        logger,
        bridgeService,
        await this.load(LogCaptureService),
        await this.load(BackupService),
        await this.load(RestoreService),
        await this.load(SystemInfoService),
        await this.load(WebSocketServerService),
        this.options.webApi,
      ),
    );

    this.runtime.add({
      [Symbol.asyncDispose]: () => this.dispose(),
    });
  }
}
