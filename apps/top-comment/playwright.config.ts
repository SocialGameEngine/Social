/// <reference types="node" />
import { defineConfig } from "@playwright/test";

const PORT = 5173;
const HOST = "127.0.0.1";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: `http://${HOST}:${PORT}`,
    trace: "retain-on-failure",
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: `pnpm run dev`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      VITE_USE_E2E_MOCKS: process.env.VITE_USE_E2E_MOCKS ?? "false",
    },
  },
  reporter: process.env.CI ? [["github"], ["html", { outputFolder: "./playwright-report" }]] : "list",
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
    {
      name: "firefox",
      use: { browserName: "firefox" },
    },
    {
      name: "webkit",
      use: { browserName: "webkit" },
    },
  ],
});
