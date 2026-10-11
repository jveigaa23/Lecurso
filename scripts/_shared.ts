import "dotenv/config";
import { createDatabase, isNeonUrl } from "../src/db/client";

export function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : "";
}

export function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

/** Descreve o destino sem expor usuário/senha da URL. */
export function describeTarget(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "(URL inválida)";
  }
}

export function isLocalUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✖ DATABASE_URL não definida. Configure o arquivo .env (veja .env.example).");
    process.exit(1);
  }
  return { url, neon: isNeonUrl(url), ...createDatabase(url) };
}
