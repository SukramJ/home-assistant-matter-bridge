/**
 * System metrics and information types
 */

export interface SystemMetrics {
  /**
   * CPU information
   */
  cpu: CpuInfo;

  /**
   * Memory statistics
   */
  memory: MemoryInfo;

  /**
   * Storage information
   */
  storage: StorageInfo;

  /**
   * Process information
   */
  process: ProcessInfo;

  /**
   * Platform information
   */
  platform: PlatformInfo;

  /**
   * Network information
   */
  network: NetworkInfo;
}

export interface CpuInfo {
  /**
   * CPU model name
   */
  model: string;

  /**
   * Number of CPU cores
   */
  cores: number;

  /**
   * CPU architecture (x64, arm64, etc.)
   */
  arch: string;

  /**
   * CPU usage percentage (0-100)
   */
  usage: number;

  /**
   * Load average [1min, 5min, 15min]
   */
  loadAverage: [number, number, number];
}

export interface MemoryInfo {
  /**
   * Total system memory in bytes
   */
  total: number;

  /**
   * Free system memory in bytes
   */
  free: number;

  /**
   * Used system memory in bytes
   */
  used: number;

  /**
   * Memory usage percentage (0-100)
   */
  usagePercent: number;

  /**
   * Process memory usage
   */
  process: {
    /**
     * Resident Set Size (total memory allocated)
     */
    rss: number;

    /**
     * Heap total
     */
    heapTotal: number;

    /**
     * Heap used
     */
    heapUsed: number;

    /**
     * External memory
     */
    external: number;

    /**
     * Array buffers
     */
    arrayBuffers: number;
  };
}

export interface StorageInfo {
  /**
   * Storage location path
   */
  location: string;

  /**
   * Whether storage location exists
   */
  exists: boolean;

  /**
   * Total storage size in bytes (0 if unavailable)
   */
  total: number;

  /**
   * Free storage space in bytes (0 if unavailable)
   */
  free: number;

  /**
   * Used storage space in bytes (0 if unavailable)
   */
  used: number;
}

export interface ProcessInfo {
  /**
   * Process ID
   */
  pid: number;

  /**
   * Process uptime in seconds
   */
  uptime: number;

  /**
   * Node.js version
   */
  nodeVersion: string;

  /**
   * Application version
   */
  appVersion: string;
}

export interface PlatformInfo {
  /**
   * Operating system platform (darwin, linux, win32)
   */
  platform: string;

  /**
   * Operating system release version
   */
  release: string;

  /**
   * Operating system type (Linux, Darwin, Windows_NT)
   */
  type: string;

  /**
   * Hostname
   */
  hostname: string;

  /**
   * Home directory
   */
  homedir: string;

  /**
   * Temp directory
   */
  tmpdir: string;
}

export interface NetworkInfo {
  /**
   * Network interfaces with addresses
   */
  interfaces: Record<string, NetworkInterface[]>;
}

export interface NetworkInterface {
  /**
   * Interface address
   */
  address: string;

  /**
   * Netmask
   */
  netmask: string;

  /**
   * Address family (IPv4 or IPv6)
   */
  family: string;

  /**
   * MAC address
   */
  mac: string;

  /**
   * Whether this is an internal interface
   */
  internal: boolean;
}
