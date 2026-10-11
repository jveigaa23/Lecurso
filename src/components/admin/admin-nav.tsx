"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, House, LayoutDashboard, Quote, Scale, Settings, Tags, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/cursos", label: "Cursos", icon: BookOpen },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/depoimentos", label: "Depoimentos", icon: Quote },
  { href: "/admin/pagina-inicial", label: "Página inicial", icon: House },
  { href: "/admin/perfil", label: "Profissional", icon: UserRound },
  { href: "/admin/configuracoes", label: "Marca e contato", icon: Settings },
  { href: "/admin/legal", label: "Dados legais", icon: Scale },
];

export function AdminNav() {
  const pathname = usePathname();
  return <AdminNavShell pathname={pathname} />;
}

export function AdminNavFallback() {
  return <AdminNavShell pathname="" />;
}

function AdminNavShell({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Painel" className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-admin-text text-white" : "text-admin-mute hover:bg-admin-surface hover:text-admin-text",
            )}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
