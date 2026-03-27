import type {
  HomeAssistantDomain,
  HomeAssistantEntityInformation,
} from "@home-assistant-matter-bridge/common";
import type { EndpointType, MutableEndpoint } from "@matter/main";
import type { HomeAssistantEntityBehavior } from "../../behaviors/home-assistant-entity-behavior.js";
import {
  type PowerSourceConfig,
  PowerSourceServer,
} from "../../behaviors/power-source-server.js";
import { AlarmControlPanelDevice } from "./alarm-control-panel/index.js";
import { AutomationDevice } from "./automation/index.js";
import { BinarySensorDevice } from "./binary-sensor/index.js";
import { ButtonDevice } from "./button/index.js";
import { ClimateDevice } from "./climate/index.js";
import { CoverDevice } from "./cover/index.js";
import { EventDevice } from "./event/index.js";
import { FanDevice } from "./fan/index.js";
import { HumidifierDevice } from "./humidifier/index.js";
import { InputButtonDevice } from "./input-button/index.js";
import { LightDevice } from "./light/index.js";
import { LockDevice } from "./lock/index.js";
import { MediaPlayerDevice } from "./media-player/index.js";
import { RemoteDevice } from "./remote/index.js";
import { SceneDevice } from "./scene/index.js";
import { ScriptDevice } from "./script/index.js";
import { SelectDevice } from "./select/index.js";
import { SensorDevice } from "./sensor/index.js";
import { SwitchDevice } from "./switch/index.js";
import { VacuumDevice } from "./vacuum/index.js";
import { ValveDevice } from "./valve/index.js";
import { WaterHeaterDevice } from "./water-heater/index.js";

/**
 * @deprecated
 */
export function createLegacyEndpointType(
  entity: HomeAssistantEntityInformation,
): EndpointType | undefined {
  const domain = entity.entity_id.split(".")[0] as HomeAssistantDomain;
  const factory = deviceCtrs[domain];
  if (!factory) {
    return undefined;
  }
  const endpointType = factory({ entity });
  if (!endpointType) {
    return undefined;
  }
  if (hasBattery(entity)) {
    const config: PowerSourceConfig = { getBatteryPercent };
    return (endpointType as MutableEndpoint).with(PowerSourceServer(config));
  }
  return endpointType;
}

function getBatteryPercent(
  entity: HomeAssistantEntityInformation,
): number | null {
  const attrs = entity.state.attributes as Record<string, unknown>;
  const battery = attrs.battery ?? attrs.battery_level;
  if (typeof battery === "number") {
    return battery;
  }
  if (typeof battery === "string") {
    const parsed = Number.parseFloat(battery);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function hasBattery(entity: HomeAssistantEntityInformation): boolean {
  const attrs = entity.state.attributes as Record<string, unknown>;
  return attrs.battery != null || attrs.battery_level != null;
}

const deviceCtrs: Record<
  HomeAssistantDomain,
  (homeAssistant: HomeAssistantEntityBehavior.State) => EndpointType | undefined
> = {
  alarm_control_panel: AlarmControlPanelDevice,
  light: LightDevice,
  switch: SwitchDevice,
  lock: LockDevice,
  fan: FanDevice,
  binary_sensor: BinarySensorDevice,
  sensor: SensorDevice,
  cover: CoverDevice,
  climate: ClimateDevice,
  event: EventDevice,
  input_boolean: SwitchDevice,
  input_button: InputButtonDevice,
  input_select: SelectDevice,
  button: ButtonDevice,
  automation: AutomationDevice,
  remote: RemoteDevice,
  script: ScriptDevice,
  scene: SceneDevice,
  select: SelectDevice,
  media_player: MediaPlayerDevice,
  humidifier: HumidifierDevice,
  vacuum: VacuumDevice,
  valve: ValveDevice,
  water_heater: WaterHeaterDevice,
};
