import {
  type BridgeDataWithMetadata,
  BridgeStatus,
} from "@home-assistant-matter-bridge/common";
import { describe, expect, it } from "vitest";
import {
  createBridge,
  deleteBridge,
  loadBridges,
  resetBridge,
  updateBridge,
} from "./bridge-actions.ts";
import type { BridgeState } from "./bridge-state.ts";
import { bridgesReducer } from "./bridges-reducer.ts";

const mockBridge: BridgeDataWithMetadata = {
  id: "test-id-123",
  name: "Test Bridge",
  port: 5540,
  filter: { include: [], exclude: [] },
  basicInformation: {
    vendorId: 0xfff1,
    vendorName: "test",
    productId: 0x8000,
    productName: "TestBridge",
    productLabel: "Test Matter Bridge",
    hardwareVersion: 2024,
    softwareVersion: 2024,
  },
  status: BridgeStatus.Running,
  deviceCount: 0,
};

const mockBridge2: BridgeDataWithMetadata = {
  ...mockBridge,
  id: "test-id-456",
  name: "Test Bridge 2",
  port: 5541,
};

describe("bridgesReducer", () => {
  const initialState: BridgeState = {
    items: { isInitialized: false, isLoading: false },
  };

  describe("loadBridges", () => {
    it("should set loading state on pending", () => {
      const action = { type: loadBridges.pending.type };
      const state = bridgesReducer(initialState, action);

      expect(state.items.isLoading).toBe(true);
      expect(state.items.isInitialized).toBe(false);
    });

    it("should set bridges on fulfilled", () => {
      const bridges = [mockBridge, mockBridge2];
      const action = {
        type: loadBridges.fulfilled.type,
        payload: bridges,
      };
      const state = bridgesReducer(initialState, action);

      expect(state.items.content).toEqual(bridges);
      expect(state.items.isLoading).toBe(false);
      expect(state.items.isInitialized).toBe(true);
      expect(state.items.error).toBeUndefined();
    });

    it("should set error on rejected", () => {
      const error = new Error("Failed to load");
      const action = {
        type: loadBridges.rejected.type,
        error,
      };
      const state = bridgesReducer(initialState, action);

      expect(state.items.error).toBe(error);
      expect(state.items.isLoading).toBe(false);
      expect(state.items.isInitialized).toBe(true);
      expect(state.items.content).toBeUndefined();
    });
  });

  describe("createBridge", () => {
    it("should add new bridge to state", () => {
      const stateWithBridges: BridgeState = {
        items: {
          isInitialized: true,
          isLoading: false,
          content: [mockBridge],
        },
      };

      const action = {
        type: createBridge.fulfilled.type,
        payload: mockBridge2,
      };
      const state = bridgesReducer(stateWithBridges, action);

      expect(state.items.content).toHaveLength(2);
      expect(state.items.content![1]).toEqual(mockBridge2);
    });

    it("should handle creating first bridge when content is undefined", () => {
      const action = {
        type: createBridge.fulfilled.type,
        payload: mockBridge,
      };
      const state = bridgesReducer(initialState, action);

      // Should not throw, even though content is undefined
      expect(state.items.content).toBeUndefined();
    });
  });

  describe("updateBridge", () => {
    it("should update existing bridge", () => {
      const stateWithBridges: BridgeState = {
        items: {
          isInitialized: true,
          isLoading: false,
          content: [mockBridge, mockBridge2],
        },
      };

      const updatedBridge = { ...mockBridge, name: "Updated Name" };
      const action = {
        type: updateBridge.fulfilled.type,
        payload: updatedBridge,
      };
      const state = bridgesReducer(stateWithBridges, action);

      expect(state.items.content![0].name).toBe("Updated Name");
      expect(state.items.content![1]).toEqual(mockBridge2);
    });

    it("should not modify state if bridge not found", () => {
      const stateWithBridges: BridgeState = {
        items: {
          isInitialized: true,
          isLoading: false,
          content: [mockBridge],
        },
      };

      const nonExistentBridge = { ...mockBridge, id: "non-existent" };
      const action = {
        type: updateBridge.fulfilled.type,
        payload: nonExistentBridge,
      };
      const state = bridgesReducer(stateWithBridges, action);

      expect(state.items.content).toEqual([mockBridge]);
    });

    it("should handle update when content is undefined", () => {
      const action = {
        type: updateBridge.fulfilled.type,
        payload: mockBridge,
      };
      const state = bridgesReducer(initialState, action);

      // Should not throw
      expect(state.items.content).toBeUndefined();
    });
  });

  describe("resetBridge", () => {
    it("should update bridge after reset", () => {
      const stateWithBridges: BridgeState = {
        items: {
          isInitialized: true,
          isLoading: false,
          content: [mockBridge, mockBridge2],
        },
      };

      const resetBridgeData = { ...mockBridge, name: "Reset Bridge" };
      const action = {
        type: resetBridge.fulfilled.type,
        payload: resetBridgeData,
      };
      const state = bridgesReducer(stateWithBridges, action);

      expect(state.items.content![0].name).toBe("Reset Bridge");
    });

    it("should not modify state if bridge not found", () => {
      const stateWithBridges: BridgeState = {
        items: {
          isInitialized: true,
          isLoading: false,
          content: [mockBridge],
        },
      };

      const nonExistentBridge = { ...mockBridge, id: "non-existent" };
      const action = {
        type: resetBridge.fulfilled.type,
        payload: nonExistentBridge,
      };
      const state = bridgesReducer(stateWithBridges, action);

      expect(state.items.content).toEqual([mockBridge]);
    });
  });

  describe("deleteBridge", () => {
    it("should remove bridge from state", () => {
      const stateWithBridges: BridgeState = {
        items: {
          isInitialized: true,
          isLoading: false,
          content: [mockBridge, mockBridge2],
        },
      };

      const action = {
        type: deleteBridge.fulfilled.type,
        meta: { arg: mockBridge.id },
      };
      const state = bridgesReducer(stateWithBridges, action);

      expect(state.items.content).toHaveLength(1);
      expect(state.items.content![0]).toEqual(mockBridge2);
    });

    it("should not modify state if bridge not found", () => {
      const stateWithBridges: BridgeState = {
        items: {
          isInitialized: true,
          isLoading: false,
          content: [mockBridge],
        },
      };

      const action = {
        type: deleteBridge.fulfilled.type,
        meta: { arg: "non-existent" },
      };
      const state = bridgesReducer(stateWithBridges, action);

      expect(state.items.content).toEqual([mockBridge]);
    });

    it("should handle delete when content is undefined", () => {
      const action = {
        type: deleteBridge.fulfilled.type,
        meta: { arg: mockBridge.id },
      };
      const state = bridgesReducer(initialState, action);

      // Should not throw
      expect(state.items.content).toBeUndefined();
    });
  });

  describe("state immutability", () => {
    it("should not mutate original state", () => {
      const stateWithBridges: BridgeState = {
        items: {
          isInitialized: true,
          isLoading: false,
          content: [mockBridge],
        },
      };

      const originalContent = stateWithBridges.items.content;
      const action = {
        type: createBridge.fulfilled.type,
        payload: mockBridge2,
      };

      bridgesReducer(stateWithBridges, action);

      // Original state should remain unchanged
      expect(originalContent).toHaveLength(1);
      expect(originalContent![0]).toEqual(mockBridge);
    });
  });
});
