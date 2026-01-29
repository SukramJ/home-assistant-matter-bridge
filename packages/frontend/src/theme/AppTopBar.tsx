import {
  Dashboard as DashboardIcon,
  Info as InfoIcon,
  Article as LogsIcon,
} from "@mui/icons-material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useLocation, useNavigate } from "react-router";
import { navigation } from "../routes.tsx";
import { AppLogo } from "./AppLogo.tsx";

export const AppTopBar = () => {
  const isLargeScreen = useMediaQuery("(min-width:600px)");
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: navigation.bridges, label: "Bridges", icon: <DashboardIcon /> },
    { path: navigation.logs, label: "Logs", icon: <LogsIcon /> },
    { path: navigation.systemInfo, label: "System", icon: <InfoIcon /> },
  ];

  return (
    <AppBar sx={{ height: "72px" }}>
      <Toolbar
        sx={{ paddingLeft: "0 !important", paddingRight: "0 !important" }}
      >
        <Container
          sx={{
            padding: 2,
            height: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <AppLogo large={isLargeScreen} />
          <Box sx={{ display: "flex", gap: 1 }}>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  borderBottom: location.pathname === item.path ? 2 : 0,
                  borderRadius: 0,
                  fontWeight:
                    location.pathname === item.path ? "bold" : "normal",
                }}
              >
                {isLargeScreen ? item.label : ""}
              </Button>
            ))}
          </Box>
        </Container>
      </Toolbar>
    </AppBar>
  );
};
