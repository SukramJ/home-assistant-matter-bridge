import type { EndpointType } from "@matter/main";
import { ModeSelectDevice } from "@matter/main/devices/mode-select";
import { BasicInformationServer } from "../../../behaviors/basic-information-server.js";
import type { HomeAssistantEntityBehavior } from "../../../behaviors/home-assistant-entity-behavior.js";
import { HomeAssistantEntityBehavior as HomeAssistantEntityBehaviorClass } from "../../../behaviors/home-assistant-entity-behavior.js";
import { IdentifyServer } from "../../../behaviors/identify-server.js";
import { ModeSelectServer } from "../../../behaviors/mode-select-server.js";

const ModeSelectEndpointType = ModeSelectDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehaviorClass,
  ModeSelectServer,
);

export function SelectDevice(
  homeAssistantEntity: HomeAssistantEntityBehavior.State,
): EndpointType {
  return ModeSelectEndpointType.set({ homeAssistantEntity });
}
