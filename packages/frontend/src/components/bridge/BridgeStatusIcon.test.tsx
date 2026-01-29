import { BridgeStatus } from "@home-assistant-matter-bridge/common";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BridgeStatusIcon } from "./BridgeStatusIcon.tsx";

describe("BridgeStatusIcon", () => {
  it("should render starting icon for Starting status", () => {
    const { container } = render(
      <BridgeStatusIcon status={BridgeStatus.Starting} />,
    );

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("MuiSvgIcon-colorInfo");
  });

  it("should render play icon for Running status", () => {
    const { container } = render(
      <BridgeStatusIcon status={BridgeStatus.Running} />,
    );

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("MuiSvgIcon-colorSuccess");
  });

  it("should render pause icon for Stopped status", () => {
    const { container } = render(
      <BridgeStatusIcon status={BridgeStatus.Stopped} />,
    );

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("MuiSvgIcon-colorWarning");
  });

  it("should render error icon for Failed status", () => {
    const { container } = render(
      <BridgeStatusIcon status={BridgeStatus.Failed} />,
    );

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("MuiSvgIcon-colorError");
  });

  it("should accept optional reason prop without errors", () => {
    expect(() => {
      render(
        <BridgeStatusIcon
          status={BridgeStatus.Failed}
          reason="Connection timeout"
        />,
      );
    }).not.toThrow();
  });

  it("should render with inherit font size", () => {
    const { container } = render(
      <BridgeStatusIcon status={BridgeStatus.Running} />,
    );

    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("MuiSvgIcon-fontSizeInherit");
  });
});
