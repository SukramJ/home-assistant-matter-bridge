import * as os from "node:os";
import * as fs from "node:fs";
import { promisify } from "node:util";
import type {
  SystemMetrics,
  CpuInfo,
  MemoryInfo,
  StorageInfo,
  ProcessInfo,
  PlatformInfo,
  NetworkInfo,
} from "@home-assistant-matter-bridge/common";
import { Service } from "../../core/ioc/service.js";

const statAsync = promisify(fs.stat);

/**
 * Service for collecting system metrics and information
 */
export class SystemInfoService extends Service {
  private lastCpuUsage = process.cpuUsage();
  private lastCpuTime = Date.now();

  constructor(
    private readonly storageLocation: string,
    private readonly appVersion: string,
  ) {
    super("SystemInfoService");
  }

  /**
   * Get complete system metrics
   */
  async getSystemInfo(): Promise<SystemMetrics> {
    return {
      cpu: this.getCpuInfo(),
      memory: this.getMemoryInfo(),
      storage: await this.getStorageInfo(),
      process: this.getProcessInfo(),
      platform: this.getPlatformInfo(),
      network: this.getNetworkInfo(),
    };
  }

  /**
   * Get CPU information
   */
  private getCpuInfo(): CpuInfo {
    const cpus = os.cpus();
    const model = cpus[0]?.model ?? "Unknown";
    const cores = cpus.length;
    const arch = os.arch();
    const loadAverage = os.loadavg() as [number, number, number];

    // Calculate CPU usage
    const currentCpuUsage = process.cpuUsage();
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.lastCpuTime;

    const userUsage = currentCpuUsage.user - this.lastCpuUsage.user;
    const systemUsage = currentCpuUsage.system - this.lastCpuUsage.system;
    const totalUsage = userUsage + systemUsage;

    // Convert to percentage (cpuUsage is in microseconds)
    const usage = elapsedTime > 0 ? (totalUsage / (elapsedTime * 1000)) * 100 : 0;

    // Update for next calculation
    this.lastCpuUsage = currentCpuUsage;
    this.lastCpuTime = currentTime;

    return {
      model,
      cores,
      arch,
      usage: Math.min(100, Math.max(0, usage)),
      loadAverage,
    };
  }

  /**
   * Get memory information
   */
  private getMemoryInfo(): MemoryInfo {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usagePercent = (used / total) * 100;

    const memUsage = process.memoryUsage();

    return {
      total,
      free,
      used,
      usagePercent,
      process: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      },
    };
  }

  /**
   * Get storage information
   */
  private async getStorageInfo(): Promise<StorageInfo> {
    let exists = false;
    try {
      await statAsync(this.storageLocation);
      exists = true;
    } catch {
      // Storage location doesn't exist
    }

    // Note: Getting disk space is platform-specific and complex
    // For now, we'll return 0 for total/free/used
    // A proper implementation would use platform-specific commands
    return {
      location: this.storageLocation,
      exists,
      total: 0,
      free: 0,
      used: 0,
    };
  }

  /**
   * Get process information
   */
  private getProcessInfo(): ProcessInfo {
    return {
      pid: process.pid,
      uptime: process.uptime(),
      nodeVersion: process.version,
      appVersion: this.appVersion,
    };
  }

  /**
   * Get platform information
   */
  private getPlatformInfo(): PlatformInfo {
    return {
      platform: os.platform(),
      release: os.release(),
      type: os.type(),
      hostname: os.hostname(),
      homedir: os.homedir(),
      tmpdir: os.tmpdir(),
    };
  }

  /**
   * Get network information
   */
  private getNetworkInfo(): NetworkInfo {
    const interfaces = os.networkInterfaces();
    const formattedInterfaces: Record<string, NetworkInfo["interfaces"][string]> = {};

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;

      formattedInterfaces[name] = addrs.map((addr) => ({
        address: addr.address,
        netmask: addr.netmask,
        family: addr.family,
        mac: addr.mac,
        internal: addr.internal,
      }));
    }

    return {
      interfaces: formattedInterfaces,
    };
  }
}
