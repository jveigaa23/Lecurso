"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await authClient.signOut();
          router.replace("/admin/login");
          router.refresh();
        })
      }
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-admin-mute transition-colors hover:bg-admin-bg hover:text-admin-text disabled:opacity-60"
    >
      <LogOut className="size-4" aria-hidden />
      {pending ? "Saindo…" : "Sair"}
    </button>
  );
}
