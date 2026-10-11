import "server-only";

/**
 * Leitura centralizada das variáveis de ambiente do servidor.
 * Nunca importe este módulo em Client Components.
 */

function list(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export const DEFAULT_PURCHASE_HOSTS = [
  "hotmart.com",
  "kiwify.com.br",
  "kiwify.app",
  "mercadopago.com.br",
  "mpago.la",
  "eduzz.com",
  "wa.me",
  "api.whatsapp.com",
];

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não configurada. Defina a variável no ambiente do servidor (veja .env.example).",
    );
  }
  return url;
}

export function getSiteUrl(): string {
  const explicit = process.env.SITE_URL ?? process.env.BETTER_AUTH_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export function getPurchaseAllowedHosts(): string[] {
  return list(process.env.PURCHASE_ALLOWED_HOSTS, DEFAULT_PURCHASE_HOSTS);
}
