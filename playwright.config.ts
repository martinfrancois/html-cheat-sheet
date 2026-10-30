import { defineConfig, devices } from "@playwright/test";

// Run through scripts/playwright.sh, which starts the official Playwright container matching
// the installed @playwright/test version, so screenshots are the same on every machine.
export default defineConfig({
  testDir: "test/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  // Each page holds dozens of live output frames, so every browser is heavy. Four workers
  // pushed a 24-core machine to a load of 48; two keep it usable.
  workers: Number(process.env.PLAYWRIGHT_WORKERS) || 2,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "retain-on-failure",
  },
  expect: {
    toHaveScreenshot: { maxDiffPixels: 0, animations: "disabled", caret: "hide" },
  },
  snapshotPathTemplate: "test/e2e/__screenshots__/{testFilePath}/{arg}{ext}",
  webServer: {
    // astro preview records its PID in .astro/preview.json; a fresh container reuses PIDs, so a
    // lock left by an earlier run looks like a server that is still running. --ignore-lock
    // neither reads nor writes that file; --force only applies to background servers.
    command: "./node_modules/.bin/astro preview --host 127.0.0.1 --port 4321 --ignore-lock",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] }, testIgnore: /(visual|examples|scrollbar)\.spec\.ts/ },
    { name: "webkit", use: { ...devices["Desktop Safari"] }, testIgnore: /(visual|examples|scrollbar)\.spec\.ts/ },
  ],
});
