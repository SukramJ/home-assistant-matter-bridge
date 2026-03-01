import type { HomeAssistantEntityInformation } from "@home-assistant-matter-bridge/common";
import { PowerSourceServer as Base } from "@matter/main/behaviors/power-source";
import { PowerSource } from "@matter/main/clusters/power-source";
import { applyPatchState } from "../../utils/apply-patch-state.js";
import { HomeAssistantEntityBehavior } from "./home-assistant-entity-behavior.js";

const FeaturedBase = Base.with("Battery", "Rechargeable");

// biome-ignore lint/correctness/noUnusedVariables: Biome thinks this is unused, but it's used by the function below
class PowerSourceServerBase extends FeaturedBase {
  declare state: PowerSourceServerBase.State;

  override async initialize() {
    await super.initialize();
    const homeAssistant = await this.agent.load(HomeAssistantEntityBehavior);
    this.update(homeAssistant.entity);
    this.reactTo(homeAssistant.onChange, this.update);
  }

  private update(entity: HomeAssistantEntityInformation) {
    const battery = this.state.config.getBatteryPercent(entity);
    const batChargeLevel = this.getBatChargeLevel(battery);
    applyPatchState(this.state, {
      status: PowerSource.PowerSourceStatus.Active,
      order: 1,
      description: "Battery",
      batPercentRemaining: battery != null ? Math.min(200, battery * 2) : null,
      batChargeLevel,
    });
  }

  private getBatChargeLevel(
    battery: number | null,
  ): PowerSource.BatChargeLevel {
    if (battery == null) {
      return PowerSource.BatChargeLevel.Ok;
    }
    if (battery <= 10) {
      return PowerSource.BatChargeLevel.Critical;
    }
    if (battery <= 20) {
      return PowerSource.BatChargeLevel.Warning;
    }
    return PowerSource.BatChargeLevel.Ok;
  }
}

export interface PowerSourceConfig {
  getBatteryPercent: (entity: HomeAssistantEntityInformation) => number | null;
}

namespace PowerSourceServerBase {
  export class State extends FeaturedBase.State {
    config!: PowerSourceConfig;
  }
}

export function PowerSourceServer(config: PowerSourceConfig) {
  return PowerSourceServerBase.set({ config });
}
