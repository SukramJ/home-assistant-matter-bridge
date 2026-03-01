import type { HomeAssistantEntityInformation } from "@home-assistant-matter-bridge/common";
import { SmokeCoAlarmServer as Base } from "@matter/main/behaviors/smoke-co-alarm";
import { SmokeCoAlarm } from "@matter/main/clusters/smoke-co-alarm";
import { applyPatchState } from "../../utils/apply-patch-state.js";
import { HomeAssistantEntityBehavior } from "./home-assistant-entity-behavior.js";

const FeaturedBase = Base.with("SmokeAlarm");

class SmokeCoAlarmServerBase extends FeaturedBase {
  override async initialize() {
    await super.initialize();
    const homeAssistant = await this.agent.load(HomeAssistantEntityBehavior);
    this.update(homeAssistant.entity);
    this.reactTo(homeAssistant.onChange, this.update);
  }

  private update(entity: HomeAssistantEntityInformation) {
    const isOn =
      this.agent.get(HomeAssistantEntityBehavior).isAvailable &&
      entity.state.state !== "off";
    const smokeState = isOn
      ? SmokeCoAlarm.AlarmState.Critical
      : SmokeCoAlarm.AlarmState.Normal;
    applyPatchState(this.state, {
      smokeState,
      expressedState: isOn
        ? SmokeCoAlarm.ExpressedState.SmokeAlarm
        : SmokeCoAlarm.ExpressedState.Normal,
      batteryAlert: SmokeCoAlarm.AlarmState.Normal,
      testInProgress: false,
      hardwareFaultAlert: false,
      endOfServiceAlert: SmokeCoAlarm.EndOfService.Normal,
    });
  }
}

export const SmokeCoAlarmServer = SmokeCoAlarmServerBase;
