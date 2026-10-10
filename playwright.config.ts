import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 3100);
const DATABASE_URL = process.env.E2E_DATABASE_URL || "postgres://postgres@127.0.0.1:5433/declassic_test";

/**
 * End-to-end tests for the acceptance checklist. They run against a production build and a separate
 * test database, which is wiped and re-seeded before every run. Never point E2E_DATABASE_URL at real data.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Fresh database for every run: migrate, wipe and seed, then build and serve.
    command: `npx drizzle-kit migrate && npx tsx src/db/seed.ts --reset && npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/admin/login`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL,
      AUTH_SECRET: process.env.AUTH_SECRET || "e2e-secret-e2e-secret-e2e-secret-123",
      AUTH_TRUST_HOST: "true",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      RESEND_API_KEY: "",
      SEED_OWNER_EMAIL: "owner@test.ng",
      SEED_OWNER_PASSWORD: "owner-password-1",
      SEED_OWNER_NAME: "Ada Owner",
    },
  },
});
