import {
  type HomeAssistantEntityRegistry,
  type HomeAssistantEntityState,
  SensorDeviceClass,
} from "@home-assistant-matter-bridge/common";
import { describe, expect, it } from "vitest";
import type { BridgeRegistry } from "../../../services/bridges/bridge-registry.js";
import {
  buildComposedDeviceType,
  groupSensorsByDevice,
  isComposableSensor,
} from "./composed-sensor-endpoint.js";

function createState(
  entityId: string,
  state: string,
  deviceClass?: string,
): HomeAssistantEntityState {
  return {
    entity_id: entityId,
    state,
    last_changed: "2024-01-01T00:00:00Z",
    last_updated: "2024-01-01T00:00:00Z",
    attributes: { device_class: deviceClass },
    context: { id: "ctx" },
  };
}

describe("isComposableSensor", () => {
  it("should return true for temperature sensor", () => {
    const state = createState("sensor.temp", "22.5", "temperature");
    expect(isComposableSensor("sensor.temp", state)).toBe(true);
  });

  it("should return true for humidity sensor", () => {
    const state = createState("sensor.hum", "65", "humidity");
    expect(isComposableSensor("sensor.hum", state)).toBe(true);
  });

  it("should return true for pressure sensor", () => {
    const state = createState("sensor.press", "1013", "pressure");
    expect(isComposableSensor("sensor.press", state)).toBe(true);
  });

  it("should return true for atmospheric_pressure sensor", () => {
    const state = createState("sensor.atm", "1013", "atmospheric_pressure");
    expect(isComposableSensor("sensor.atm", state)).toBe(true);
  });

  it("should return true for illuminance sensor", () => {
    const state = createState("sensor.lux", "500", "illuminance");
    expect(isComposableSensor("sensor.lux", state)).toBe(true);
  });

  it("should return false for non-sensor entity", () => {
    const state = createState("light.test", "on", "temperature");
    expect(isComposableSensor("light.test", state)).toBe(false);
  });

  it("should return false for unsupported device class", () => {
    const state = createState("sensor.power", "150", "power");
    expect(isComposableSensor("sensor.power", state)).toBe(false);
  });

  it("should return false for sensor without device class", () => {
    const state = createState("sensor.test", "42");
    expect(isComposableSensor("sensor.test", state)).toBe(false);
  });

  it("should return false when state is undefined", () => {
    expect(isComposableSensor("sensor.test", undefined)).toBe(false);
  });
});

describe("groupSensorsByDevice", () => {
  function createMockRegistry(
    entities: Array<{
      entityId: string;
      deviceId: string;
      deviceClass: string;
      state: string;
    }>,
  ): BridgeRegistry {
    const entityIds = entities.map((e) => e.entityId);
    const entityMap: Record<string, HomeAssistantEntityRegistry> = {};
    const stateMap: Record<string, HomeAssistantEntityState> = {};

    for (const e of entities) {
      entityMap[e.entityId] = {
        entity_id: e.entityId,
        device_id: e.deviceId,
      } as HomeAssistantEntityRegistry;
      stateMap[e.entityId] = createState(e.entityId, e.state, e.deviceClass);
    }

    return {
      entityIds,
      entity: (id: string) => entityMap[id],
      initialState: (id: string) => stateMap[id],
    } as unknown as BridgeRegistry;
  }

  it("should group sensors by device_id", () => {
    const registry = createMockRegistry([
      {
        entityId: "sensor.temp",
        deviceId: "dev1",
        deviceClass: "temperature",
        state: "22",
      },
      {
        entityId: "sensor.hum",
        deviceId: "dev1",
        deviceClass: "humidity",
        state: "65",
      },
    ]);

    const groups = groupSensorsByDevice(registry);
    expect(groups.size).toBe(1);

    const group = groups.get("dev1")!;
    expect(group.entities.size).toBe(2);
    expect(group.entities.get("sensor.temp")).toBe(
      SensorDeviceClass.temperature,
    );
    expect(group.entities.get("sensor.hum")).toBe(SensorDeviceClass.humidity);
  });

  it("should exclude groups with only one sensor", () => {
    const registry = createMockRegistry([
      {
        entityId: "sensor.temp",
        deviceId: "dev1",
        deviceClass: "temperature",
        state: "22",
      },
      {
        entityId: "sensor.hum",
        deviceId: "dev2",
        deviceClass: "humidity",
        state: "65",
      },
    ]);

    const groups = groupSensorsByDevice(registry);
    expect(groups.size).toBe(0);
  });

  it("should handle multiple groups", () => {
    const registry = createMockRegistry([
      {
        entityId: "sensor.temp1",
        deviceId: "dev1",
        deviceClass: "temperature",
        state: "22",
      },
      {
        entityId: "sensor.hum1",
        deviceId: "dev1",
        deviceClass: "humidity",
        state: "65",
      },
      {
        entityId: "sensor.temp2",
        deviceId: "dev2",
        deviceClass: "temperature",
        state: "20",
      },
      {
        entityId: "sensor.press2",
        deviceId: "dev2",
        deviceClass: "pressure",
        state: "1013",
      },
    ]);

    const groups = groupSensorsByDevice(registry);
    expect(groups.size).toBe(2);
    expect(groups.get("dev1")!.entities.size).toBe(2);
    expect(groups.get("dev2")!.entities.size).toBe(2);
  });

  it("should ignore non-composable sensors", () => {
    const registry = createMockRegistry([
      {
        entityId: "sensor.temp",
        deviceId: "dev1",
        deviceClass: "temperature",
        state: "22",
      },
      {
        entityId: "sensor.power",
        deviceId: "dev1",
        deviceClass: "power",
        state: "150",
      },
    ]);

    const groups = groupSensorsByDevice(registry);
    expect(groups.size).toBe(0);
  });

  it("should handle three sensors on same device", () => {
    const registry = createMockRegistry([
      {
        entityId: "sensor.temp",
        deviceId: "dev1",
        deviceClass: "temperature",
        state: "22",
      },
      {
        entityId: "sensor.hum",
        deviceId: "dev1",
        deviceClass: "humidity",
        state: "65",
      },
      {
        entityId: "sensor.press",
        deviceId: "dev1",
        deviceClass: "pressure",
        state: "1013",
      },
    ]);

    const groups = groupSensorsByDevice(registry);
    expect(groups.size).toBe(1);
    expect(groups.get("dev1")!.entities.size).toBe(3);
  });
});

describe("buildComposedDeviceType", () => {
  it("should include temperature measurement for temperature sensor", () => {
    const deviceClasses = new Set([SensorDeviceClass.temperature]);
    const device = buildComposedDeviceType(deviceClasses);
    expect(device).toBeDefined();
  });

  it("should include humidity measurement for humidity sensor", () => {
    const deviceClasses = new Set([SensorDeviceClass.humidity]);
    const device = buildComposedDeviceType(deviceClasses);
    expect(device).toBeDefined();
  });

  it("should include pressure measurement for pressure sensor", () => {
    const deviceClasses = new Set([SensorDeviceClass.pressure]);
    const device = buildComposedDeviceType(deviceClasses);
    expect(device).toBeDefined();
  });

  it("should include pressure for atmospheric_pressure", () => {
    const deviceClasses = new Set([SensorDeviceClass.atmospheric_pressure]);
    const device = buildComposedDeviceType(deviceClasses);
    expect(device).toBeDefined();
  });

  it("should include illuminance measurement for illuminance sensor", () => {
    const deviceClasses = new Set([SensorDeviceClass.illuminance]);
    const device = buildComposedDeviceType(deviceClasses);
    expect(device).toBeDefined();
  });

  it("should combine multiple device classes", () => {
    const deviceClasses = new Set([
      SensorDeviceClass.temperature,
      SensorDeviceClass.humidity,
      SensorDeviceClass.pressure,
      SensorDeviceClass.illuminance,
    ]);
    const device = buildComposedDeviceType(deviceClasses);
    expect(device).toBeDefined();
  });
});
