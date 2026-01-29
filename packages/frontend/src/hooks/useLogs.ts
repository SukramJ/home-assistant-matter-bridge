import { useCallback, useEffect, useState } from "react";
import {
  clearLogs as apiClearLogs,
  fetchLogs,
  type LogEntry,
  type LogFilters,
} from "../api/logs.js";

export type { LogEntry, LogFilters };

export function useLogs(filters?: LogFilters) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchLogs(filters);
      setLogs(response.logs);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch logs"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const clearLogs = useCallback(async () => {
    try {
      await apiClearLogs();
      setLogs([]);
      setTotal(0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to clear logs"));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { logs, total, loading, error, refresh, clearLogs };
}
