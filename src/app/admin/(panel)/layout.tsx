import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { AdminNav, AdminNavFallback } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { requireAdmin } from "@/lib/session";

async function CurrentUser() {
  const session = await requireAdmin();
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold">{session.name}</p>
      <p className="truncate text-xs text-admin-mute">
        {session.email} · {session.role === "owner" ? "Proprietário" : "Editor"}
      </p>
    </div>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-admin-line bg-admin-bg px-4 py-4 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
        <div className="mb-4 flex items-center justify-between lg:mb-8 lg:px-3">
          <Link href="/admin" className="text-lg font-bold tracking-tight">
            Painel
          </Link>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-admin-mute hover:text-admin-text"
          >
            Ver site <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>
        <Suspense fallback={<AdminNavFallback />}>
          <AdminNav />
        </Suspense>
        <div className="mt-4 hidden border-t border-admin-line pt-4 lg:mt-auto lg:block">
          <div className="px-3 pb-3">
            <Suspense fallback={<div className="h-9 animate-pulse rounded bg-admin-line/60" />}>
              <CurrentUser />
            </Suspense>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <div className="min-w-0">
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">{children}</main>
        <div className="border-t border-admin-line px-4 py-4 lg:hidden">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
