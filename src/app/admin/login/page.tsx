import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-admin-mute">Painel administrativo</p>
        <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight">Entrar</h1>
        <div className="mt-8 rounded-2xl border border-admin-line bg-admin-surface p-6 shadow-sm sm:p-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-admin-mute">
          Acesso restrito a administradores.{" "}
          <Link href="/" className="font-medium text-admin-text underline-offset-4 hover:underline">
            Voltar ao site
          </Link>
        </p>
      </div>
    </main>
  );
}
