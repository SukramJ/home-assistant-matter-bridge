import type { HomeAssistantEntityInformation } from "@home-assistant-matter-bridge/common";
import { ModeSelectServer as Base } from "@matter/main/behaviors/mode-select";
import { applyPatchState } from "../../utils/apply-patch-state.js";
import { HomeAssistantEntityBehavior } from "./home-assistant-entity-behavior.js";

class ModeSelectServerBase extends Base {
  override async initialize() {
    await super.initialize();
    const homeAssistant = await this.agent.load(HomeAssistantEntityBehavior);
    const options = this.getOptions(homeAssistant.entity);
    this.state.supportedModes = options;
    this.state.description = homeAssistant.entity.registry?.original_name ?? "";
    this.state.standardNamespace = null;
    this.update(homeAssistant.entity);
    this.reactTo(homeAssistant.onChange, this.update);
  }

  private update(entity: HomeAssistantEntityInformation) {
    const options = this.getOptions(entity);
    const currentMode = this.getCurrentMode(entity, options);
    applyPatchState(this.state, {
      currentMode,
    });
  }

  private getOptions(
    entity: HomeAssistantEntityInformation,
  ): Array<{ label: string; mode: number; semanticTags: [] }> {
    const attributes = entity.state.attributes as Record<string, unknown>;
    const optionsList = (attributes.options as string[] | undefined) ?? [];
    return optionsList.map((option, index) => ({
      label: option.substring(0, 64),
      mode: index,
      semanticTags: [],
    }));
  }

  private getCurrentMode(
    entity: HomeAssistantEntityInformation,
    options: Array<{ label: string; mode: number }>,
  ): number {
    const currentValue = entity.state.state;
    const index = options.findIndex(
      (opt) => opt.label.toLowerCase() === currentValue?.toLowerCase(),
    );
    return index >= 0 ? index : 0;
  }

  override changeToMode({ newMode }: { newMode: number }) {
    const homeAssistant = this.agent.get(HomeAssistantEntityBehavior);
    const entity = homeAssistant.entity;
    const attributes = entity.state.attributes as Record<string, unknown>;
    const options = (attributes.options as string[] | undefined) ?? [];
    const option = options[newMode];
    if (option != null) {
      homeAssistant.callAction({
        action: "select.select_option",
        data: { option },
      });
    }
  }
}

export const ModeSelectServer = ModeSelectServerBase;
