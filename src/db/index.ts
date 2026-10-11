import "server-only";
import { getDatabaseUrl } from "@/lib/env";
import { createDatabase, type Database } from "./client";

const globalForDb = globalThis as unknown as { __lecursoDb?: Database };

/**
 * Retorna o cliente do banco, criado sob demanda.
 * A criação tardia permite importar módulos sem DATABASE_URL (ex.: lint).
 */
export function getDb(): Database {
  if (!globalForDb.__lecursoDb) {
    globalForDb.__lecursoDb = createDatabase(getDatabaseUrl()).db;
  }
  return globalForDb.__lecursoDb;
}

export * as schema from "./schema";
