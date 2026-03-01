import type { EndpointType } from "@matter/main";
import { WaterValveDevice } from "@matter/main/devices/water-valve";
import { BasicInformationServer } from "../../../behaviors/basic-information-server.js";
import type { HomeAssistantEntityBehavior } from "../../../behaviors/home-assistant-entity-behavior.js";
import { HomeAssistantEntityBehavior as HomeAssistantEntityBehaviorClass } from "../../../behaviors/home-assistant-entity-behavior.js";
import { IdentifyServer } from "../../../behaviors/identify-server.js";
import { ValveConfigurationAndControlServer } from "../../../behaviors/valve-configuration-and-control-server.js";

const ValveEndpointType = WaterValveDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehaviorClass,
  ValveConfigurationAndControlServer,
);

export function ValveDevice(
  homeAssistantEntity: HomeAssistantEntityBehavior.State,
): EndpointType {
  return ValveEndpointType.set({ homeAssistantEntity });
}
