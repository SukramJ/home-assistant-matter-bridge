import type { HomeAssistantEntityState } from "@home-assistant-matter-bridge/common";
import type { Agent, EndpointType } from "@matter/main";
import { Thermostat } from "@matter/main/clusters";
import { ThermostatDevice } from "@matter/main/devices";
import { HomeAssistantConfig } from "../../../../services/home-assistant/home-assistant-config.js";
import { Temperature } from "../../../../utils/converters/temperature.js";
import { BasicInformationServer } from "../../../behaviors/basic-information-server.js";
import type { HomeAssistantEntityBehavior } from "../../../behaviors/home-assistant-entity-behavior.js";
import { HomeAssistantEntityBehavior as HomeAssistantEntityBehaviorClass } from "../../../behaviors/home-assistant-entity-behavior.js";
import { IdentifyServer } from "../../../behaviors/identify-server.js";
import {
  ThermostatServer,
  type ThermostatServerConfig,
} from "../../../behaviors/thermostat-server.js";

interface WaterHeaterAttributes {
  min_temp?: number | string | null;
  max_temp?: number | string | null;
  current_temperature?: number | string | null;
  temperature?: number | string | null;
  operation_list?: string[];
  supported_features?: number;
}

const getUnit = (agent: Agent) =>
  agent.env.get(HomeAssistantConfig).unitSystem.temperature;

const attrs = (entity: HomeAssistantEntityState) =>
  entity.attributes as WaterHeaterAttributes;

const getTemp = (
  agent: Agent,
  entity: HomeAssistantEntityState,
  attributeName: keyof WaterHeaterAttributes,
) => {
  const temperature = attrs(entity)[attributeName] as
    | string
    | number
    | null
    | undefined;
  const unit = getUnit(agent);
  if (temperature != null) {
    return Temperature.withUnit(+temperature, unit);
  }
};

const operationToSystemMode: Record<string, Thermostat.SystemMode> = {
  off: Thermostat.SystemMode.Off,
  eco: Thermostat.SystemMode.Heat,
  electric: Thermostat.SystemMode.Heat,
  gas: Thermostat.SystemMode.Heat,
  heat_pump: Thermostat.SystemMode.Heat,
  high_demand: Thermostat.SystemMode.Heat,
  performance: Thermostat.SystemMode.Heat,
};

const config: ThermostatServerConfig = {
  supportsTemperatureRange: () => false,
  getMinTemperature: (entity, agent) => getTemp(agent, entity, "min_temp"),
  getMaxTemperature: (entity, agent) => getTemp(agent, entity, "max_temp"),
  getCurrentTemperature: (entity, agent) =>
    getTemp(agent, entity, "current_temperature"),
  getTargetHeatingTemperature: (entity, agent) =>
    getTemp(agent, entity, "temperature"),
  getTargetCoolingTemperature: (entity, agent) =>
    getTemp(agent, entity, "temperature"),
  getSystemMode: (entity) =>
    operationToSystemMode[entity.state] ?? Thermostat.SystemMode.Heat,
  getRunningMode: (entity) => {
    if (entity.state === "off" || entity.state === "idle") {
      return Thermostat.ThermostatRunningMode.Off;
    }
    return Thermostat.ThermostatRunningMode.Heat;
  },
  setSystemMode: (systemMode) => ({
    action: "water_heater.set_operation_mode",
    data: {
      operation_mode:
        systemMode === Thermostat.SystemMode.Off ? "off" : "electric",
    },
  }),
  setTargetTemperature: (value, agent) => ({
    action: "water_heater.set_temperature",
    data: {
      temperature: value.toUnit(getUnit(agent)),
    },
  }),
  setTargetTemperatureRange: ({ low }, agent) => ({
    action: "water_heater.set_temperature",
    data: {
      temperature: low.toUnit(getUnit(agent)),
    },
  }),
};

const WaterHeaterThermostatServer = ThermostatServer(config);

const WaterHeaterDeviceType = ThermostatDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehaviorClass,
  WaterHeaterThermostatServer.with("Heating"),
);

export function WaterHeaterDevice(
  homeAssistantEntity: HomeAssistantEntityBehavior.State,
): EndpointType {
  return WaterHeaterDeviceType.set({ homeAssistantEntity });
}
