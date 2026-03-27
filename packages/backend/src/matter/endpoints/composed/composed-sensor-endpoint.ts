import type {
  HomeAssistantEntityInformation,
  HomeAssistantEntityState,
  SensorDeviceAttributes,
} from "@home-assistant-matter-bridge/common";
import { SensorDeviceClass } from "@home-assistant-matter-bridge/common";
import {
  DestroyedDependencyError,
  TransactionDestroyedError,
} from "@matter/general";
import type { EndpointType, MutableEndpoint } from "@matter/main";
import {
  IlluminanceMeasurementServer,
  RelativeHumidityMeasurementServer,
  TemperatureMeasurementServer,
} from "@matter/main/behaviors";
import { PressureMeasurementServer } from "@matter/main/behaviors/pressure-measurement";
import { TemperatureSensorDevice } from "@matter/main/devices";
import debounce from "debounce";
import type { BridgeRegistry } from "../../../services/bridges/bridge-registry.js";
import { HomeAssistantConfig } from "../../../services/home-assistant/home-assistant-config.js";
import type { HomeAssistantStates } from "../../../services/home-assistant/home-assistant-registry.js";
import { applyPatchState } from "../../../utils/apply-patch-state.js";
import { Temperature } from "../../../utils/converters/temperature.js";
import { BasicInformationServer } from "../../behaviors/basic-information-server.js";
import { HomeAssistantEntityBehavior } from "../../behaviors/home-assistant-entity-behavior.js";
import { IdentifyServer } from "../../behaviors/identify-server.js";
import { EntityEndpoint } from "../entity-endpoint.js";

const composableDeviceClasses = new Set([
  SensorDeviceClass.temperature,
  SensorDeviceClass.humidity,
  SensorDeviceClass.illuminance,
  SensorDeviceClass.pressure,
  SensorDeviceClass.atmospheric_pressure,
]);

export interface SensorGroup {
  deviceId: string;
  entities: Map<string, SensorDeviceClass>;
}

export function isComposableSensor(
  entityId: string,
  state: HomeAssistantEntityState | undefined,
): boolean {
  if (!entityId.startsWith("sensor.")) return false;
  if (!state) return false;
  const deviceClass = (state.attributes as SensorDeviceAttributes)
    ?.device_class;
  return !!deviceClass && composableDeviceClasses.has(deviceClass);
}

export function groupSensorsByDevice(
  registry: BridgeRegistry,
): Map<string, SensorGroup> {
  const groups = new Map<string, SensorGroup>();

  for (const entityId of registry.entityIds) {
    const state = registry.initialState(entityId);
    if (!isComposableSensor(entityId, state)) continue;

    const entity = registry.entity(entityId);
    const deviceId = entity.device_id;
    const deviceClass = (state.attributes as SensorDeviceAttributes)
      .device_class as SensorDeviceClass;

    let group = groups.get(deviceId);
    if (!group) {
      group = { deviceId, entities: new Map() };
      groups.set(deviceId, group);
    }
    group.entities.set(entityId, deviceClass);
  }

  // Only return groups with 2+ sensors
  for (const [deviceId, group] of groups) {
    if (group.entities.size < 2) {
      groups.delete(deviceId);
    }
  }

  return groups;
}

export function buildComposedDeviceType(
  deviceClasses: Set<SensorDeviceClass>,
): MutableEndpoint {
  // Use plain Matter.js measurement servers (not the HA-coupled ones)
  // since we manage updates directly in the composed endpoint
  let device: MutableEndpoint = TemperatureSensorDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HomeAssistantEntityBehavior,
  );

  if (deviceClasses.has(SensorDeviceClass.temperature)) {
    device = device.with(TemperatureMeasurementServer);
  }
  if (deviceClasses.has(SensorDeviceClass.humidity)) {
    device = device.with(RelativeHumidityMeasurementServer);
  }
  if (
    deviceClasses.has(SensorDeviceClass.pressure) ||
    deviceClasses.has(SensorDeviceClass.atmospheric_pressure)
  ) {
    device = device.with(PressureMeasurementServer);
  }
  if (deviceClasses.has(SensorDeviceClass.illuminance)) {
    device = device.with(IlluminanceMeasurementServer);
  }

  return device;
}

// Priority order for picking the primary entity
const priorityOrder: SensorDeviceClass[] = [
  SensorDeviceClass.temperature,
  SensorDeviceClass.humidity,
  SensorDeviceClass.pressure,
  SensorDeviceClass.atmospheric_pressure,
  SensorDeviceClass.illuminance,
];

export class ComposedSensorEndpoint extends EntityEndpoint {
  private readonly trackedEntities: Map<string, SensorDeviceClass>;
  private lastStates: Record<string, HomeAssistantEntityState> = {};
  private readonly flushUpdate: ReturnType<typeof debounce>;

  static create(
    registry: BridgeRegistry,
    group: SensorGroup,
  ): ComposedSensorEndpoint | undefined {
    // Pick primary entity by priority
    let primaryEntityId: string | undefined;
    for (const dc of priorityOrder) {
      for (const [entityId, deviceClass] of group.entities) {
        if (deviceClass === dc) {
          primaryEntityId = entityId;
          break;
        }
      }
      if (primaryEntityId) break;
    }

    if (!primaryEntityId) return undefined;

    const deviceClasses = new Set(group.entities.values());
    const deviceType = buildComposedDeviceType(deviceClasses);

    const deviceRegistry = registry.deviceOf(primaryEntityId);
    const state = registry.initialState(primaryEntityId);
    const entity = registry.entity(primaryEntityId);

    const payload: HomeAssistantEntityInformation = {
      entity_id: primaryEntityId,
      state,
      registry: entity,
      deviceRegistry,
    };

    const configuredType = deviceType.set({
      homeAssistantEntity: { entity: payload },
    }) as EndpointType;

    return new ComposedSensorEndpoint(
      configuredType,
      primaryEntityId,
      group.entities,
    );
  }

  private constructor(
    type: EndpointType,
    primaryEntityId: string,
    trackedEntities: Map<string, SensorDeviceClass>,
  ) {
    super(type, primaryEntityId);
    this.trackedEntities = trackedEntities;
    this.flushUpdate = debounce(this.flushPendingUpdate.bind(this), 50);
  }

  get allEntityIds(): string[] {
    return [...this.trackedEntities.keys()];
  }

  override async delete() {
    this.flushUpdate.clear();
    await super.delete();
  }

  async updateStates(states: HomeAssistantStates) {
    let hasChange = false;
    for (const entityId of this.allEntityIds) {
      const state = states[entityId];
      if (!state) continue;
      if (
        JSON.stringify(state) !==
        JSON.stringify(this.lastStates[entityId] ?? {})
      ) {
        this.lastStates[entityId] = state;
        hasChange = true;
      }
    }

    if (hasChange) {
      this.flushUpdate();
    }
  }

  private async flushPendingUpdate() {
    try {
      await this.construction.ready;
    } catch {
      return;
    }

    try {
      // Update primary entity info
      const primaryState = this.lastStates[this.entityId];
      if (primaryState) {
        const current = this.stateOf(HomeAssistantEntityBehavior).entity;
        await this.setStateOf(HomeAssistantEntityBehavior, {
          entity: { ...current, state: primaryState },
        });
      }

      // Update each measurement cluster directly from its entity's state
      for (const [entityId, deviceClass] of this.trackedEntities) {
        const state = this.lastStates[entityId];
        if (!state) continue;
        const value =
          state.state == null || Number.isNaN(+state.state)
            ? null
            : +state.state;

        this.updateMeasurement(deviceClass, value, state);
      }
    } catch (error) {
      if (
        error instanceof TransactionDestroyedError ||
        error instanceof DestroyedDependencyError
      ) {
        return;
      }
      throw error;
    }
  }

  private updateMeasurement(
    deviceClass: SensorDeviceClass,
    value: number | null,
    state: HomeAssistantEntityState,
  ) {
    switch (deviceClass) {
      case SensorDeviceClass.temperature: {
        if (value == null) {
          applyPatchState(this.stateOf(TemperatureMeasurementServer), {
            measuredValue: null,
          });
          return;
        }
        const fallbackUnit =
          this.env.get(HomeAssistantConfig).unitSystem.temperature;
        const unit =
          (state.attributes as SensorDeviceAttributes).unit_of_measurement ??
          fallbackUnit;
        const temp = Temperature.withUnit(value, unit);
        applyPatchState(this.stateOf(TemperatureMeasurementServer), {
          measuredValue: temp ? temp.celsius(true) : null,
        });
        break;
      }
      case SensorDeviceClass.humidity:
        applyPatchState(this.stateOf(RelativeHumidityMeasurementServer), {
          measuredValue: value != null ? value * 100 : null,
        });
        break;
      case SensorDeviceClass.pressure:
      case SensorDeviceClass.atmospheric_pressure:
        applyPatchState(this.stateOf(PressureMeasurementServer), {
          measuredValue: value != null ? Math.round(value) : null,
        });
        break;
      case SensorDeviceClass.illuminance: {
        let measuredValue: number | null = null;
        if (value != null && value >= 1) {
          measuredValue = Math.min(
            0xfffe,
            Math.max(1, Math.round(10000 * Math.log10(value) + 1)),
          );
        } else if (value != null) {
          measuredValue = 0;
        }
        applyPatchState(this.stateOf(IlluminanceMeasurementServer), {
          measuredValue,
        });
        break;
      }
    }
  }
}
