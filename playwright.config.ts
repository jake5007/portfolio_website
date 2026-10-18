import { defineConfig } from "@playwright/test";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests",
  outputDir: "test-results",
  fullyParallel: false,
  forbidOnly: isCI,
  workers: 1,
  // Keep deterministic failures visible; investigate failures before rerunning.
  retries: 0,
  timeout: isCI ? 30_000 : 20_000,
  globalTimeout: isCI ? 10 * 60_000 : undefined,
  expect: { timeout: isCI ? 10_000 : 5000 },
  reporter: isCI ? [
    ["line"],
    ["github"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
  ] : "list",
  use: {
    baseURL: "http://127.0.0.1:3105",
    browserName: "chromium",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Run npm run build first. Never reuse an unknown service on this port.
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3105",
    url: "http://127.0.0.1:3105",
    reuseExistingServer: false,
    timeout: isCI ? 60_000 : 30_000,
    env: { AUTH_USER: "", AUTH_PASS: "" },
    gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
  },
});
