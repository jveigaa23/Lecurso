import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const DATABASE_URL = process.env.E2E_DATABASE_URL ?? "postgresql://lecurso:lecurso@localhost:5432/lecurso_e2e";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec/ },
  ],
  webServer: {
    // Banco preparado ANTES do build: as páginas públicas são prerenderizadas com dados reais.
    command: `npx tsx tests/e2e/prepare-db.mts && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL,
      BETTER_AUTH_SECRET: "e2e-secret-only-for-automated-tests-0123456789",
      SITE_URL: `http://localhost:${PORT}`,
    },
  },
});
