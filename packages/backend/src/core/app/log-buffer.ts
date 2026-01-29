/**
 * A single log entry
 */
export interface LogEntry {
  /** Timestamp when log was created */
  readonly timestamp: number;
  /** Log level (numeric value from MatterLogLevel) */
  readonly level: number;
  /** Logger name/facility */
  readonly facility: string;
  /** Log message */
  readonly message: string;
}

/**
 * Ring buffer for storing log entries
 * Automatically evicts oldest entries when buffer is full
 */
export class LogBuffer {
  private buffer: LogEntry[] = [];
  private head = 0;
  private size = 0;

  constructor(private readonly maxSize: number) {
    if (maxSize <= 0) {
      throw new Error("Buffer size must be positive");
    }
  }

  /**
   * Add a log entry to the buffer
   */
  add(entry: LogEntry): void {
    if (this.size < this.maxSize) {
      this.buffer.push(entry);
      this.size++;
    } else {
      this.buffer[this.head] = entry;
      this.head = (this.head + 1) % this.maxSize;
    }
  }

  /**
   * Get all log entries in chronological order
   */
  getAll(): readonly LogEntry[] {
    if (this.size < this.maxSize) {
      return [...this.buffer];
    }

    // Buffer is full, need to return in correct order
    const result: LogEntry[] = [];
    for (let i = 0; i < this.size; i++) {
      const index = (this.head + i) % this.maxSize;
      result.push(this.buffer[index]);
    }
    return result;
  }

  /**
   * Get filtered log entries
   */
  getFiltered(options: {
    level?: number;
    facility?: string;
    search?: string;
    since?: number;
    limit?: number;
  }): readonly LogEntry[] {
    let entries = this.getAll();

    // Filter by level
    if (options.level !== undefined) {
      const minLevel = options.level;
      entries = entries.filter((e) => e.level >= minLevel);
    }

    // Filter by facility (case-insensitive partial match)
    if (options.facility) {
      const facilityLower = options.facility.toLowerCase();
      entries = entries.filter((e) =>
        e.facility.toLowerCase().includes(facilityLower),
      );
    }

    // Filter by search term in message (case-insensitive)
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      entries = entries.filter((e) =>
        e.message.toLowerCase().includes(searchLower),
      );
    }

    // Filter by timestamp
    if (options.since !== undefined) {
      const since = options.since;
      entries = entries.filter((e) => e.timestamp >= since);
    }

    // Apply limit
    if (options.limit !== undefined && options.limit > 0) {
      entries = entries.slice(-options.limit);
    }

    return entries;
  }

  /**
   * Clear all log entries
   */
  clear(): void {
    this.buffer = [];
    this.head = 0;
    this.size = 0;
  }

  /**
   * Get current number of entries in buffer
   */
  get length(): number {
    return this.size;
  }
}
