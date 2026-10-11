import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import type { AdminRole } from "@/lib/constants";

export type AdminSession = {
  userId: string;
  name: string;
  email: string;
  role: AdminRole;
};

/** Lê a sessão atual validando-a no banco. Retorna null para visitantes. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== "owner" && role !== "editor") return null;
  return { userId: session.user.id, name: session.user.name, email: session.user.email, role };
}

/**
 * Garante que a requisição pertence a um administrador.
 * Deve ser chamada em TODA página do painel e em TODA server action de escrita.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
