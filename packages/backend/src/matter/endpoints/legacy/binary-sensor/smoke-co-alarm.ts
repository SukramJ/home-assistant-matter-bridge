import { SmokeCoAlarmDevice } from "@matter/main/devices/smoke-co-alarm";
import { BasicInformationServer } from "../../../behaviors/basic-information-server.js";
import { HomeAssistantEntityBehavior } from "../../../behaviors/home-assistant-entity-behavior.js";
import { IdentifyServer } from "../../../behaviors/identify-server.js";
import { SmokeCoAlarmServer } from "../../../behaviors/smoke-co-alarm-server.js";

export const SmokeCoAlarmType = SmokeCoAlarmDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehavior,
  SmokeCoAlarmServer,
);
