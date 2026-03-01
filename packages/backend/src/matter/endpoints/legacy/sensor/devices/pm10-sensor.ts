import type { HomeAssistantEntityState } from "@home-assistant-matter-bridge/common";
import { AirQualitySensorDevice } from "@matter/main/devices/air-quality-sensor";
import { BasicInformationServer } from "../../../../behaviors/basic-information-server.js";
import { HomeAssistantEntityBehavior } from "../../../../behaviors/home-assistant-entity-behavior.js";
import { IdentifyServer } from "../../../../behaviors/identify-server.js";
import {
  type Pm10ConcentrationMeasurementConfig,
  Pm10ConcentrationMeasurementServer,
} from "../../../../behaviors/pm10-concentration-measurement-server.js";

const pm10SensorConfig: Pm10ConcentrationMeasurementConfig = {
  getValue({ state }: HomeAssistantEntityState) {
    if (state == null || Number.isNaN(+state)) {
      return null;
    }
    return +state;
  },
};

export const Pm10SensorType = AirQualitySensorDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehavior,
  Pm10ConcentrationMeasurementServer(pm10SensorConfig),
);
