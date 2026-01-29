import type {
  BridgeData,
  CreateBridgeRequest,
  UpdateBridgeRequest,
} from "@home-assistant-matter-bridge/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BridgeStorage } from "../storage/bridge-storage.js";
import type { Bridge } from "./bridge.js";
import type { BridgeFactory } from "./bridge-factory.js";
import { BridgeService } from "./bridge-service.js";

// Mock Bridge class
const createMockBridge = (data: Partial<BridgeData> = {}): Bridge => {
  const bridgeData: BridgeData = {
    id: "test-bridge-id",
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
    ...data,
  };

  return {
    id: bridgeData.id,
    data: bridgeData,
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    refreshDevices: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockImplementation(async (req) => {
      Object.assign(bridgeData, req);
    }),
    dispose: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    factoryReset: vi.fn().mockResolvedValue(undefined),
  } as unknown as Bridge;
};

// Mock BridgeStorage
const createMockStorage = (
  initialBridges: BridgeData[] = [],
): BridgeStorage => {
  const bridges: BridgeData[] = [...initialBridges];
  return {
    get bridges(): readonly BridgeData[] {
      return bridges;
    },
    add: vi.fn().mockImplementation((bridge: BridgeData) => {
      const index = bridges.findIndex((b) => b.id === bridge.id);
      if (index >= 0) {
        bridges[index] = bridge;
      } else {
        bridges.push(bridge);
      }
    }),
    remove: vi.fn().mockImplementation((id: string) => {
      const index = bridges.findIndex((b) => b.id === id);
      if (index >= 0) {
        bridges.splice(index, 1);
      }
    }),
  } as unknown as BridgeStorage;
};

// Mock BridgeFactory
const createMockFactory = (): BridgeFactory => {
  return {
    create: vi.fn().mockImplementation((data: BridgeData) => {
      return Promise.resolve(createMockBridge(data));
    }),
  } as unknown as BridgeFactory;
};

describe("BridgeService", () => {
  let service: BridgeService;
  let storage: BridgeStorage;
  let factory: BridgeFactory;

  const basicInformation = {
    vendorId: 0xfff1,
    vendorName: "test",
    productId: 0x8000,
    productName: "TestBridge",
    productLabel: "Test Matter Bridge",
    hardwareVersion: 2024,
    softwareVersion: 2024,
  };

  beforeEach(() => {
    storage = createMockStorage();
    factory = createMockFactory();
    service = new BridgeService(storage, factory, { basicInformation });
  });

  describe("create", () => {
    it("should create a new bridge with valid configuration", async () => {
      const request: CreateBridgeRequest = {
        name: "New Bridge",
        port: 5540,
        filter: { include: [], exclude: [] },
      };

      const bridge = await service.create(request);

      expect(bridge).toBeDefined();
      expect(bridge.data.name).toBe("New Bridge");
      expect(bridge.data.port).toBe(5540);
      expect(storage.add).toHaveBeenCalledWith(bridge.data);
      expect(bridge.start).toHaveBeenCalled();
    });

    it("should generate unique ID for new bridge", async () => {
      const request: CreateBridgeRequest = {
        name: "Bridge 1",
        port: 5540,
        filter: { include: [], exclude: [] },
      };

      const bridge1 = await service.create(request);
      const bridge2 = await service.create({
        ...request,
        port: 5541,
      });

      expect(bridge1.id).toBeDefined();
      expect(bridge2.id).toBeDefined();
      expect(bridge1.id).not.toBe(bridge2.id);
    });

    it("should throw error if port is already in use", async () => {
      const request: CreateBridgeRequest = {
        name: "Bridge 1",
        port: 5540,
        filter: { include: [], exclude: [] },
      };

      await service.create(request);

      await expect(service.create(request)).rejects.toThrow(
        "Port already in use: 5540",
      );
    });

    it("should include basicInformation in created bridge", async () => {
      const request: CreateBridgeRequest = {
        name: "Test",
        port: 5540,
        filter: { include: [], exclude: [] },
      };

      const bridge = await service.create(request);

      expect(bridge.data.basicInformation).toEqual(basicInformation);
    });
  });

  describe("update", () => {
    it("should update existing bridge configuration", async () => {
      const createReq: CreateBridgeRequest = {
        name: "Original",
        port: 5540,
        filter: { include: [], exclude: [] },
      };

      const bridge = await service.create(createReq);
      const updateReq: UpdateBridgeRequest = {
        id: bridge.id,
        name: "Updated",
        port: 5540,
        filter: { include: [], exclude: [] },
      };

      const updated = await service.update(updateReq);

      expect(updated).toBeDefined();
      expect(bridge.update).toHaveBeenCalledWith(updateReq);
      expect(storage.add).toHaveBeenCalledWith(bridge.data);
    });

    it("should return undefined for non-existent bridge", async () => {
      const updateReq: UpdateBridgeRequest = {
        id: "non-existent",
        name: "Test",
        port: 5540,
        filter: { include: [], exclude: [] },
      };

      const result = await service.update(updateReq);

      expect(result).toBeUndefined();
    });

    it("should throw error if new port is already in use", async () => {
      const bridge1 = await service.create({
        name: "Bridge 1",
        port: 5540,
        filter: { include: [], exclude: [] },
      });

      await service.create({
        name: "Bridge 2",
        port: 5541,
        filter: { include: [], exclude: [] },
      });

      const updateReq: UpdateBridgeRequest = {
        id: bridge1.id,
        name: "Bridge 1",
        port: 5541, // Already used by Bridge 2
        filter: { include: [], exclude: [] },
      };

      await expect(service.update(updateReq)).rejects.toThrow(
        "Port already in use: 5541",
      );
    });

    it("should allow updating bridge with same port", async () => {
      const bridge = await service.create({
        name: "Original",
        port: 5540,
        filter: { include: [], exclude: [] },
      });

      const updateReq: UpdateBridgeRequest = {
        id: bridge.id,
        name: "Updated",
        port: 5540, // Same port
        filter: { include: [], exclude: [] },
      };

      const result = await service.update(updateReq);

      expect(result).toBeDefined();
    });
  });

  describe("delete", () => {
    it("should delete bridge and stop it", async () => {
      const bridge = await service.create({
        name: "Test",
        port: 5540,
        filter: { include: [], exclude: [] },
      });

      await service.delete(bridge.id);

      expect(bridge.stop).toHaveBeenCalled();
      expect(storage.remove).toHaveBeenCalledWith(bridge.id);
      expect(service.get(bridge.id)).toBeUndefined();
    });

    it("should not throw error when deleting non-existent bridge", async () => {
      await expect(service.delete("non-existent")).resolves.not.toThrow();
    });
  });

  describe("get", () => {
    it("should retrieve bridge by ID", async () => {
      const bridge = await service.create({
        name: "Test",
        port: 5540,
        filter: { include: [], exclude: [] },
      });

      const retrieved = service.get(bridge.id);

      expect(retrieved).toBe(bridge);
    });

    it("should return undefined for non-existent bridge", () => {
      const result = service.get("non-existent");

      expect(result).toBeUndefined();
    });
  });

  describe("startAll", () => {
    it("should start all bridges", async () => {
      const bridge1 = await service.create({
        name: "Bridge 1",
        port: 5540,
        filter: { include: [], exclude: [] },
      });

      const bridge2 = await service.create({
        name: "Bridge 2",
        port: 5541,
        filter: { include: [], exclude: [] },
      });

      // Clear previous calls
      vi.mocked(bridge1.start).mockClear();
      vi.mocked(bridge2.start).mockClear();

      await service.startAll();

      expect(bridge1.start).toHaveBeenCalled();
      expect(bridge2.start).toHaveBeenCalled();
    });
  });

  describe("refreshAll", () => {
    it("should refresh devices on all bridges", async () => {
      const bridge1 = await service.create({
        name: "Bridge 1",
        port: 5540,
        filter: { include: [], exclude: [] },
      });

      const bridge2 = await service.create({
        name: "Bridge 2",
        port: 5541,
        filter: { include: [], exclude: [] },
      });

      await service.refreshAll();

      expect(bridge1.refreshDevices).toHaveBeenCalled();
      expect(bridge2.refreshDevices).toHaveBeenCalled();
    });
  });

  describe("initialization", () => {
    it("should start with empty bridges array", () => {
      const newService = new BridgeService(storage, factory, {
        basicInformation,
      });

      expect(newService.bridges).toHaveLength(0);
    });
  });

  describe("dispose", () => {
    it("should dispose all bridges", async () => {
      const bridge1 = await service.create({
        name: "Bridge 1",
        port: 5540,
        filter: { include: [], exclude: [] },
      });

      const bridge2 = await service.create({
        name: "Bridge 2",
        port: 5541,
        filter: { include: [], exclude: [] },
      });

      await service.dispose();

      expect(bridge1.dispose).toHaveBeenCalled();
      expect(bridge2.dispose).toHaveBeenCalled();
    });
  });
});
