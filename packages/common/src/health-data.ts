import type { BridgeStatus } from "./bridge-data.js";

/**
 * Overall health status of the application
 */
export enum HealthStatus {
  /** All systems operational */
  healthy = "healthy",
  /** Some issues but still functional */
  degraded = "degraded",
  /** Critical issues affecting functionality */
  unhealthy = "unhealthy",
}

/**
 * Basic health information
 */
export interface HealthData {
  /** Overall health status */
  readonly status: HealthStatus;
  /** Application uptime in milliseconds */
  readonly uptime: number;
  /** Current timestamp */
  readonly timestamp: number;
}

/**
 * Health information for a single bridge
 */
export interface BridgeHealthInfo {
  /** Bridge ID */
  readonly id: string;
  /** Bridge name */
  readonly name: string;
  /** Bridge status */
  readonly status: BridgeStatus;
  /** Number of successfully loaded devices */
  readonly deviceCount: number;
  /** Number of devices that failed to load */
  readonly failedDeviceCount: number;
  /** Whether the bridge has been commissioned */
  readonly isCommissioned: boolean;
}

/**
 * System information
 */
export interface SystemInfo {
  /** Node.js version */
  readonly nodeVersion: string;
  /** Operating system platform */
  readonly platform: string;
  /** Architecture */
  readonly arch: string;
}

/**
 * Detailed health information including all subsystems
 */
export interface DetailedHealthData extends HealthData {
  /** Application version */
  readonly version: string;
  /** Health status of all bridges */
  readonly bridges: readonly BridgeHealthInfo[];
  /** System information */
  readonly system: SystemInfo;
}
