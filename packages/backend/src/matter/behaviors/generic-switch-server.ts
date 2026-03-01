import type { HomeAssistantEntityInformation } from "@home-assistant-matter-bridge/common";
import { SwitchServer as Base } from "@matter/main/behaviors/switch";
import { HomeAssistantEntityBehavior } from "./home-assistant-entity-behavior.js";

const FeaturedBase = Base.with(
  "MomentarySwitch",
  "MomentarySwitchRelease",
  "MomentarySwitchMultiPress",
);

class GenericSwitchServerBase extends FeaturedBase {
  override async initialize() {
    await super.initialize();
    this.state.numberOfPositions = 2;
    this.state.currentPosition = 0;
    this.state.multiPressMax = 2;
    const homeAssistant = await this.agent.load(HomeAssistantEntityBehavior);
    this.reactTo(homeAssistant.onChange, this.update);
  }

  private update(entity: HomeAssistantEntityInformation) {
    const eventType = this.getEventType(entity);
    if (eventType == null) {
      return;
    }
    const pressCount = this.getPressCount(eventType);
    this.simulatePress(pressCount);
  }

  private getEventType(
    entity: HomeAssistantEntityInformation,
  ): string | undefined {
    const attributes = entity.state.attributes as Record<string, unknown>;
    return attributes.event_type as string | undefined;
  }

  private getPressCount(eventType: string): number {
    const lower = eventType.toLowerCase();
    if (lower.includes("double") || lower === "press_double") {
      return 2;
    }
    if (lower.includes("triple") || lower === "press_triple") {
      return 3;
    }
    return 1;
  }

  private simulatePress(pressCount: number) {
    this.state.currentPosition = 1;
    this.events.initialPress.emit({ newPosition: 1 }, this.context);

    setTimeout(
      this.callback(() => {
        this.state.currentPosition = 0;
        this.events.shortRelease.emit({ previousPosition: 1 }, this.context);
        this.events.multiPressComplete.emit(
          {
            previousPosition: 1,
            totalNumberOfPressesCounted: pressCount,
          },
          this.context,
        );
      }),
      100,
    );
  }
}

export const GenericSwitchServer = GenericSwitchServerBase;
