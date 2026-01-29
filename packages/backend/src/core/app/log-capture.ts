import { Service } from "../ioc/service.js";
import { LogBuffer, type LogEntry } from "./log-buffer.js";

/**
 * Maximum number of log entries to keep in memory
 */
const DEFAULT_BUFFER_SIZE = 1000;

/**
 * Service for capturing and storing application logs
 */
export class LogCaptureService extends Service {
  private static instance: LogCaptureService | null = null;
  private readonly buffer: LogBuffer;

  constructor(bufferSize: number = DEFAULT_BUFFER_SIZE) {
    super("LogCaptureService");
    this.buffer = new LogBuffer(bufferSize);
    LogCaptureService.instance = this;
  }

  /**
   * Capture a log entry
   */
  capture(level: number, facility: string, message: string): void {
    this.buffer.add({
      timestamp: Date.now(),
      level,
      facility,
      message,
    });
  }

  /**
   * Get all log entries
   */
  getLogs(): readonly LogEntry[] {
    return this.buffer.getAll();
  }

  /**
   * Get filtered log entries
   */
  getFilteredLogs(options: {
    level?: number;
    facility?: string;
    search?: string;
    since?: number;
    limit?: number;
  }): readonly LogEntry[] {
    return this.buffer.getFiltered(options);
  }

  /**
   * Clear all captured logs
   */
  clearLogs(): void {
    this.buffer.clear();
  }

  /**
   * Get current number of captured logs
   */
  get logCount(): number {
    return this.buffer.length;
  }

  /**
   * Get the global log capture instance
   */
  static getInstance(): LogCaptureService | null {
    return LogCaptureService.instance;
  }
}
