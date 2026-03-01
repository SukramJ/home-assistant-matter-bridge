import type { HomeAssistantEntityState } from "@home-assistant-matter-bridge/common";
import { AirQualitySensorDevice } from "@matter/main/devices/air-quality-sensor";
import { BasicInformationServer } from "../../../../behaviors/basic-information-server.js";
import { HomeAssistantEntityBehavior } from "../../../../behaviors/home-assistant-entity-behavior.js";
import { IdentifyServer } from "../../../../behaviors/identify-server.js";
import {
  type Pm25ConcentrationMeasurementConfig,
  Pm25ConcentrationMeasurementServer,
} from "../../../../behaviors/pm25-concentration-measurement-server.js";

const pm25SensorConfig: Pm25ConcentrationMeasurementConfig = {
  getValue({ state }: HomeAssistantEntityState) {
    if (state == null || Number.isNaN(+state)) {
      return null;
    }
    return +state;
  },
};

export const Pm25SensorType = AirQualitySensorDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehavior,
  Pm25ConcentrationMeasurementServer(pm25SensorConfig),
);
