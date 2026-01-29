import backend from "@home-assistant-matter-bridge/backend/package.json" with {
  type: "json",
};
import common from "@home-assistant-matter-bridge/common/package.json" with {
  type: "json",
};
import { mapValues, pickBy } from "lodash-es";
import { describe, expect, it } from "vitest";
import own from "../package.json" with { type: "json" };

describe("home-assistant-matter-bridge", () => {
  it("should include all necessary dependencies", () => {
    const expected = pickBy(
      { ...backend.dependencies, ...common.dependencies },
      (_, key) => !key.startsWith("@home-assistant-matter-bridge/"),
    );
    expect(own.dependencies).toEqual(expected);
  });

  it("should pin all dependencies", () => {
    const expected = mapValues(own.dependencies, (value) =>
      value.replace(/^\D+/, ""),
    );
    expect(own.dependencies).toEqual(expected);
  });
});
