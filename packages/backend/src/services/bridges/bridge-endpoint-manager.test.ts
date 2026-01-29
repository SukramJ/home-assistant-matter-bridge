import type { FailedDevice } from "@home-assistant-matter-bridge/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvalidDeviceError } from "../../utils/errors/invalid-device-error.js";
import { BridgeEndpointManager } from "./bridge-endpoint-manager.js";
import type { BridgeRegistry } from "./bridge-registry.js";
import type { HomeAssistantClient } from "../home-assistant/home-assistant-client.js";

// Mock dependencies
const createMockClient = () => ({
  connection: {},
} as unknown as HomeAssistantClient);

const createMockRegistry = (entityIds: string[] = []) => ({
  refresh: vi.fn(),
  entityIds,
} as unknown as BridgeRegistry);

const createMockLogger = () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  notice: vi.fn(),
  fatal: vi.fn(),
  log: vi.fn(),
} as unknown as ReturnType<typeof import("@matter/general").Logger.get>);

// Mock LegacyEndpoint
vi.mock("../../matter/endpoints/legacy/legacy-endpoint.js", () => ({
  LegacyEndpoint: {
    create: vi.fn(),
  },
}));

describe("BridgeEndpointManager - Graceful Error Handling", () => {
  let manager: BridgeEndpointManager;
  let mockClient: ReturnType<typeof createMockClient>;
  let mockRegistry: ReturnType<typeof createMockRegistry>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
    mockLogger = createMockLogger();
  });

  describe("Failed Device Tracking", () => {
    it("should track devices that fail with InvalidDeviceError", async () => {
      mockRegistry = createMockRegistry(["light.test"]);
      manager = new BridgeEndpointManager(
        mockClient,
        mockRegistry,
        mockLogger,
      );

      const { LegacyEndpoint } = await import(
        "../../matter/endpoints/legacy/legacy-endpoint.js"
      );
      vi.mocked(LegacyEndpoint.create).mockRejectedValueOnce(
        new InvalidDeviceError("Device not supported"),
      );

      await manager.refreshDevices();

      const failedDevices = manager.getFailedDevices();
      expect(failedDevices).toHaveLength(1);
      expect(failedDevices[0].entityId).toBe("light.test");
      expect(failedDevices[0].error).toContain("Invalid device");
      expect(failedDevices[0].timestamp).toBeGreaterThan(0);
    });

    it("should track devices that fail with general errors", async () => {
      mockRegistry = createMockRegistry(["light.test"]);
      manager = new BridgeEndpointManager(
        mockClient,
        mockRegistry,
        mockLogger,
      );

      const { LegacyEndpoint } = await import(
        "../../matter/endpoints/legacy/legacy-endpoint.js"
      );
      vi.mocked(LegacyEndpoint.create).mockRejectedValueOnce(
        new Error("Network timeout"),
      );

      await manager.refreshDevices();

      const failedDevices = manager.getFailedDevices();
      expect(failedDevices).toHaveLength(1);
      expect(failedDevices[0].error).toContain("Creation failed");
      expect(failedDevices[0].error).toContain("Network timeout");
    });

    it("should clear failed devices on new refresh", async () => {
      mockRegistry = createMockRegistry(["light.test"]);
      manager = new BridgeEndpointManager(
        mockClient,
        mockRegistry,
        mockLogger,
      );

      const { LegacyEndpoint } = await import(
        "../../matter/endpoints/legacy/legacy-endpoint.js"
      );

      // Mock root.add to succeed
      vi.spyOn(manager.root, "add").mockResolvedValue({} as any);

      // First refresh with failure
      vi.mocked(LegacyEndpoint.create).mockRejectedValueOnce(
        new InvalidDeviceError("Device not supported"),
      );
      await manager.refreshDevices();
      expect(manager.getFailedDevices()).toHaveLength(1);

      // Second refresh successful
      vi.mocked(LegacyEndpoint.create).mockResolvedValueOnce({
        entityId: "light.test",
        delete: vi.fn(),
      } as any);
      await manager.refreshDevices();

      // Failed devices should be cleared
      expect(manager.getFailedDevices()).toHaveLength(0);
    });

    it("should manually clear failed devices", () => {
      mockRegistry = createMockRegistry([]);
      manager = new BridgeEndpointManager(
        mockClient,
        mockRegistry,
        mockLogger,
      );

      // Add failed device manually (for testing)
      (manager as any).failedDevices = [
        {
          entityId: "test",
          error: "test error",
          timestamp: Date.now(),
        },
      ];

      expect(manager.getFailedDevices()).toHaveLength(1);
      manager.clearFailedDevices();
      expect(manager.getFailedDevices()).toHaveLength(0);
    });
  });

  describe("Bridge Continues After Device Failures", () => {
    it("should continue adding devices after one fails", async () => {
      mockRegistry = createMockRegistry([
        "light.broken",
        "light.working1",
        "light.working2",
      ]);
      manager = new BridgeEndpointManager(
        mockClient,
        mockRegistry,
        mockLogger,
      );

      const { LegacyEndpoint } = await import(
        "../../matter/endpoints/legacy/legacy-endpoint.js"
      );

      // Mock root.add to succeed
      let addCount = 0;
      vi.spyOn(manager.root, "add").mockImplementation(async () => {
        addCount++;
        return {} as any;
      });

      let callCount = 0;
      vi.mocked(LegacyEndpoint.create).mockImplementation(
        async (registry, entityId) => {
          callCount++;
          if (entityId === "light.broken") {
            throw new InvalidDeviceError("Broken device");
          }
          return {
            entityId,
            delete: vi.fn(),
          } as any;
        },
      );

      await manager.refreshDevices();

      // Should have tried to create all 3 devices
      expect(callCount).toBe(3);

      // Should have 1 failed device
      expect(manager.getFailedDevices()).toHaveLength(1);
      expect(manager.getFailedDevices()[0].entityId).toBe("light.broken");

      // Should have called add 2 times (for working devices)
      expect(addCount).toBe(2);
    });

    it("should log warning when devices fail", async () => {
      mockRegistry = createMockRegistry(["light.test"]);
      manager = new BridgeEndpointManager(
        mockClient,
        mockRegistry,
        mockLogger,
      );

      const { LegacyEndpoint } = await import(
        "../../matter/endpoints/legacy/legacy-endpoint.js"
      );
      vi.mocked(LegacyEndpoint.create).mockRejectedValueOnce(
        new InvalidDeviceError("Device not supported"),
      );

      await manager.refreshDevices();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Invalid device detected"),
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("0 successful, 1 failed"),
      );
    });

    it("should log success when all devices load", async () => {
      mockRegistry = createMockRegistry(["light.test1", "light.test2"]);
      manager = new BridgeEndpointManager(
        mockClient,
        mockRegistry,
        mockLogger,
      );

      const { LegacyEndpoint } = await import(
        "../../matter/endpoints/legacy/legacy-endpoint.js"
      );

      // Mock root.add to succeed and track count
      let addCount = 0;
      vi.spyOn(manager.root, "add").mockImplementation(async () => {
        addCount++;
        return {} as any;
      });
      // Mock parts.size to return the count
      Object.defineProperty(manager.root.parts, "size", {
        get: () => addCount,
        configurable: true,
      });

      vi.mocked(LegacyEndpoint.create).mockResolvedValue({
        entityId: "test",
        delete: vi.fn(),
      } as any);

      await manager.refreshDevices();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("successfully: 2 devices loaded"),
      );
    });
  });

  describe("Endpoint Add Failures", () => {
    it("should track failures when endpoint.add() fails", async () => {
      mockRegistry = createMockRegistry(["light.test"]);
      manager = new BridgeEndpointManager(
        mockClient,
        mockRegistry,
        mockLogger,
      );

      const mockEndpoint = {
        entityId: "light.test",
        delete: vi.fn(),
      };

      const { LegacyEndpoint } = await import(
        "../../matter/endpoints/legacy/legacy-endpoint.js"
      );
      vi.mocked(LegacyEndpoint.create).mockResolvedValueOnce(
        mockEndpoint as any,
      );

      // Mock root.add to throw error
      vi.spyOn(manager.root, "add").mockRejectedValueOnce(
        new Error("Failed to add to aggregator"),
      );

      await manager.refreshDevices();

      const failedDevices = manager.getFailedDevices();
      expect(failedDevices).toHaveLength(1);
      expect(failedDevices[0].entityId).toBe("light.test");
      expect(failedDevices[0].error).toContain("Failed to add endpoint");
    });
  });

  describe("Endpoint Delete Failures", () => {
    it("should handle endpoint delete failures gracefully", async () => {
      mockRegistry = createMockRegistry([]);
      manager = new BridgeEndpointManager(
        mockClient,
        mockRegistry,
        mockLogger,
      );

      // Create a mock endpoint that will fail to delete
      const mockEndpoint = {
        entityId: "light.test",
        delete: vi.fn().mockRejectedValueOnce(new Error("Delete failed")),
      };

      // Mock parts.map to return our mock endpoint
      vi.spyOn(manager.root.parts, "map").mockReturnValueOnce([
        mockEndpoint,
      ] as any);

      // This should not throw
      await expect(manager.refreshDevices()).resolves.not.toThrow();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete endpoint"),
      );
    });
  });

  describe("ReadOnly FailedDevices", () => {
    it("should return readonly array of failed devices", async () => {
      mockRegistry = createMockRegistry(["light.test"]);
      manager = new BridgeEndpointManager(
        mockClient,
        mockRegistry,
        mockLogger,
      );

      const { LegacyEndpoint } = await import(
        "../../matter/endpoints/legacy/legacy-endpoint.js"
      );
      vi.mocked(LegacyEndpoint.create).mockRejectedValueOnce(
        new InvalidDeviceError("Test error"),
      );

      await manager.refreshDevices();

      const failedDevices = manager.getFailedDevices();

      // Type should be ReadonlyArray
      expect(failedDevices).toBeInstanceOf(Array);
      expect(failedDevices).toHaveLength(1);

      // Should be a new array (not direct reference)
      const failedDevices2 = manager.getFailedDevices();
      expect(failedDevices).not.toBe(failedDevices2);
    });
  });
});
