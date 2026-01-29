import { useCallback, useEffect, useState } from "react";
import { fetchSystemInfo, type SystemMetrics } from "../api/system.js";

export type { SystemMetrics };

export function useSystemInfo(autoRefresh = false, refreshInterval = 5000) {
  const [systemInfo, setSystemInfo] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSystemInfo();
      setSystemInfo(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch system info"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return { systemInfo, loading, error, refresh };
}
