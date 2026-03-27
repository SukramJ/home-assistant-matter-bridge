import type { FailedDevice } from "@home-assistant-matter-bridge/common";
import type { Logger } from "@matter/general";
import type { Endpoint } from "@matter/main";
import { Service } from "../../core/ioc/service.js";
import { AggregatorEndpoint } from "../../matter/endpoints/aggregator-endpoint.js";
import {
  ComposedSensorEndpoint,
  groupSensorsByDevice,
} from "../../matter/endpoints/composed/composed-sensor-endpoint.js";
import type { EntityEndpoint } from "../../matter/endpoints/entity-endpoint.js";
import { LegacyEndpoint } from "../../matter/endpoints/legacy/legacy-endpoint.js";
import { InvalidDeviceError } from "../../utils/errors/invalid-device-error.js";
import { subscribeEntities } from "../home-assistant/api/subscribe-entities.js";
import type { HomeAssistantClient } from "../home-assistant/home-assistant-client.js";
import type { HomeAssistantStates } from "../home-assistant/home-assistant-registry.js";
import type { BridgeDataProvider } from "./bridge-data-provider.js";
import type { BridgeRegistry } from "./bridge-registry.js";

export class BridgeEndpointManager extends Service {
  readonly root: Endpoint;
  private entityIds: string[] = [];
  private unsubscribe?: () => void;
  private failedDevices: FailedDevice[] = [];

  constructor(
    private readonly client: HomeAssistantClient,
    private readonly registry: BridgeRegistry,
    private readonly dataProvider: BridgeDataProvider,
    private readonly log: Logger,
  ) {
    super("BridgeEndpointManager");
    this.root = new AggregatorEndpoint("aggregator");
  }

  getFailedDevices(): ReadonlyArray<FailedDevice> {
    return [...this.failedDevices];
  }

  clearFailedDevices(): void {
    this.failedDevices = [];
  }

  override async dispose(): Promise<void> {
    this.stopObserving();
  }

  async startObserving() {
    this.stopObserving();

    if (!this.entityIds.length) {
      return;
    }

    this.unsubscribe = subscribeEntities(
      this.client.connection,
      (e) => this.updateStates(e),
      this.entityIds,
    );
  }

  stopObserving() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  async refreshDevices() {
    this.registry.refresh();

    const endpoints = this.root.parts.map((p) => p as EntityEndpoint);
    this.entityIds = this.registry.entityIds;

    // Clear failed devices list at start of refresh
    this.clearFailedDevices();

    // Determine which entities will be composed (if feature enabled)
    const composedEntityIds = new Set<string>();
    const sensorGroups = this.dataProvider.featureFlags?.autoComposeSensors
      ? groupSensorsByDevice(this.registry)
      : new Map();

    for (const group of sensorGroups.values()) {
      for (const entityId of group.entities.keys()) {
        composedEntityIds.add(entityId);
      }
    }

    const existingEndpoints: EntityEndpoint[] = [];
    for (const endpoint of endpoints) {
      if (!this.entityIds.includes(endpoint.entityId)) {
        try {
          await endpoint.delete();
        } catch (e) {
          this.log.warn(
            `Failed to delete endpoint ${endpoint.entityId}: ${e?.toString()}`,
          );
        }
      } else {
        existingEndpoints.push(endpoint);
      }
    }

    // Create composed sensor endpoints
    for (const group of sensorGroups.values()) {
      // Skip if any entity in the group already has an endpoint
      const groupEntityIds = [...group.entities.keys()];
      if (
        groupEntityIds.some((id) =>
          existingEndpoints.find((e) => e.entityId === id),
        )
      ) {
        continue;
      }

      try {
        const endpoint = ComposedSensorEndpoint.create(this.registry, group);
        if (endpoint) {
          await this.root.add(endpoint);
          this.log.debug(
            `Created composed sensor endpoint for device ${group.deviceId} with entities: ${groupEntityIds.join(", ")}`,
          );
          // Track all entity IDs for state subscription
          for (const entityId of endpoint.allEntityIds) {
            if (!this.entityIds.includes(entityId)) {
              this.entityIds.push(entityId);
            }
          }
        }
      } catch (e) {
        this.log.error(
          `Failed to create composed sensor for device ${group.deviceId}: ${e?.toString()}`,
        );
        this.failedDevices.push({
          entityId: groupEntityIds[0],
          error: `Composed sensor creation failed: ${e?.toString()}`,
          timestamp: Date.now(),
        });
      }
    }

    // Create individual endpoints for non-composed entities
    for (const entityId of this.entityIds) {
      if (composedEntityIds.has(entityId)) continue;

      let endpoint = existingEndpoints.find((e) => e.entityId === entityId);
      if (!endpoint) {
        try {
          endpoint = await LegacyEndpoint.create(this.registry, entityId);
        } catch (e) {
          if (e instanceof InvalidDeviceError) {
            this.log.warn(
              `Invalid device detected. Entity: ${entityId} Reason: ${(e as Error).message}`,
            );
            this.failedDevices.push({
              entityId,
              error: `Invalid device: ${(e as Error).message}`,
              timestamp: Date.now(),
            });
            continue;
          } else {
            this.log.error(
              `Failed to create device ${entityId}. Error: ${e?.toString()}`,
            );
            this.failedDevices.push({
              entityId,
              error: `Creation failed: ${e?.toString()}`,
              timestamp: Date.now(),
            });
            continue;
          }
        }

        if (endpoint) {
          try {
            await this.root.add(endpoint);
            this.log.debug(`Successfully added endpoint for ${entityId}`);
          } catch (e) {
            this.log.error(
              `Failed to add endpoint ${entityId} to aggregator: ${e?.toString()}`,
            );
            this.failedDevices.push({
              entityId,
              error: `Failed to add endpoint: ${e?.toString()}`,
              timestamp: Date.now(),
            });
          }
        }
      }
    }

    // Log summary of refresh operation
    const successCount = this.root.parts.size;
    const failedCount = this.failedDevices.length;
    if (failedCount > 0) {
      this.log.warn(
        `Device refresh completed: ${successCount} successful, ${failedCount} failed`,
      );
    } else {
      this.log.info(
        `Device refresh completed successfully: ${successCount} devices loaded`,
      );
    }

    if (this.unsubscribe) {
      this.startObserving();
    }
  }

  async updateStates(states: HomeAssistantStates) {
    const endpoints = this.root.parts.map((p) => p as EntityEndpoint);
    for (const endpoint of endpoints) {
      await endpoint.updateStates(states);
    }
  }
}
