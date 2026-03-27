import { MatterDeviceType } from "@home-assistant-matter-bridge/common";
import type { EndpointType } from "@matter/main";
import {
  ColorTemperatureLightDevice,
  ContactSensorDevice,
  DimmableLightDevice,
  DimmablePlugInUnitDevice,
  DoorLockDevice,
  ExtendedColorLightDevice,
  GenericSwitchDevice,
  HumiditySensorDevice,
  LightSensorDevice,
  FanDevice as MatterFanDevice,
  OccupancySensorDevice,
  OnOffLightDevice,
  OnOffPlugInUnitDevice,
  PressureSensorDevice,
  SpeakerDevice,
  TemperatureSensorDevice,
  ThermostatDevice,
  WaterValveDevice,
  WindowCoveringDevice,
} from "@matter/main/devices";
import { ModeSelectDevice } from "@matter/main/devices/mode-select";
import { BasicInformationServer } from "../../behaviors/basic-information-server.js";
import type { HomeAssistantEntityBehavior } from "../../behaviors/home-assistant-entity-behavior.js";
import { HomeAssistantEntityBehavior as HAEntityBehavior } from "../../behaviors/home-assistant-entity-behavior.js";
import { IdentifyServer } from "../../behaviors/identify-server.js";
import { OnOffServer } from "../../behaviors/on-off-server.js";

const GenericOnOffServer = OnOffServer().with("Lighting");

const deviceTypes = {
  [MatterDeviceType.OnOffLight]: OnOffLightDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
    GenericOnOffServer,
  ),
  [MatterDeviceType.DimmableLight]: DimmableLightDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
    GenericOnOffServer,
  ),
  [MatterDeviceType.ColorTemperatureLight]: ColorTemperatureLightDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
    GenericOnOffServer,
  ),
  [MatterDeviceType.ExtendedColorLight]: ExtendedColorLightDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
    GenericOnOffServer,
  ),
  [MatterDeviceType.OnOffPlugInUnit]: OnOffPlugInUnitDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
    GenericOnOffServer,
  ),
  [MatterDeviceType.DimmablePlugInUnit]: DimmablePlugInUnitDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
    GenericOnOffServer,
  ),
  [MatterDeviceType.DoorLock]: DoorLockDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
  ),
  [MatterDeviceType.WindowCovering]: WindowCoveringDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
  ),
  [MatterDeviceType.Thermostat]: ThermostatDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
  ),
  [MatterDeviceType.Fan]: MatterFanDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
    GenericOnOffServer,
  ),
  [MatterDeviceType.ContactSensor]: ContactSensorDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
  ),
  [MatterDeviceType.OccupancySensor]: OccupancySensorDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
  ),
  [MatterDeviceType.TemperatureSensor]: TemperatureSensorDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
  ),
  [MatterDeviceType.HumiditySensor]: HumiditySensorDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
  ),
  [MatterDeviceType.LightSensor]: LightSensorDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
  ),
  [MatterDeviceType.PressureSensor]: PressureSensorDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
  ),
  [MatterDeviceType.Speaker]: SpeakerDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
  ),
  [MatterDeviceType.ModeSelect]: ModeSelectDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
  ),
  [MatterDeviceType.GenericSwitch]: GenericSwitchDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
  ),
  [MatterDeviceType.WaterValve]: WaterValveDevice.with(
    BasicInformationServer,
    IdentifyServer,
    HAEntityBehavior,
  ),
};

export function createOverrideEndpointType(
  deviceType: MatterDeviceType,
  homeAssistantEntity: HomeAssistantEntityBehavior.State,
): EndpointType | undefined {
  const endpointType = deviceTypes[deviceType];
  if (!endpointType) {
    return undefined;
  }
  return endpointType.set({ homeAssistantEntity });
}
