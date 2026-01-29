import { Navigate, type RouteObject } from "react-router";
import { AppPage } from "./pages/AppPage.tsx";
import { BridgeDetailsPage } from "./pages/bridge-details/BridgeDetailsPage.tsx";
import { BridgesPage } from "./pages/bridges/BridgesPage.tsx";
import { CreateBridgePage } from "./pages/edit-bridge/CreateBridgePage.tsx";
import { EditBridgePage } from "./pages/edit-bridge/EditBridgePage.tsx";
import { Logs } from "./pages/Logs.tsx";
import { SystemInfo } from "./pages/SystemInfo.tsx";

const documentationUrl =
  "https://sukramj.github.io/home-assistant-matter-bridge";
export const navigation = {
  bridges: "/bridges",
  bridge: (bridgeId: string) => `/bridges/${bridgeId}`,
  createBridge: "/bridges/create",
  editBridge: (bridgeId: string) => `/bridges/${bridgeId}/edit`,
  logs: "/logs",
  systemInfo: "/system",

  githubRepository: "https://github.com/sukramj/home-assistant-matter-bridge/",
  documentation: documentationUrl,
  faq: {
    multiFabric: `${documentationUrl}/connect-multiple-fabrics`,
    bridgeConfig: `${documentationUrl}/bridge-configuration`,
  },
};

export const routes: RouteObject[] = [
  {
    path: "",
    element: <AppPage />,
    children: [
      {
        path: "",
        element: <Navigate to={navigation.bridges} replace={true} />,
      },
      { path: navigation.bridges, element: <BridgesPage /> },
      { path: navigation.createBridge, element: <CreateBridgePage /> },
      { path: navigation.bridge(":bridgeId"), element: <BridgeDetailsPage /> },
      { path: navigation.editBridge(":bridgeId"), element: <EditBridgePage /> },
      { path: navigation.logs, element: <Logs /> },
      { path: navigation.systemInfo, element: <SystemInfo /> },
    ],
  },
];
