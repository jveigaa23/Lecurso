import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabase } from "../../src/db/client";

/** Recria o schema do banco de testes e aplica as migrações versionadas. */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://lecurso:lecurso@localhost:5432/lecurso_test";
  const host = new URL(url).hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error("Os testes só podem rodar contra um Postgres local.");
  }
  const { db, close } = createDatabase(url);
  await db.execute("drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;");
  await migrate(db, { migrationsFolder: "./drizzle" });
  await close();
}
