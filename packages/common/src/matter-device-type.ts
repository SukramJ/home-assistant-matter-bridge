export enum MatterDeviceType {
  OnOffLight = "onOffLight",
  DimmableLight = "dimmableLight",
  ColorTemperatureLight = "colorTemperatureLight",
  ExtendedColorLight = "extendedColorLight",
  OnOffPlugInUnit = "onOffPlugInUnit",
  DimmablePlugInUnit = "dimmablePlugInUnit",
  DoorLock = "doorLock",
  WindowCovering = "windowCovering",
  Thermostat = "thermostat",
  Fan = "fan",
  ContactSensor = "contactSensor",
  OccupancySensor = "occupancySensor",
  TemperatureSensor = "temperatureSensor",
  HumiditySensor = "humiditySensor",
  LightSensor = "lightSensor",
  PressureSensor = "pressureSensor",
  Speaker = "speaker",
  ModeSelect = "modeSelect",
  GenericSwitch = "genericSwitch",
  WaterValve = "waterValve",
}

export interface EntityOverride {
  readonly deviceType: MatterDeviceType;
}
