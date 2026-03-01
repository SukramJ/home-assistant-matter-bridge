import type { HomeAssistantEntityState } from "@home-assistant-matter-bridge/common";
import { AirQualitySensorDevice } from "@matter/main/devices/air-quality-sensor";
import { BasicInformationServer } from "../../../../behaviors/basic-information-server.js";
import {
  type CarbonDioxideConcentrationMeasurementConfig,
  CarbonDioxideConcentrationMeasurementServer,
} from "../../../../behaviors/carbon-dioxide-concentration-measurement-server.js";
import { HomeAssistantEntityBehavior } from "../../../../behaviors/home-assistant-entity-behavior.js";
import { IdentifyServer } from "../../../../behaviors/identify-server.js";

const co2SensorConfig: CarbonDioxideConcentrationMeasurementConfig = {
  getValue({ state }: HomeAssistantEntityState) {
    if (state == null || Number.isNaN(+state)) {
      return null;
    }
    return +state;
  },
};

export const Co2SensorType = AirQualitySensorDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehavior,
  CarbonDioxideConcentrationMeasurementServer(co2SensorConfig),
);
