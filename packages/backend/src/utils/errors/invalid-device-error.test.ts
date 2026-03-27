import { describe, expect, it } from "vitest";
import { InvalidDeviceError } from "./invalid-device-error.js";

describe("InvalidDeviceError", () => {
  it("should format the error message with the reason", () => {
    const error = new InvalidDeviceError("unsupported entity type");
    expect(error.message).toBe(
      "Invalid device detected. Reason: unsupported entity type",
    );
  });

  it("should be an instance of Error", () => {
    const error = new InvalidDeviceError("test");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(InvalidDeviceError);
  });
});
