import type {
  HomeAssistantEntityInformation,
  HomeAssistantEntityState,
} from "@home-assistant-matter-bridge/common";
import { PressureMeasurementServer as Base } from "@matter/main/behaviors/pressure-measurement";
import { applyPatchState } from "../../utils/apply-patch-state.js";
import { HomeAssistantEntityBehavior } from "./home-assistant-entity-behavior.js";
import type { ValueGetter } from "./utils/cluster-config.js";

export interface PressureMeasurementConfig {
  getValue: ValueGetter<number | null>;
}

// biome-ignore lint/correctness/noUnusedVariables: Biome thinks this is unused, but it's used by the function below
class PressureMeasurementServerBase extends Base {
  declare state: PressureMeasurementServerBase.State;

  override async initialize() {
    await super.initialize();
    const homeAssistant = await this.agent.load(HomeAssistantEntityBehavior);
    this.update(homeAssistant.entity);
    this.reactTo(homeAssistant.onChange, this.update);
  }

  private update(entity: HomeAssistantEntityInformation) {
    const pressure = this.getPressure(this.state.config, entity.state);
    applyPatchState(this.state, { measuredValue: pressure });
  }

  private getPressure(
    config: PressureMeasurementConfig,
    entity: HomeAssistantEntityState,
  ): number | null {
    const pressure = config.getValue(entity, this.agent);
    if (pressure == null) {
      return null;
    }
    // HA reports hPa, Matter expects kPa * 10 (dkPa)
    // 1 hPa = 0.1 kPa, so value in kPa * 10 = hPa value
    return Math.round(pressure);
  }
}

namespace PressureMeasurementServerBase {
  export class State extends Base.State {
    config!: PressureMeasurementConfig;
  }
}

export function PressureMeasurementServer(config: PressureMeasurementConfig) {
  return PressureMeasurementServerBase.set({ config });
}
