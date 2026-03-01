import type { HomeAssistantEntityInformation } from "@home-assistant-matter-bridge/common";
import { ValveConfigurationAndControlServer as Base } from "@matter/main/behaviors/valve-configuration-and-control";
import { ValveConfigurationAndControl } from "@matter/main/clusters/valve-configuration-and-control";
import { applyPatchState } from "../../utils/apply-patch-state.js";
import { HomeAssistantEntityBehavior } from "./home-assistant-entity-behavior.js";

class ValveConfigurationAndControlServerBase extends Base {
  override async initialize() {
    await super.initialize();
    const homeAssistant = await this.agent.load(HomeAssistantEntityBehavior);
    this.update(homeAssistant.entity);
    this.reactTo(homeAssistant.onChange, this.update);
  }

  private update(entity: HomeAssistantEntityInformation) {
    const currentState = this.getValveState(entity.state.state);
    applyPatchState(this.state, {
      currentState,
      targetState:
        currentState === ValveConfigurationAndControl.ValveState.Transitioning
          ? this.state.targetState
          : currentState,
    });
  }

  private getValveState(
    state: string,
  ): ValveConfigurationAndControl.ValveState {
    switch (state) {
      case "open":
        return ValveConfigurationAndControl.ValveState.Open;
      case "opening":
      case "closing":
        return ValveConfigurationAndControl.ValveState.Transitioning;
      default:
        return ValveConfigurationAndControl.ValveState.Closed;
    }
  }

  override open() {
    const homeAssistant = this.agent.get(HomeAssistantEntityBehavior);
    homeAssistant.callAction({ action: "valve.open_valve" });
  }

  override close() {
    const homeAssistant = this.agent.get(HomeAssistantEntityBehavior);
    homeAssistant.callAction({ action: "valve.close_valve" });
  }
}

export const ValveConfigurationAndControlServer =
  ValveConfigurationAndControlServerBase;
