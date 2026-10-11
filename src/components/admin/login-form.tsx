"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const email = String(data.get("email") ?? "").trim();
        const password = String(data.get("password") ?? "");
        if (!email || !password) {
          setError("Informe e-mail e senha.");
          return;
        }
        setError(null);
        startTransition(async () => {
          const result = await authClient.signIn.email({ email, password });
          if (result.error) {
            // Mensagem genérica: não revela se o e-mail existe.
            setError(
              result.error.status === 429
                ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
                : "E-mail ou senha incorretos.",
            );
            return;
          }
          router.replace("/admin");
          router.refresh();
        });
      }}
    >
      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-[#a32a2e]">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="w-full rounded-xl border border-admin-line bg-white px-3.5 py-3 focus:border-admin-text focus:outline-none focus:ring-2 focus:ring-admin-text/10"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-admin-line bg-white px-3.5 py-3 focus:border-admin-text focus:outline-none focus:ring-2 focus:ring-admin-text/10"
        />
      </div>
      <Button type="submit" variant="admin" size="lg" className="w-full" pending={pending} pendingLabel="Entrando…">
        Entrar
      </Button>
    </form>
  );
}
