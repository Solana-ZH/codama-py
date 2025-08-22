import { env } from "node:process";
import { defineConfig } from "vitest/config";

export type Platform = "browser" | "node" | "react-native";

export default defineConfig({
  define: {
    __ESM__: "true",
    __NODEJS__: `true`,
    __TEST__: "true",
    __VERSION__: `"${env.npm_package_version}"`,
  },
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts", "test/integration/**/*.test.ts"],
    exclude: ["e2e/**/*"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "e2e/",
        "examples/",
        "test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/index.ts",
      ],
    },
  },
});
