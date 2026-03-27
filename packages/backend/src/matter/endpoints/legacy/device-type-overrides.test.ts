import {
  type HomeAssistantEntityInformation,
  type HomeAssistantEntityRegistry,
  type HomeAssistantEntityState,
  MatterDeviceType,
} from "@home-assistant-matter-bridge/common";
import { Endpoint } from "@matter/main";
import { describe, expect, it } from "vitest";
import { createOverrideEndpointType } from "./device-type-overrides.js";

function createEntity(entityId: string): {
  entity: HomeAssistantEntityInformation;
} {
  const registry: HomeAssistantEntityRegistry = {
    device_id: `${entityId}_device`,
    categories: {},
    entity_id: entityId,
    has_entity_name: false,
    id: entityId,
    original_name: entityId,
    platform: "test",
    unique_id: entityId,
  };
  const state: HomeAssistantEntityState = {
    entity_id: entityId,
    state: "on",
    context: { id: "context" },
    last_changed: "2024-01-01T00:00:00Z",
    last_updated: "2024-01-01T00:00:00Z",
    attributes: {},
  };
  return { entity: { entity_id: entityId, registry, state } };
}

describe("createOverrideEndpointType", () => {
  const testEntity = createEntity("switch.test");

  it.each(
    Object.values(MatterDeviceType),
  )("should create endpoint for device type: %s", (deviceType) => {
    const result = createOverrideEndpointType(deviceType, testEntity);
    expect(result).toBeDefined();
  });

  it("should return undefined for unknown device type", () => {
    const result = createOverrideEndpointType(
      "unknown" as MatterDeviceType,
      testEntity,
    );
    expect(result).toBeUndefined();
  });

  it("should create a valid Matter endpoint from override", () => {
    const endpointType = createOverrideEndpointType(
      MatterDeviceType.OnOffLight,
      testEntity,
    );
    expect(endpointType).toBeDefined();
    const endpoint = new Endpoint(endpointType!);
    expect(endpoint).toBeDefined();
  });

  it("should create sensor device types", () => {
    const sensorTypes = [
      MatterDeviceType.TemperatureSensor,
      MatterDeviceType.HumiditySensor,
      MatterDeviceType.LightSensor,
      MatterDeviceType.PressureSensor,
      MatterDeviceType.ContactSensor,
      MatterDeviceType.OccupancySensor,
    ];

    for (const deviceType of sensorTypes) {
      const result = createOverrideEndpointType(deviceType, testEntity);
      expect(result).toBeDefined();
    }
  });

  it("should create controllable device types", () => {
    const controllableTypes = [
      MatterDeviceType.OnOffPlugInUnit,
      MatterDeviceType.DimmablePlugInUnit,
      MatterDeviceType.DoorLock,
      MatterDeviceType.Fan,
      MatterDeviceType.Speaker,
    ];

    for (const deviceType of controllableTypes) {
      const result = createOverrideEndpointType(deviceType, testEntity);
      expect(result).toBeDefined();
    }
  });
});
