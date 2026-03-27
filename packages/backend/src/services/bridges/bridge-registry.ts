import type {
  BridgeFeatureFlags,
  EntityOverride,
  HomeAssistantDeviceRegistry,
  HomeAssistantEntityRegistry,
  HomeAssistantEntityState,
  HomeAssistantFilter,
} from "@home-assistant-matter-bridge/common";
import { keys, pickBy, values } from "lodash-es";
import type {
  HomeAssistantDevices,
  HomeAssistantEntities,
  HomeAssistantRegistry,
  HomeAssistantStates,
} from "../home-assistant/home-assistant-registry.js";
import type { BridgeDataProvider } from "./bridge-data-provider.js";
import { testMatchers } from "./matcher/matches-entity-filter.js";

export interface BridgeRegistryProps {
  readonly registry: HomeAssistantRegistry;
  readonly dataProvider: BridgeDataProvider;
}

export class BridgeRegistry {
  get entityIds() {
    return keys(this._entities);
  }

  private _devices: HomeAssistantDevices = {};
  private _entities: HomeAssistantEntities = {};
  private _states: HomeAssistantStates = {};

  deviceOf(entityId: string): HomeAssistantDeviceRegistry {
    const entity = this._entities[entityId];
    return this._devices[entity.device_id];
  }
  entity(entityId: string) {
    return this._entities[entityId];
  }
  initialState(entityId: string) {
    return this._states[entityId];
  }
  entityOverride(entityId: string): EntityOverride | undefined {
    return this.dataProvider.entityOverrides?.[entityId];
  }

  constructor(
    private readonly registry: HomeAssistantRegistry,
    private readonly dataProvider: BridgeDataProvider,
  ) {
    this.refresh();
  }

  refresh() {
    this._entities = pickBy(this.registry.entities, (entity) => {
      const device = this.registry.devices[entity.device_id];
      const state = this.registry.states[entity.entity_id];
      const isHidden = this.isHiddenOrDisabled(
        this.dataProvider.featureFlags ?? {},
        entity,
      );
      const matchesFilter = this.matchesFilter(
        this.dataProvider.filter,
        entity,
        device,
        state,
      );
      return !isHidden && matchesFilter;
    });
    this._states = pickBy(
      this.registry.states,
      (e) => !!this._entities[e.entity_id],
    );
    this._devices = pickBy(this.registry.devices, (d) =>
      values(this._entities)
        .map((e) => e.device_id)
        .some((id) => d.id === id),
    );
  }

  private isHiddenOrDisabled(
    featureFlags: BridgeFeatureFlags,
    entity: HomeAssistantEntityRegistry,
  ): boolean {
    const isDisabled = entity.disabled_by != null;
    const isHidden =
      !featureFlags?.includeHiddenEntities && entity.hidden_by != null;
    return isDisabled || isHidden;
  }

  private matchesFilter(
    filter: HomeAssistantFilter,
    entity: HomeAssistantEntityRegistry,
    device: HomeAssistantDeviceRegistry,
    state?: HomeAssistantEntityState,
  ) {
    if (
      filter.include.length > 0 &&
      !testMatchers(filter.include, device, entity, state)
    ) {
      return false;
    }
    if (
      filter.exclude.length > 0 &&
      testMatchers(filter.exclude, device, entity, state)
    ) {
      return false;
    }
    return true;
  }
}
