import type { HomeAssistantEntityState } from "@home-assistant-matter-bridge/common";
import { PressureSensorDevice } from "@matter/main/devices/pressure-sensor";
import { BasicInformationServer } from "../../../../behaviors/basic-information-server.js";
import { HomeAssistantEntityBehavior } from "../../../../behaviors/home-assistant-entity-behavior.js";
import { IdentifyServer } from "../../../../behaviors/identify-server.js";
import {
  type PressureMeasurementConfig,
  PressureMeasurementServer,
} from "../../../../behaviors/pressure-measurement-server.js";

const pressureSensorConfig: PressureMeasurementConfig = {
  getValue({ state }: HomeAssistantEntityState) {
    if (state == null || Number.isNaN(+state)) {
      return null;
    }
    return +state;
  },
};

export const PressureSensorType = PressureSensorDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehavior,
  PressureMeasurementServer(pressureSensorConfig),
);
