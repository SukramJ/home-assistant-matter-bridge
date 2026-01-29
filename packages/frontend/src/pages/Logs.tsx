import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import { type LogFilters, useLogs } from "../hooks/useLogs.js";

const LOG_LEVELS = [
  { value: 0, label: "DEBUG", color: "#9E9E9E" },
  { value: 1, label: "INFO", color: "#2196F3" },
  { value: 2, label: "NOTICE", color: "#00BCD4" },
  { value: 3, label: "WARN", color: "#FF9800" },
  { value: 4, label: "ERROR", color: "#F44336" },
  { value: 5, label: "FATAL", color: "#D32F2F" },
];

export function Logs() {
  const [filters, setFilters] = useState<LogFilters>({ limit: 500 });
  const [autoScroll, setAutoScroll] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const tableEndRef = useRef<HTMLDivElement>(null);

  const { logs, total, loading, error, refresh, clearLogs } = useLogs(filters);

  // Auto-scroll to bottom when logs change
  // biome-ignore lint/correctness/useExhaustiveDependencies: logs needed to trigger scroll on new data
  useEffect(() => {
    if (autoScroll && tableEndRef.current) {
      tableEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // Auto-refresh every 5 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  const handleClearLogs = async () => {
    if (window.confirm("Are you sure you want to clear all logs?")) {
      await clearLogs();
      refresh();
    }
  };

  const handleDownloadLogs = () => {
    const logText = logs
      .map((log) => {
        const timestamp = new Date(log.timestamp).toISOString();
        const level = LOG_LEVELS[log.level]?.label ?? "UNKNOWN";
        return `[${timestamp}] [${level}] [${log.facility}] ${log.message}`;
      })
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: number) => {
    return LOG_LEVELS[level]?.color ?? "#9E9E9E";
  };

  const getLevelLabel = (level: number) => {
    return LOG_LEVELS[level]?.label ?? "UNKNOWN";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Application Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and filter application logs. Total logs in buffer: {total}
          </Typography>
        </Box>

        {/* Filters */}
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Filters</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Log Level</InputLabel>
                  <Select
                    value={
                      filters.level !== undefined ? String(filters.level) : ""
                    }
                    label="Log Level"
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        level:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                  >
                    <MenuItem value="">All Levels</MenuItem>
                    {LOG_LEVELS.map((level) => (
                      <MenuItem key={level.value} value={String(level.value)}>
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Facility"
                  value={filters.facility ?? ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      facility: e.target.value || undefined,
                    })
                  }
                  sx={{ minWidth: 200 }}
                />

                <TextField
                  label="Search Message"
                  value={filters.search ?? ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      search: e.target.value || undefined,
                    })
                  }
                  sx={{ minWidth: 250 }}
                />

                <TextField
                  label="Limit"
                  type="number"
                  value={filters.limit ?? 500}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      limit: Number(e.target.value) || undefined,
                    })
                  }
                  sx={{ minWidth: 100 }}
                />
              </Stack>

              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                    />
                  }
                  label="Auto-scroll"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                  }
                  label="Auto-refresh (5s)"
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Actions */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={refresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadLogs}
            disabled={logs.length === 0}
          >
            Download Logs
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearLogs}
            disabled={total === 0}
          >
            Clear All Logs
          </Button>
        </Stack>

        {/* Error message */}
        {error && (
          <Paper sx={{ p: 2, bgcolor: "error.light" }}>
            <Typography color="error.contrastText">
              Error: {error.message}
            </Typography>
          </Paper>
        )}

        {/* Logs table */}
        <TableContainer component={Paper} sx={{ maxHeight: "600px" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell width="180">Timestamp</TableCell>
                <TableCell width="80">Level</TableCell>
                <TableCell width="150">Facility</TableCell>
                <TableCell>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 4 }}
                    >
                      No logs found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow
                  key={`${log.timestamp}-${log.facility}-${log.level}`}
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <TableCell
                    sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                  >
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: getLevelColor(log.level),
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      {getLevelLabel(log.level)}
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                  >
                    {log.facility}
                  </TableCell>
                  <TableCell
                    sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                  >
                    {log.message}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div ref={tableEndRef} />
        </TableContainer>
      </Stack>
    </Box>
  );
}
