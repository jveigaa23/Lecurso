"use client";

import { startTransition, useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { initialActionState, type ActionState } from "@/lib/validation/common";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/** Exclusão definitiva com confirmação digitada (EXCLUIR). */
export function DangerZone({ action, id, description }: { action: Action; id: string; description: string }) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const inputId = useId();
  return (
    <section className="rounded-2xl border border-danger/30 bg-danger/[0.04] p-5 sm:p-7">
      <h2 className="text-base font-semibold text-[#a32a2e]">Excluir definitivamente</h2>
      <p className="mt-1 text-sm text-admin-mute">{description}</p>
      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(() => formAction(formData));
        }}
      >
        <input type="hidden" name="id" value={id} />
        <div className="flex-1 space-y-1.5">
          <label htmlFor={inputId} className="block text-sm font-medium">
            Digite <strong>EXCLUIR</strong> para confirmar
          </label>
          <input
            id={inputId}
            name="confirm"
            autoComplete="off"
            className="w-full rounded-xl border border-admin-line bg-white px-3.5 py-2.5 focus:border-danger focus:outline-none"
          />
        </div>
        <Button type="submit" variant="danger" pending={pending} pendingLabel="Excluindo…">
          Excluir
        </Button>
      </form>
      {state.status === "error" ? (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
