import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:8081",
    ...devices["Pixel 7"],
    browserName: "chromium",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/serve-web.mjs",
    url: "http://127.0.0.1:8081",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
