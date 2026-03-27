import type { HomeAssistantEntityInformation } from "@home-assistant-matter-bridge/common";
import type { EndpointType } from "@matter/main";
import { ModeSelectServer as Base } from "@matter/main/behaviors/mode-select";
import { ModeSelectDevice } from "@matter/main/devices/mode-select";
import { applyPatchState } from "../../../../utils/apply-patch-state.js";
import { BasicInformationServer } from "../../../behaviors/basic-information-server.js";
import { HomeAssistantEntityBehavior } from "../../../behaviors/home-assistant-entity-behavior.js";
import { IdentifyServer } from "../../../behaviors/identify-server.js";

const alarmStates = [
  "disarmed",
  "armed_home",
  "armed_away",
  "armed_night",
  "armed_vacation",
  "armed_custom_bypass",
  "triggered",
] as const;

const alarmStateToAction: Record<string, string> = {
  disarmed: "alarm_control_panel.alarm_disarm",
  armed_home: "alarm_control_panel.alarm_arm_home",
  armed_away: "alarm_control_panel.alarm_arm_away",
  armed_night: "alarm_control_panel.alarm_arm_night",
  armed_vacation: "alarm_control_panel.alarm_arm_vacation",
  armed_custom_bypass: "alarm_control_panel.alarm_arm_custom_bypass",
};

class AlarmModeSelectServer extends Base {
  override async initialize() {
    await super.initialize();
    const homeAssistant = await this.agent.load(HomeAssistantEntityBehavior);

    this.state.supportedModes = alarmStates.map((state, index) => ({
      label: state.replace(/_/g, " ").substring(0, 64),
      mode: index,
      semanticTags: [],
    }));
    this.state.description =
      homeAssistant.entity.registry?.original_name ?? "Alarm";
    this.state.standardNamespace = null;

    this.update(homeAssistant.entity);
    this.reactTo(homeAssistant.onChange, this.update);
  }

  private update(entity: HomeAssistantEntityInformation) {
    const currentState = entity.state.state;
    const index = alarmStates.indexOf(
      currentState as (typeof alarmStates)[number],
    );
    applyPatchState(this.state, {
      currentMode: index >= 0 ? index : 0,
    });
  }

  override changeToMode({ newMode }: { newMode: number }) {
    const targetState = alarmStates[newMode];
    if (!targetState) return;

    const action = alarmStateToAction[targetState];
    if (!action) return;

    const homeAssistant = this.agent.get(HomeAssistantEntityBehavior);
    homeAssistant.callAction({ action });
  }
}

const AlarmDeviceType = ModeSelectDevice.with(
  BasicInformationServer,
  IdentifyServer,
  HomeAssistantEntityBehavior,
  AlarmModeSelectServer,
);

export function AlarmControlPanelDevice(
  homeAssistantEntity: HomeAssistantEntityBehavior.State,
): EndpointType {
  return AlarmDeviceType.set({ homeAssistantEntity });
}
