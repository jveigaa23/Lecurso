"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClasses } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-20">
      <div className="max-w-lg text-center">
        <h1 className="display text-5xl text-paper">Algo não saiu como esperado</h1>
        <p className="mt-4 text-soft">
          Não foi possível carregar esta página agora. Tente novamente em alguns instantes.
        </p>
        {error.digest ? <p className="mt-2 text-xs text-mute">Código: {error.digest}</p> : null}
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>Tentar novamente</Button>
          <Link href="/" className={buttonClasses({ variant: "secondary" })}>
            Ir para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
