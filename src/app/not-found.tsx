import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="hairline-grid flex min-h-dvh items-center justify-center px-4 py-20">
      <div className="max-w-lg text-center">
        <p className="font-serif text-8xl italic text-gold">404</p>
        <h1 className="display mt-6 text-5xl text-paper">Página não encontrada</h1>
        <p className="mt-4 text-soft">O endereço pode ter mudado ou o conteúdo não está mais disponível.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/cursos" className={buttonClasses()}>
            Ver cursos
          </Link>
          <Link href="/" className={buttonClasses({ variant: "secondary" })}>
            Ir para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
