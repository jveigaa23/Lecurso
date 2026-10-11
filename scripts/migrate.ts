/**
 * Aplica as migrações SQL versionadas da pasta /drizzle.
 * Uso: npm run db:migrate            (banco local)
 *      npm run db:migrate -- --yes   (banco remoto, ex.: Neon — confirmação explícita)
 */
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { connect, describeTarget, hasFlag, isLocalUrl } from "./_shared";

async function main() {
  const { url, db, neon, close } = connect();
  console.log(`→ Destino: ${describeTarget(url)}`);
  if (!isLocalUrl(url) && !hasFlag("yes")) {
    console.error("✖ Banco remoto detectado. Revise as migrações e rode novamente com --yes para confirmar.");
    process.exit(1);
  }
  const config = { migrationsFolder: "./drizzle" };
  if (neon) await migrateNeon(db as unknown as NeonHttpDatabase, config);
  else await migratePg(db, config);
  await close();
  console.log("✔ Migrações aplicadas.");
}

main().catch((error) => {
  console.error("✖ Falha ao aplicar migrações:", error instanceof Error ? error.message : error);
  process.exit(1);
});
