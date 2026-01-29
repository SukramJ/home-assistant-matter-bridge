import type {
  BridgeData,
  CreateBridgeRequest,
  UpdateBridgeRequest,
} from "@home-assistant-matter-bridge/common";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Bridge } from "../services/bridges/bridge.js";
import type { BridgeService } from "../services/bridges/bridge-service.js";
import { matterApi } from "./matter-api.js";

const createMockBridge = (data: Partial<BridgeData> = {}): Bridge => {
  const bridgeData: BridgeData = {
    id: "test-bridge-123",
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

  const mockBridge = {
    id: bridgeData.id,
    data: bridgeData,
    server: {},
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

  return mockBridge;
};

const createMockBridgeService = (): BridgeService => {
  const bridges: Bridge[] = [];

  return {
    bridges,
    get: vi.fn((id: string) => bridges.find((b) => b.id === id)),
    create: vi.fn(async (req: CreateBridgeRequest) => {
      const bridge = createMockBridge({
        id: `bridge-${bridges.length + 1}`,
        ...req,
      });
      bridges.push(bridge);
      return bridge;
    }),
    update: vi.fn(async (req: UpdateBridgeRequest) => {
      const bridge = bridges.find((b) => b.id === req.id);
      if (bridge) {
        await bridge.update(req);
      }
      return bridge;
    }),
    delete: vi.fn(async (id: string) => {
      const index = bridges.findIndex((b) => b.id === id);
      if (index >= 0) {
        bridges.splice(index, 1);
      }
    }),
  } as unknown as BridgeService;
};

describe("Matter API", () => {
  let app: express.Application;
  let bridgeService: BridgeService;

  beforeEach(() => {
    bridgeService = createMockBridgeService();
    app = express();
    app.use(express.json());
    app.use("/api", matterApi(bridgeService));
  });

  describe("GET /api", () => {
    it("should return empty object", async () => {
      const response = await request(app).get("/api");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });
  });

  describe("GET /api/bridges", () => {
    it("should return empty array when no bridges exist", async () => {
      const response = await request(app).get("/api/bridges");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("should return all bridges", async () => {
      const bridge1 = createMockBridge({ id: "bridge-1", name: "Bridge 1" });
      const bridge2 = createMockBridge({ id: "bridge-2", name: "Bridge 2" });
      bridgeService.bridges.push(bridge1, bridge2);

      const response = await request(app).get("/api/bridges");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe("bridge-1");
      expect(response.body[1].id).toBe("bridge-2");
    });
  });

  describe("POST /api/bridges", () => {
    it("should create a new bridge with valid request", async () => {
      const createRequest: CreateBridgeRequest = {
        name: "New Bridge",
        port: 5540,
        filter: { include: [], exclude: [] },
      };

      const response = await request(app)
        .post("/api/bridges")
        .send(createRequest);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("New Bridge");
      expect(response.body.port).toBe(5540);
      expect(bridgeService.create).toHaveBeenCalledWith(createRequest);
    });

    it("should return 400 for invalid request", async () => {
      const invalidRequest = {
        name: "Test",
        // Missing required fields
      };

      const response = await request(app)
        .post("/api/bridges")
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
    });

    it("should validate port number", async () => {
      const invalidRequest = {
        name: "Test",
        port: "not-a-number", // Invalid port type
        filter: { include: [], exclude: [] },
      };

      const response = await request(app)
        .post("/api/bridges")
        .send(invalidRequest);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/bridges/:bridgeId", () => {
    it("should return bridge by ID", async () => {
      const bridge = createMockBridge({ id: "test-123", name: "Test" });
      bridgeService.bridges.push(bridge);

      const response = await request(app).get("/api/bridges/test-123");

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("test-123");
      expect(response.body.name).toBe("Test");
    });

    it("should return 404 for non-existent bridge", async () => {
      const response = await request(app).get("/api/bridges/non-existent");

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/bridges/:bridgeId", () => {
    it("should update existing bridge", async () => {
      const bridge = createMockBridge({ id: "test-123", name: "Original" });
      bridgeService.bridges.push(bridge);

      const updateRequest: UpdateBridgeRequest = {
        id: "test-123",
        name: "Updated",
        port: 5541,
        filter: { include: [], exclude: [] },
      };

      const response = await request(app)
        .put("/api/bridges/test-123")
        .send(updateRequest);

      expect(response.status).toBe(200);
      expect(bridgeService.update).toHaveBeenCalledWith(updateRequest);
    });

    it("should return 400 if path ID doesn't match body ID", async () => {
      const updateRequest: UpdateBridgeRequest = {
        id: "different-id",
        name: "Test",
        port: 5540,
        filter: { include: [], exclude: [] },
      };

      const response = await request(app)
        .put("/api/bridges/test-123")
        .send(updateRequest);

      expect(response.status).toBe(400);
      expect(response.text).toContain("does not match");
    });

    it("should return 404 for non-existent bridge", async () => {
      const updateRequest: UpdateBridgeRequest = {
        id: "non-existent",
        name: "Test",
        port: 5540,
        filter: { include: [], exclude: [] },
      };

      const response = await request(app)
        .put("/api/bridges/non-existent")
        .send(updateRequest);

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid request schema", async () => {
      const invalidRequest = {
        id: "test-123",
        name: 123, // Invalid type
        port: 5540,
      };

      const response = await request(app)
        .put("/api/bridges/test-123")
        .send(invalidRequest);

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/bridges/:bridgeId", () => {
    it("should delete bridge", async () => {
      const bridge = createMockBridge({ id: "test-123" });
      bridgeService.bridges.push(bridge);

      const response = await request(app).delete("/api/bridges/test-123");

      expect(response.status).toBe(204);
      expect(bridgeService.delete).toHaveBeenCalledWith("test-123");
    });

    it("should return 204 even for non-existent bridge", async () => {
      const response = await request(app).delete("/api/bridges/non-existent");

      expect(response.status).toBe(204);
    });
  });

  describe("GET /api/bridges/:bridgeId/actions/factory-reset", () => {
    it("should factory reset bridge and restart it", async () => {
      const bridge = createMockBridge({ id: "test-123" });
      bridgeService.bridges.push(bridge);

      const response = await request(app).get(
        "/api/bridges/test-123/actions/factory-reset",
      );

      expect(response.status).toBe(200);
      expect(bridge.factoryReset).toHaveBeenCalled();
      expect(bridge.start).toHaveBeenCalled();
      expect(response.body.id).toBe("test-123");
    });

    it("should return 404 for non-existent bridge", async () => {
      const response = await request(app).get(
        "/api/bridges/non-existent/actions/factory-reset",
      );

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/bridges/:bridgeId/devices", () => {
    it("should return devices for bridge", async () => {
      const bridge = createMockBridge({ id: "test-123" });
      // Mock server with proper structure for endpointToJson
      Object.defineProperty(bridge, "server", {
        value: {
          id: "root",
          number: 0,
          type: { name: "MatterBridge", deviceType: 0x0016 },
          state: {},
          parts: [],
        },
        writable: false,
      });
      bridgeService.bridges.push(bridge);

      const response = await request(app).get("/api/bridges/test-123/devices");

      expect(response.status).toBe(200);
      // Response will depend on endpointToJson implementation
      expect(response.body).toBeDefined();
    });

    it("should return 404 for non-existent bridge", async () => {
      const response = await request(app).get(
        "/api/bridges/non-existent/devices",
      );

      expect(response.status).toBe(404);
    });
  });

  describe("Content-Type handling", () => {
    it("should accept JSON content type", async () => {
      const createRequest: CreateBridgeRequest = {
        name: "Test",
        port: 5540,
        filter: { include: [], exclude: [] },
      };

      const response = await request(app)
        .post("/api/bridges")
        .set("Content-Type", "application/json")
        .send(createRequest);

      expect(response.status).toBe(200);
    });
  });

  describe("Error handling", () => {
    it("should handle service errors gracefully", async () => {
      vi.mocked(bridgeService.create).mockRejectedValueOnce(
        new Error("Port already in use: 5540"),
      );

      const createRequest: CreateBridgeRequest = {
        name: "Test",
        port: 5540,
        filter: { include: [], exclude: [] },
      };

      const response = await request(app)
        .post("/api/bridges")
        .send(createRequest);

      expect(response.status).toBe(500);
      expect(response.text).toContain("Port already in use: 5540");
    });
  });
});
