import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` lança erro fora do bundler do Next; nos testes é um módulo vazio.
      "server-only": path.resolve(__dirname, "tests/support/empty.ts"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/support/global-setup.ts"],
    fileParallelism: false,
    env: {
      // Banco exclusivo de testes — nunca aponte para produção.
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgresql://lecurso:lecurso@localhost:5432/lecurso_test",
      BETTER_AUTH_SECRET: "test-secret-only-for-automated-tests-0123456789",
      SITE_URL: "http://localhost:3000",
    },
  },
});
