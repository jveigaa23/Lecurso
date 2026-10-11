import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

/** O Neon é acessado via HTTP (ideal para funções serverless da Vercel). */
export function isNeonUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".neon.tech");
  } catch {
    return false;
  }
}

/**
 * Cria o cliente Drizzle adequado à URL:
 * - Neon → driver HTTP oficial (@neondatabase/serverless), sem conexões persistentes;
 * - Postgres local/CI → node-postgres (usado em desenvolvimento e testes).
 *
 * Ambos expõem a mesma API do Drizzle. Evitamos transações interativas no código
 * da aplicação para manter compatibilidade com o driver HTTP.
 */
export function createDatabase(url: string): { db: Database; close: () => Promise<void> } {
  if (isNeonUrl(url)) {
    const db = drizzleNeon({ client: neon(url), schema }) as unknown as Database;
    return { db, close: async () => {} };
  }
  const pool = new Pool({ connectionString: url, max: 5 });
  return { db: drizzlePg({ client: pool, schema }), close: () => pool.end() };
}
