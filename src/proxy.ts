import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Checagem OTIMISTA: apenas redireciona quem não tem cookie de sessão.
 * A validação real (sessão no banco + papel) acontece em cada página e
 * server action do painel via `requireAdmin()`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const sessionCookie = getSessionCookie(request, { cookiePrefix: "lecurso" });
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
