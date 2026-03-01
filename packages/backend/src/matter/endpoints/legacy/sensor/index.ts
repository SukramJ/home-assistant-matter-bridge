import {
  type SensorDeviceAttributes,
  SensorDeviceClass,
} from "@home-assistant-matter-bridge/common";
import type { EndpointType } from "@matter/main";
import type { HomeAssistantEntityBehavior } from "../../../behaviors/home-assistant-entity-behavior.js";
import { Co2SensorType } from "./devices/co2-sensor.js";
import { EnergySensorType } from "./devices/energy-sensor.js";
import { HumiditySensorType } from "./devices/humidity-sensor.js";
import { IlluminanceSensorType } from "./devices/illuminance-sensor.js";
import { Pm10SensorType } from "./devices/pm10-sensor.js";
import { Pm25SensorType } from "./devices/pm25-sensor.js";
import { PowerSensorType } from "./devices/power-sensor.js";
import { PressureSensorType } from "./devices/pressure-sensor.js";
import { TemperatureSensorType } from "./devices/temperature-sensor.js";

export function SensorDevice(
  homeAssistantEntity: HomeAssistantEntityBehavior.State,
): EndpointType | undefined {
  const attributes = homeAssistantEntity.entity.state
    .attributes as SensorDeviceAttributes;
  const deviceClass = attributes.device_class;

  if (deviceClass === SensorDeviceClass.temperature) {
    return TemperatureSensorType.set({ homeAssistantEntity });
  }
  if (deviceClass === SensorDeviceClass.humidity) {
    return HumiditySensorType.set({ homeAssistantEntity });
  }
  if (deviceClass === SensorDeviceClass.illuminance) {
    return IlluminanceSensorType.set({ homeAssistantEntity });
  }
  if (
    deviceClass === SensorDeviceClass.pressure ||
    deviceClass === SensorDeviceClass.atmospheric_pressure
  ) {
    return PressureSensorType.set({ homeAssistantEntity });
  }
  if (deviceClass === SensorDeviceClass.carbon_dioxide) {
    return Co2SensorType.set({ homeAssistantEntity });
  }
  if (deviceClass === SensorDeviceClass.power) {
    return PowerSensorType.set({ homeAssistantEntity });
  }
  if (deviceClass === SensorDeviceClass.energy) {
    return EnergySensorType.set({ homeAssistantEntity });
  }
  if (deviceClass === SensorDeviceClass.pm25) {
    return Pm25SensorType.set({ homeAssistantEntity });
  }
  if (deviceClass === SensorDeviceClass.pm10) {
    return Pm10SensorType.set({ homeAssistantEntity });
  }
  return undefined;
}
