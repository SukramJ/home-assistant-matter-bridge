import type {
  HomeAssistantEntityInformation,
  HomeAssistantEntityState,
} from "@home-assistant-matter-bridge/common";
import { Pm10ConcentrationMeasurementServer as Base } from "@matter/main/behaviors/pm10-concentration-measurement";
import { ConcentrationMeasurement } from "@matter/main/clusters/concentration-measurement";
import { applyPatchState } from "../../utils/apply-patch-state.js";
import { HomeAssistantEntityBehavior } from "./home-assistant-entity-behavior.js";
import type { ValueGetter } from "./utils/cluster-config.js";

export interface Pm10ConcentrationMeasurementConfig {
  getValue: ValueGetter<number | null>;
}

const FeaturedBase = Base.with("NumericMeasurement");

// biome-ignore lint/correctness/noUnusedVariables: Biome thinks this is unused, but it's used by the function below
class Pm10ConcentrationMeasurementServerBase extends FeaturedBase {
  declare state: Pm10ConcentrationMeasurementServerBase.State;

  override async initialize() {
    this.state.measurementUnit = ConcentrationMeasurement.MeasurementUnit.Ugm3;
    this.state.measurementMedium =
      ConcentrationMeasurement.MeasurementMedium.Air;
    await super.initialize();
    const homeAssistant = await this.agent.load(HomeAssistantEntityBehavior);
    this.update(homeAssistant.entity);
    this.reactTo(homeAssistant.onChange, this.update);
  }

  private update(entity: HomeAssistantEntityInformation) {
    const value = this.getValue(entity.state);
    applyPatchState(this.state, { measuredValue: value });
  }

  private getValue(entity: HomeAssistantEntityState): number | null {
    const value = this.state.config.getValue(entity, this.agent);
    if (value == null) {
      return null;
    }
    return value;
  }
}

namespace Pm10ConcentrationMeasurementServerBase {
  export class State extends FeaturedBase.State {
    config!: Pm10ConcentrationMeasurementConfig;
  }
}

export function Pm10ConcentrationMeasurementServer(
  config: Pm10ConcentrationMeasurementConfig,
) {
  return Pm10ConcentrationMeasurementServerBase.set({ config });
}
