/** Prepara o banco de E2E: schema limpo, migrações, seed de demonstração e admins de teste. */
import { execSync } from "node:child_process";
import { hashPassword } from "better-auth/crypto";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabase } from "../../src/db/client";
import { adminUsers, authAccounts } from "../../src/db/schema";

const url = process.env.DATABASE_URL!;
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) throw new Error("E2E só roda em Postgres local.");

const { db, close } = createDatabase(url);
await db.execute("drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;");
await migrate(db, { migrationsFolder: "./drizzle" });
execSync("npx tsx scripts/seed.ts", { stdio: "inherit", env: process.env });

for (const [email, role] of [["dono@e2e.test", "owner"], ["editor@e2e.test", "editor"]] as const) {
  const [user] = await db
    .insert(adminUsers)
    .values({ email, name: role === "owner" ? "Dono E2E" : "Editor E2E", role, emailVerified: true })
    .returning();
  await db.insert(authAccounts).values({
    userId: user!.id,
    accountId: user!.id,
    providerId: "credential",
    password: await hashPassword("SenhaE2E123456"),
  });
}
await close();
console.log("✔ Banco E2E pronto.");
