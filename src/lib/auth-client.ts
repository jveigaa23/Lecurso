import { createAuthClient } from "better-auth/react";

/** Cliente de autenticação do navegador (usa os endpoints /api/auth com rate-limit). */
export const authClient = createAuthClient();
