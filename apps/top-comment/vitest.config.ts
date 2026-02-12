import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      clearMocks: true,
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      exclude: ["tests/e2e/**", "node_modules/**"],
    },
  }),
);
