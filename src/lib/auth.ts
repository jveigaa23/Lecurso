import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { getSiteUrl } from "@/lib/env";

export const MIN_PASSWORD_LENGTH = 12;

function createAuth() {
  const isProduction = process.env.NODE_ENV === "production";
  const siteUrl = getSiteUrl();
  const trustedOrigins = [siteUrl];
  if (process.env.VERCEL_BRANCH_URL) trustedOrigins.push(`https://${process.env.VERCEL_BRANCH_URL}`);
  if (process.env.VERCEL_URL) trustedOrigins.push(`https://${process.env.VERCEL_URL}`);

  return betterAuth({
    appName: "LeCurso Admin",
    baseURL: siteUrl,
    basePath: "/api/auth",
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        adminUsers: schema.adminUsers,
        authSessions: schema.authSessions,
        authAccounts: schema.authAccounts,
        authVerifications: schema.authVerifications,
        authRateLimits: schema.authRateLimits,
      },
    }),
    user: {
      modelName: "adminUsers",
      additionalFields: {
        // `input: false` impede que o papel seja definido por requisições do cliente.
        role: { type: "string", required: false, defaultValue: "editor", input: false },
      },
    },
    session: {
      modelName: "authSessions",
      expiresIn: 60 * 60 * 24 * 7, // 7 dias
      updateAge: 60 * 60 * 24, // renova a cada 24h de uso
      freshAge: 60 * 15,
    },
    account: { modelName: "authAccounts" },
    verification: { modelName: "authVerifications" },
    emailAndPassword: {
      enabled: true,
      // Não existe cadastro público: administradores são criados pelo script `npm run admin:create`.
      disableSignUp: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    rateLimit: {
      enabled: process.env.AUTH_RATE_LIMIT !== "off",
      storage: "database",
      modelName: "authRateLimits",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 300, max: 5 },
        "/change-password": { window: 300, max: 5 },
      },
    },
    advanced: {
      cookiePrefix: "lecurso",
      useSecureCookies: isProduction,
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
      database: { generateId: "uuid" },
      ipAddress: {
        ipAddressHeaders: ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"],
      },
    },
    telemetry: { enabled: false },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;
const globalForAuth = globalThis as unknown as { __lecursoAuth?: Auth };

/** Instância criada sob demanda (o build não precisa de banco para importar este módulo). */
export function getAuth(): Auth {
  globalForAuth.__lecursoAuth ??= createAuth();
  return globalForAuth.__lecursoAuth;
}
