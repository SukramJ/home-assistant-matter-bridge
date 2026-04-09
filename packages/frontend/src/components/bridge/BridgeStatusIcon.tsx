import { BridgeStatus } from "@home-assistant-matter-bridge/common";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import PauseCircleOutlinedIcon from "@mui/icons-material/PauseCircleOutlined";
import PlayCircleOutlinedIcon from "@mui/icons-material/PlayCircleOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

export interface BridgeStatusIconProps {
  status: BridgeStatus;
  reason?: string;
}

export const BridgeStatusIcon = ({ status }: BridgeStatusIconProps) => {
  switch (status) {
    case BridgeStatus.Starting:
      return <RestartAltIcon fontSize="inherit" color="info" />;
    case BridgeStatus.Running:
      return <PlayCircleOutlinedIcon fontSize="inherit" color="success" />;
    case BridgeStatus.Stopped:
      return <PauseCircleOutlinedIcon fontSize="inherit" color="warning" />;
    case BridgeStatus.Failed:
      return <ErrorOutlineOutlinedIcon fontSize="inherit" color="error" />;
  }
};
