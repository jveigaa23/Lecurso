"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/cursos", label: "Cursos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

/** Lê a rota atual (precisa estar dentro de <Suspense>, ver SiteHeaderFallback). */
export function SiteHeader({ brand }: { brand: React.ReactNode }) {
  const pathname = usePathname();
  return <SiteHeaderShell brand={brand} pathname={pathname} />;
}

/** Versão sem rota ativa, usada no shell estático enquanto a rota é resolvida. */
export function SiteHeaderFallback({ brand }: { brand: React.ReactNode }) {
  return <SiteHeaderShell brand={brand} pathname="" />;
}

function SiteHeaderShell({ brand, pathname }: { brand: React.ReactNode; pathname: string }) {
  // O menu fica aberto apenas na rota em que foi aberto: navegar o fecha automaticamente.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trava a rolagem do fundo enquanto o menu está aberto.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 transition-[background-color,border-color] duration-300",
          scrolled || open ? "border-b border-line bg-ink/85 backdrop-blur-md" : "border-b border-transparent",
        )}
      >
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
        >
          Pular para o conteúdo
        </a>
        <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/" aria-label="Página inicial" className="-m-1 p-1">
            {brand}
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive(item.href) ? "text-paper" : "text-soft hover:text-paper",
                )}
              >
                {item.label}
                {isActive(item.href) ? (
                  <span aria-hidden className="absolute inset-x-4 -bottom-0.5 h-px bg-gold" />
                ) : null}
              </Link>
            ))}
            <Link href="/cursos" className={buttonClasses({ size: "sm", className: "ml-4" })}>
              Ver cursos
            </Link>
          </nav>

          <button
            type="button"
            className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-paper md:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
        </div>
      </header>
      <div
        id="menu-mobile"
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-18 z-40 overflow-y-auto bg-ink md:hidden"
      >
        <nav aria-label="Menu móvel" className="flex flex-col px-4 pb-10 pt-6">
          {[{ href: "/", label: "Início" }, ...NAV].map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              style={{ animationDelay: `${index * 40}ms` }}
              className="display animate-rise flex items-center justify-between border-b border-line py-5 text-4xl text-paper"
            >
              {item.label}
              <span className={cn("size-2 rounded-full", pathname === item.href ? "bg-gold" : "bg-transparent")} />
            </Link>
          ))}
          <Link href="/cursos" className={buttonClasses({ size: "lg", className: "mt-8 w-full" })}>
            Conhecer os cursos
          </Link>
        </nav>
      </div>
    </>
  );
}
