export interface LogEntry {
  timestamp: number;
  level: number;
  facility: string;
  message: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  count: number;
  total: number;
}

export interface LogFilters {
  level?: number;
  facility?: string;
  search?: string;
  since?: number;
  limit?: number;
}

export async function fetchLogs(filters?: LogFilters): Promise<LogsResponse> {
  const params = new URLSearchParams();
  if (filters?.level !== undefined)
    params.set("level", filters.level.toString());
  if (filters?.facility) params.set("facility", filters.facility);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.since) params.set("since", filters.since.toString());
  if (filters?.limit) params.set("limit", filters.limit.toString());

  const res = await fetch(`api/logs?${params.toString()}`);
  return res.json() as Promise<LogsResponse>;
}

export async function clearLogs(): Promise<void> {
  await fetch("api/logs", {
    method: "DELETE",
  });
}
