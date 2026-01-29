import type { Server as HttpServer } from "node:http";
import type { BetterLogger } from "../core/app/logger.js";
import { Service } from "../core/ioc/service.js";
import type { BridgeService } from "../services/bridges/bridge-service.js";
import { WebSocketServer, type WebSocket } from "ws";

export interface WebSocketMessage {
  type: string;
  data: unknown;
}

/**
 * WebSocket server for real-time updates
 */
export class WebSocketServerService extends Service {
  private wss?: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(
    private readonly log: BetterLogger,
    private readonly bridgeService: BridgeService,
  ) {
    super("WebSocketServer");
  }

  /**
   * Attach WebSocket server to HTTP server
   */
  attach(httpServer: HttpServer): void {
    this.wss = new WebSocketServer({
      server: httpServer,
      path: "/ws",
    });

    this.wss.on("connection", (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    this.log.info("WebSocket server initialized on /ws");

    // Subscribe to bridge service events
    this.subscribeToEvents();
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);
    this.log.debug(`WebSocket client connected. Total clients: ${this.clients.size}`);

    // Send initial state
    this.sendMessage(ws, {
      type: "connected",
      data: {
        message: "Connected to Home Assistant Matter Bridge WebSocket",
        timestamp: Date.now(),
      },
    });

    // Send current bridge states
    const bridges = this.bridgeService.bridges.map((b) => ({
      id: b.data.id,
      name: b.data.name,
      status: b.data.status,
      deviceCount: b.data.deviceCount,
      failedDeviceCount: b.data.failedDevices?.length ?? 0,
    }));

    this.sendMessage(ws, {
      type: "bridges:initial",
      data: bridges,
    });

    ws.on("close", () => {
      this.clients.delete(ws);
      this.log.debug(`WebSocket client disconnected. Total clients: ${this.clients.size}`);
    });

    ws.on("error", (error) => {
      this.log.error(`WebSocket error: ${error.message}`);
      this.clients.delete(ws);
    });

    // Handle ping/pong for keepalive
    ws.on("pong", () => {
      // Client is alive
    });
  }

  /**
   * Subscribe to bridge service events
   */
  private subscribeToEvents(): void {
    // Note: This would require BridgeService to emit events
    // For now, we'll use polling as a simple implementation
    // In production, BridgeService should emit events when state changes

    // Simple polling for demo (replace with actual event subscriptions)
    setInterval(() => {
      this.broadcastBridgeStates();
    }, 5000); // Every 5 seconds
  }

  /**
   * Broadcast current bridge states to all clients
   */
  private broadcastBridgeStates(): void {
    const bridges = this.bridgeService.bridges.map((b) => ({
      id: b.data.id,
      name: b.data.name,
      status: b.data.status,
      deviceCount: b.data.deviceCount,
      failedDeviceCount: b.data.failedDevices?.length ?? 0,
      isCommissioned: b.data.commissioning?.isCommissioned ?? false,
      fabricCount: b.data.commissioning?.fabrics.length ?? 0,
    }));

    this.broadcast({
      type: "bridges:update",
      data: bridges,
    });
  }

  /**
   * Send message to specific client
   */
  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: WebSocketMessage): void {
    const json = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(json);
      }
    });
  }

  /**
   * Send keepalive pings to all clients
   */
  startKeepalive(): void {
    setInterval(() => {
      this.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.ping();
        } else {
          this.clients.delete(client);
        }
      });
    }, 30000); // Ping every 30 seconds
  }

  override async dispose(): Promise<void> {
    this.clients.forEach((client) => client.close());
    this.clients.clear();
    this.wss?.close();
  }
}
