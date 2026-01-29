import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import { useState } from "react";
import { useSystemInfo } from "../hooks/useSystemInfo.js";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

export function SystemInfo() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { systemInfo, loading, error, refresh } = useSystemInfo(
    autoRefresh,
    5000,
  );

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 2, bgcolor: "error.light" }}>
          <Typography color="error.contrastText">
            Error loading system info: {error.message}
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!systemInfo && loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!systemInfo) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            System Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time system metrics and information
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={refresh}
            disabled={loading}
          >
            Refresh
          </Button>
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

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          {/* CPU Information */}
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  CPU
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Model
                    </Typography>
                    <Typography variant="body1">{systemInfo.cpu.model}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Cores / Architecture
                    </Typography>
                    <Typography variant="body1">
                      {systemInfo.cpu.cores} cores / {systemInfo.cpu.arch}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Usage: {systemInfo.cpu.usage.toFixed(2)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, systemInfo.cpu.usage)}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        bgcolor: "grey.300",
                        "& .MuiLinearProgress-bar": {
                          bgcolor:
                            systemInfo.cpu.usage > 80
                              ? "error.main"
                              : systemInfo.cpu.usage > 50
                                ? "warning.main"
                                : "success.main",
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Load Average (1m / 5m / 15m)
                    </Typography>
                    <Typography variant="body1">
                      {systemInfo.cpu.loadAverage
                        .map((l) => l.toFixed(2))
                        .join(" / ")}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Memory Information */}
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Memory
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      System Memory
                    </Typography>
                    <Typography variant="body1">
                      {formatBytes(systemInfo.memory.used)} /{" "}
                      {formatBytes(systemInfo.memory.total)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Usage: {systemInfo.memory.usagePercent.toFixed(2)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={systemInfo.memory.usagePercent}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        bgcolor: "grey.300",
                        "& .MuiLinearProgress-bar": {
                          bgcolor:
                            systemInfo.memory.usagePercent > 80
                              ? "error.main"
                              : systemInfo.memory.usagePercent > 50
                                ? "warning.main"
                                : "success.main",
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Process Memory
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                      <Chip
                        label={`RSS: ${formatBytes(systemInfo.memory.process.rss)}`}
                        size="small"
                      />
                      <Chip
                        label={`Heap: ${formatBytes(systemInfo.memory.process.heapUsed)} / ${formatBytes(systemInfo.memory.process.heapTotal)}`}
                        size="small"
                      />
                      <Chip
                        label={`External: ${formatBytes(systemInfo.memory.process.external)}`}
                        size="small"
                      />
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Process Information */}
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Process
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            PID
                          </Typography>
                        </TableCell>
                        <TableCell>{systemInfo.process.pid}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            Uptime
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatUptime(systemInfo.process.uptime)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            Node.js Version
                          </Typography>
                        </TableCell>
                        <TableCell>{systemInfo.process.nodeVersion}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            App Version
                          </Typography>
                        </TableCell>
                        <TableCell>{systemInfo.process.appVersion}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Platform Information */}
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Platform
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            OS
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {systemInfo.platform.type} ({systemInfo.platform.platform})
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            Release
                          </Typography>
                        </TableCell>
                        <TableCell>{systemInfo.platform.release}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            Hostname
                          </Typography>
                        </TableCell>
                        <TableCell>{systemInfo.platform.hostname}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            Home Directory
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                          {systemInfo.platform.homedir}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Storage Information */}
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Storage
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                    >
                      {systemInfo.storage.location}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={systemInfo.storage.exists ? "Exists" : "Not Found"}
                      color={systemInfo.storage.exists ? "success" : "error"}
                      size="small"
                    />
                  </Box>
                  {systemInfo.storage.total > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Disk Space
                      </Typography>
                      <Typography variant="body1">
                        {formatBytes(systemInfo.storage.used)} /{" "}
                        {formatBytes(systemInfo.storage.total)}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Network Interfaces */}
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Network Interfaces
                </Typography>
                <Stack spacing={2}>
                  {Object.entries(systemInfo.network.interfaces).map(
                    ([name, addrs]) => (
                      <Box key={name}>
                        <Typography variant="body2" fontWeight="bold">
                          {name}
                        </Typography>
                        {addrs.map((addr, idx) => (
                          <Typography
                            key={idx}
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.75rem",
                              color: "text.secondary",
                              ml: 2,
                            }}
                          >
                            {addr.family}: {addr.address}
                            {addr.internal && " (internal)"}
                          </Typography>
                        ))}
                      </Box>
                    ),
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
