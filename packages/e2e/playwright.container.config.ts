import { defineConfig, devices } from "@playwright/test"

/**
 * Runs the `@container`-tagged specs against an already-running self-host stack
 *
 *   docker compose -f docker-compose.selfhost.yml up -d --wait
 *   pnpm --filter @doska/e2e e2e:container
 */
export default defineConfig({
  testDir: "./e2e",
  grep: /@container/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8080",
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    serviceWorkers: "block",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
