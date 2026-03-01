import type {
  HomeAssistantEntityInformation,
  HomeAssistantEntityState,
} from "@home-assistant-matter-bridge/common";
import { ElectricalEnergyMeasurementServer as Base } from "@matter/main/behaviors/electrical-energy-measurement";
import { applyPatchState } from "../../utils/apply-patch-state.js";
import { HomeAssistantEntityBehavior } from "./home-assistant-entity-behavior.js";
import type { ValueGetter } from "./utils/cluster-config.js";

export interface ElectricalEnergyMeasurementConfig {
  getValue: ValueGetter<number | null>;
}

const FeaturedBase = Base.with("CumulativeEnergy", "ImportedEnergy");

// biome-ignore lint/correctness/noUnusedVariables: Biome thinks this is unused, but it's used by the function below
class ElectricalEnergyMeasurementServerBase extends FeaturedBase {
  declare state: ElectricalEnergyMeasurementServerBase.State;

  override async initialize() {
    await super.initialize();
    const homeAssistant = await this.agent.load(HomeAssistantEntityBehavior);
    this.update(homeAssistant.entity);
    this.reactTo(homeAssistant.onChange, this.update);
  }

  private update(entity: HomeAssistantEntityInformation) {
    const energy = this.getEnergy(entity.state);
    applyPatchState(this.state, {
      cumulativeEnergyImported: energy != null ? { energy } : null,
    });
  }

  private getEnergy(entity: HomeAssistantEntityState): number | null {
    const value = this.state.config.getValue(entity, this.agent);
    if (value == null) {
      return null;
    }
    // HA reports kWh, Matter expects mWh
    return Math.round(value * 1_000_000);
  }
}

namespace ElectricalEnergyMeasurementServerBase {
  export class State extends FeaturedBase.State {
    config!: ElectricalEnergyMeasurementConfig;
  }
}

export function ElectricalEnergyMeasurementServer(
  config: ElectricalEnergyMeasurementConfig,
) {
  return ElectricalEnergyMeasurementServerBase.set({ config });
}
