import type {
  HomeAssistantEntityInformation,
  HomeAssistantEntityState,
} from "@home-assistant-matter-bridge/common";
import { Pm25ConcentrationMeasurementServer as Base } from "@matter/main/behaviors/pm25-concentration-measurement";
import { ConcentrationMeasurement } from "@matter/main/clusters/concentration-measurement";
import { applyPatchState } from "../../utils/apply-patch-state.js";
import { HomeAssistantEntityBehavior } from "./home-assistant-entity-behavior.js";
import type { ValueGetter } from "./utils/cluster-config.js";

export interface Pm25ConcentrationMeasurementConfig {
  getValue: ValueGetter<number | null>;
}

const FeaturedBase = Base.with("NumericMeasurement");

// biome-ignore lint/correctness/noUnusedVariables: Biome thinks this is unused, but it's used by the function below
class Pm25ConcentrationMeasurementServerBase extends FeaturedBase {
  declare state: Pm25ConcentrationMeasurementServerBase.State;

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

namespace Pm25ConcentrationMeasurementServerBase {
  export class State extends FeaturedBase.State {
    config!: Pm25ConcentrationMeasurementConfig;
  }
}

export function Pm25ConcentrationMeasurementServer(
  config: Pm25ConcentrationMeasurementConfig,
) {
  return Pm25ConcentrationMeasurementServerBase.set({ config });
}
