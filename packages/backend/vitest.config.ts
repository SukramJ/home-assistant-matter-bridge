import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json"],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/dist/**",
        "**/node_modules/**",
        "**/cli.ts",
        "**/bootstrap.ts",
        "**/polyfills.ts",
      ],
      thresholds: {
        lines: 35,
        functions: 30,
        branches: 20,
        statements: 35,
      },
    },
  },
});
