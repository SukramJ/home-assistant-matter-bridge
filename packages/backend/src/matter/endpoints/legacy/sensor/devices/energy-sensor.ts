import type { HomeAssistantEntityState } from "@home-assistant-matter-bridge/common";
import { OnOffPlugInUnitDevice } from "@matter/main/devices/on-off-plug-in-unit";
import { BasicInformationServer } from "../../../../behaviors/basic-information-server.js";
import {
  type ElectricalEnergyMeasurementConfig,
  ElectricalEnergyMeasurementServer,
} from "../../../../behaviors/electrical-energy-measurement-server.js";
import { HomeAssistantEntityBehavior } from "../../../../behaviors/home-assistant-entity-behavior.js";
import { IdentifyServer } from "../../../../behaviors/identify-server.js";
import { OnOffServer } from "../../../../behaviors/on-off-server.js";

const energySensorConfig: ElectricalEnergyMeasurementConfig = {
  getValue({ state }: HomeAssistantEntityState) {
    if (state == null || Number.isNaN(+state)) {
      return null;
    }
    return +state;
  },
};

const ReadOnlyOnOff = OnOffServer({ turnOn: null, turnOff: null }).with();

export const EnergySensorType = OnOffPlugInUnitDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehavior,
  ReadOnlyOnOff,
  ElectricalEnergyMeasurementServer(energySensorConfig),
);
