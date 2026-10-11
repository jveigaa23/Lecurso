"use client";

import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { initialActionState, type ActionState } from "@/lib/validation/common";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/** Botão que dispara uma server action com campos ocultos (ex.: publicar/despublicar). */
export function InlineAction({
  action,
  fields,
  label,
  pendingLabel,
  variant = "admin-outline",
  confirmMessage,
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  pendingLabel?: string;
  variant?: "admin" | "admin-outline" | "danger";
  confirmMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  return (
    <form
      className="inline-flex flex-col items-end gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" size="sm" variant={variant} pending={pending} pendingLabel={pendingLabel}>
        {label}
      </Button>
      <span aria-live="polite" className={state.status === "error" ? "text-xs text-danger" : "sr-only"}>
        {state.status !== "idle" ? state.message : ""}
      </span>
    </form>
  );
}
