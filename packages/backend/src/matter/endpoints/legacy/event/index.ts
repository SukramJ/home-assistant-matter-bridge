import type { EndpointType } from "@matter/main";
import { GenericSwitchDevice } from "@matter/main/devices/generic-switch";
import { BasicInformationServer } from "../../../behaviors/basic-information-server.js";
import { GenericSwitchServer } from "../../../behaviors/generic-switch-server.js";
import type { HomeAssistantEntityBehavior } from "../../../behaviors/home-assistant-entity-behavior.js";
import { HomeAssistantEntityBehavior as HomeAssistantEntityBehaviorClass } from "../../../behaviors/home-assistant-entity-behavior.js";
import { IdentifyServer } from "../../../behaviors/identify-server.js";

const GenericSwitchType = GenericSwitchDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehaviorClass,
  GenericSwitchServer,
);

export function EventDevice(
  homeAssistantEntity: HomeAssistantEntityBehavior.State,
): EndpointType {
  return GenericSwitchType.set({ homeAssistantEntity });
}
