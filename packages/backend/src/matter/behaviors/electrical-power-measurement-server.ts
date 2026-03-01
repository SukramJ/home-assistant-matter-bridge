import type {
  HomeAssistantEntityInformation,
  HomeAssistantEntityState,
} from "@home-assistant-matter-bridge/common";
import { ElectricalPowerMeasurementServer as Base } from "@matter/main/behaviors/electrical-power-measurement";
import { ElectricalPowerMeasurement } from "@matter/main/clusters/electrical-power-measurement";
import { applyPatchState } from "../../utils/apply-patch-state.js";
import { HomeAssistantEntityBehavior } from "./home-assistant-entity-behavior.js";
import type { ValueGetter } from "./utils/cluster-config.js";

export interface ElectricalPowerMeasurementConfig {
  getValue: ValueGetter<number | null>;
}

const FeaturedBase = Base.with("AlternatingCurrent");

// biome-ignore lint/correctness/noUnusedVariables: Biome thinks this is unused, but it's used by the function below
class ElectricalPowerMeasurementServerBase extends FeaturedBase {
  declare state: ElectricalPowerMeasurementServerBase.State;

  override async initialize() {
    this.state.powerMode = ElectricalPowerMeasurement.PowerMode.Ac;
    await super.initialize();
    const homeAssistant = await this.agent.load(HomeAssistantEntityBehavior);
    this.update(homeAssistant.entity);
    this.reactTo(homeAssistant.onChange, this.update);
  }

  private update(entity: HomeAssistantEntityInformation) {
    const power = this.getPower(entity.state);
    applyPatchState(this.state, {
      activePower: power,
    });
  }

  private getPower(entity: HomeAssistantEntityState): number | null {
    const value = this.state.config.getValue(entity, this.agent);
    if (value == null) {
      return null;
    }
    // HA reports W, Matter expects mW
    return Math.round(value * 1000);
  }
}

namespace ElectricalPowerMeasurementServerBase {
  export class State extends FeaturedBase.State {
    config!: ElectricalPowerMeasurementConfig;
  }
}

export function ElectricalPowerMeasurementServer(
  config: ElectricalPowerMeasurementConfig,
) {
  return ElectricalPowerMeasurementServerBase.set({ config });
}
