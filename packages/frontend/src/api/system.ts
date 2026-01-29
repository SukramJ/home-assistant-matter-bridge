export interface SystemMetrics {
  cpu: {
    model: string;
    cores: number;
    arch: string;
    usage: number;
    loadAverage: [number, number, number];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
    process: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
  };
  storage: {
    location: string;
    exists: boolean;
    total: number;
    free: number;
    used: number;
  };
  process: {
    pid: number;
    uptime: number;
    nodeVersion: string;
    appVersion: string;
  };
  platform: {
    platform: string;
    release: string;
    type: string;
    hostname: string;
    homedir: string;
    tmpdir: string;
  };
  network: {
    interfaces: Record<
      string,
      Array<{
        address: string;
        netmask: string;
        family: string;
        mac: string;
        internal: boolean;
      }>
    >;
  };
}

export async function fetchSystemInfo(): Promise<SystemMetrics> {
  const res = await fetch("api/system/info");
  return res.json() as Promise<SystemMetrics>;
}
