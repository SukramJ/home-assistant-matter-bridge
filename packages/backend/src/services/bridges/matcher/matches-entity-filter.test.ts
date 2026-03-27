import {
  type HomeAssistantDeviceRegistry,
  type HomeAssistantEntityRegistry,
  type HomeAssistantEntityState,
  HomeAssistantMatcherType,
} from "@home-assistant-matter-bridge/common";
import { describe, expect, it } from "vitest";
import { testMatcher } from "./matches-entity-filter.js";

const registry: HomeAssistantEntityRegistry = {
  id: "id",
  device_id: "device4711",
  entity_id: "light.my_entity",
  categories: {},
  has_entity_name: true,
  original_name: "any",
  unique_id: "unique_id",
  entity_category: "diagnostic",
  platform: "hue",
  labels: ["test_label"],
};

const registryWithArea = { ...registry, area_id: "area_id" };

const deviceRegistry: HomeAssistantDeviceRegistry = {
  id: "device4711",
  area_id: "area_id",
  name: "Living Room Light",
  name_by_user: "My Custom Light",
};

const state: HomeAssistantEntityState = {
  entity_id: "light.my_entity",
  state: "on",
  last_changed: "2024-01-01T00:00:00Z",
  last_updated: "2024-01-01T00:00:00Z",
  attributes: {
    device_class: "temperature",
    friendly_name: "My Entity",
  },
  context: { id: "ctx" },
};

describe("matchEntityFilter.testMatcher", () => {
  it("should match the domain", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Domain,
          value: "light",
        },
        undefined,
        registry,
      ),
    ).toBeTruthy();
  });
  it("should not match the domain", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Domain,
          value: "switch",
        },
        undefined,
        registry,
      ),
    ).toBeFalsy();
  });

  it("should match the label", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Label,
          value: "test_label",
        },
        undefined,
        registry,
      ),
    ).toBeTruthy();
  });
  it("should not match the label", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Label,
          value: "other_label",
        },
        undefined,
        registry,
      ),
    ).toBeFalsy();
  });

  it("should match the platform", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Platform,
          value: "hue",
        },
        undefined,
        registry,
      ),
    ).toBeTruthy();
  });
  it("should not match the platform", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Platform,
          value: "not_hue",
        },
        undefined,
        registry,
      ),
    ).toBeFalsy();
  });

  it("should match the area", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Area,
          value: "area_id",
        },
        undefined,
        registryWithArea,
      ),
    ).toBeTruthy();
  });
  it("should not match the area", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Area,
          value: "another_area_id",
        },
        undefined,
        registryWithArea,
      ),
    ).toBeFalsy();
  });
  it("should match the device area when entity has no area", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Area,
          value: "area_id",
        },
        deviceRegistry,
        registry,
      ),
    ).toBeTruthy();
  });
  it("should not match the device area when entity has no area", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Area,
          value: "another_area_id",
        },
        deviceRegistry,
        registry,
      ),
    ).toBeFalsy();
  });
  it("should match when entity and device are in different areas", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Area,
          value: "area_id",
        },
        deviceRegistry,
        registryWithArea,
      ),
    ).toBeTruthy();
  });
  it("should not match when entity and device are in different areas", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Area,
          value: "another_area_id",
        },
        deviceRegistry,
        registryWithArea,
      ),
    ).toBeFalsy();
  });
  it("should match the entity category", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.EntityCategory,
          value: "diagnostic",
        },
        undefined,
        registry,
      ),
    ).toBeTruthy();
  });
  it("should not match the entity category", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.EntityCategory,
          value: "configuration",
        },
        undefined,
        registry,
      ),
    ).toBeFalsy();
  });

  it("should match the pattern", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Pattern,
          value: "light.my_en*t*",
        },
        undefined,
        registry,
      ),
    ).toBeTruthy();
  });
  it("should not match the pattern", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Pattern,
          value: "light.my_en*z*",
        },
        undefined,
        registry,
      ),
    ).toBeFalsy();
  });

  it("should match the regex", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Regex,
          value: "^light\\.my_.*$",
        },
        undefined,
        registry,
      ),
    ).toBeTruthy();
  });
  it("should not match the regex", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Regex,
          value: "^switch\\..*$",
        },
        undefined,
        registry,
      ),
    ).toBeFalsy();
  });
  it("should handle invalid regex gracefully", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.Regex,
          value: "[invalid",
        },
        undefined,
        registry,
      ),
    ).toBeFalsy();
  });

  it("should match the device name (name_by_user)", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.DeviceName,
          value: "Custom Light",
        },
        deviceRegistry,
        registry,
      ),
    ).toBeTruthy();
  });
  it("should match the device name case-insensitively", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.DeviceName,
          value: "custom light",
        },
        deviceRegistry,
        registry,
      ),
    ).toBeTruthy();
  });
  it("should fallback to device name when no name_by_user", () => {
    const deviceWithoutUserName: HomeAssistantDeviceRegistry = {
      id: "device4711",
      area_id: "area_id",
      name: "Living Room Light",
    };
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.DeviceName,
          value: "Living Room",
        },
        deviceWithoutUserName,
        registry,
      ),
    ).toBeTruthy();
  });
  it("should not match the device name", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.DeviceName,
          value: "Kitchen",
        },
        deviceRegistry,
        registry,
      ),
    ).toBeFalsy();
  });
  it("should not match device name when no device", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.DeviceName,
          value: "anything",
        },
        undefined,
        registry,
      ),
    ).toBeFalsy();
  });

  it("should match the device class", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.DeviceClass,
          value: "temperature",
        },
        undefined,
        registry,
        state,
      ),
    ).toBeTruthy();
  });
  it("should not match the device class", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.DeviceClass,
          value: "humidity",
        },
        undefined,
        registry,
        state,
      ),
    ).toBeFalsy();
  });
  it("should not match device class when no state", () => {
    expect(
      testMatcher(
        {
          type: HomeAssistantMatcherType.DeviceClass,
          value: "temperature",
        },
        undefined,
        registry,
      ),
    ).toBeFalsy();
  });
});
