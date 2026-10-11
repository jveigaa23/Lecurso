"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CircleAlert, CircleCheck, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { initialActionState, type ActionState, type FieldErrors } from "@/lib/validation/common";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

const inputClass =
  "w-full rounded-xl border border-admin-line bg-white px-3.5 py-2.5 text-[0.95rem] text-admin-text shadow-[0_1px_0_rgb(0_0_0/0.02)] placeholder:text-admin-mute/70 focus:border-admin-text focus:outline-none focus:ring-2 focus:ring-admin-text/10 aria-[invalid=true]:border-danger";

/* ------------------------------------------------------------------ */

export function ActionForm({
  action,
  children,
  className,
  submitLabel = "Salvar",
  pendingLabel = "Salvando…",
  resetOnSuccess = false,
  footer,
}: {
  action: Action;
  children: (errors: FieldErrors) => React.ReactNode;
  className?: string;
  submitLabel?: string;
  pendingLabel?: string;
  resetOnSuccess?: boolean;
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "idle") return;
    if (state.status === "success" && resetOnSuccess) formRef.current?.reset();
    statusRef.current?.focus();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      className={cn("space-y-6", className)}
      noValidate
      onSubmit={(event) => {
        // Submissão manual: evita o reset automático do React 19, preservando
        // o que foi digitado quando o servidor devolve erros de validação.
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        const formData = new FormData(event.currentTarget, submitter);
        startTransition(() => formAction(formData));
      }}
    >
      <FormStatusMessage ref={statusRef} state={state} />
      {children(state.fieldErrors ?? {})}
      <div className="flex flex-wrap items-center gap-3 border-t border-admin-line pt-6">
        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} pending={pending} />
        {footer}
      </div>
    </form>
  );
}

export function FormStatusMessage({ state, ref }: { state: ActionState; ref?: React.Ref<HTMLDivElement> }) {
  if (state.status === "idle" || !state.message) return <div ref={ref} tabIndex={-1} className="sr-only" />;
  const success = state.status === "success";
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={success ? "status" : "alert"}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm focus:outline-none",
        success ? "border-success/40 bg-success/10 text-[#1d6b49]" : "border-danger/40 bg-danger/10 text-[#a32a2e]",
      )}
    >
      {success ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
      <span>{state.message}</span>
    </div>
  );
}

export function SubmitButton({
  label,
  pendingLabel,
  variant = "admin",
  name,
  value,
  pending,
}: {
  label: string;
  pendingLabel?: string;
  variant?: "admin" | "admin-outline" | "danger";
  name?: string;
  value?: string;
  pending: boolean;
}) {
  return (
    <Button type="submit" variant={variant} pending={pending} pendingLabel={pendingLabel} name={name} value={value}>
      {label}
    </Button>
  );
}

/* ------------------------------------------------------------------ */

type FieldBase = {
  name: string;
  label: string;
  hint?: React.ReactNode;
  errors?: string[];
  className?: string;
};

function FieldShell({
  id,
  label,
  hint,
  errors,
  className,
  children,
  required,
}: Omit<FieldBase, "name"> & { id: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-admin-text">
        {label}
        {required ? <span className="ml-0.5 text-danger" aria-hidden>*</span> : null}
      </label>
      {children}
      {hint ? <p id={`${id}-hint`} className="text-xs leading-relaxed text-admin-mute">{hint}</p> : null}
      {errors?.length ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, hint: unknown, errors?: string[]) {
  return [hint ? `${id}-hint` : null, errors?.length ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

export function TextField({
  name,
  label,
  hint,
  errors,
  className,
  required,
  ...props
}: FieldBase & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} errors={errors} className={className} required={required}>
      <input
        id={id}
        name={name}
        required={required}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, hint, errors)}
        className={inputClass}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  errors,
  className,
  required,
  rows = 4,
  ...props
}: FieldBase & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} errors={errors} className={className} required={required}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, hint, errors)}
        className={cn(inputClass, "resize-y leading-relaxed")}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  errors,
  className,
  options,
  ...props
}: FieldBase & { options: Array<{ value: string; label: string }> } & Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "name"
  >) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} errors={errors} className={className}>
      <select
        id={id}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, hint, errors)}
        className={inputClass}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  errors,
  defaultChecked,
}: FieldBase & { defaultChecked?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        aria-describedby={describedBy(id, hint, errors)}
        aria-invalid={errors?.length ? true : undefined}
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-admin-line accent-admin-text"
      />
      <div>
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-admin-text">
          {label}
        </label>
        {hint ? <p id={`${id}-hint`} className="text-xs text-admin-mute">{hint}</p> : null}
        {errors?.length ? <p id={`${id}-error`} className="text-xs font-medium text-danger">{errors[0]}</p> : null}
      </div>
    </div>
  );
}

/** Campo de URL de imagem com pré-visualização. */
export function ImageUrlField({
  name,
  label,
  hint,
  errors,
  defaultValue,
}: FieldBase & { defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [broken, setBroken] = useState(false);
  const valid = /^https:\/\/\S+$/.test(value) || /^\/[\w\-./]+$/.test(value);
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_7rem] sm:items-start">
      <TextField
        name={name}
        label={label}
        hint={hint ?? "URL https:// da imagem (ex.: Cloudinary, Vercel Blob) ou caminho em /public."}
        errors={errors}
        value={value}
        inputMode="url"
        placeholder="https://"
        onChange={(event) => {
          setValue(event.target.value.trim());
          setBroken(false);
        }}
      />
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-dashed border-admin-line bg-admin-bg text-center text-[0.7rem] text-admin-mute sm:mt-6">
        {value && valid && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element -- pré-visualização de URL arbitrária no painel
          <img src={value} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
        ) : (
          <span className="px-2">{broken ? "Não foi possível carregar" : "Sem imagem"}</span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editor genérico de listas (FAQ, módulos, galeria, redes sociais…)   */
/* ------------------------------------------------------------------ */

type ListFieldDef = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "lines";
  placeholder?: string;
  hint?: string;
};

type Row = Record<string, string>;

function toRows(items: Array<Record<string, unknown>>, fields: ListFieldDef[]): Row[] {
  return items.map((item) =>
    Object.fromEntries(
      fields.map((field) => {
        const value = item[field.key];
        return [field.key, Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : ""];
      }),
    ),
  );
}

function fromRows(rows: Row[], fields: ListFieldDef[]) {
  return rows
    .map((row) =>
      Object.fromEntries(
        fields.map((field) => [
          field.key,
          field.type === "lines"
            ? (row[field.key] ?? "").split("\n").map((line) => line.trim()).filter(Boolean)
            : (row[field.key] ?? "").trim(),
        ]),
      ),
    )
    .filter((item) => Object.values(item).some((value) => (Array.isArray(value) ? value.length : value)));
}

export function ListEditor({
  name,
  legend,
  description,
  fields,
  initialItems,
  addLabel = "Adicionar item",
  itemLabel = "Item",
  errors,
  max = 30,
}: {
  name: string;
  legend: string;
  description?: string;
  fields: ListFieldDef[];
  initialItems: Array<Record<string, unknown>>;
  addLabel?: string;
  itemLabel?: string;
  errors?: FieldErrors;
  max?: number;
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(initialItems, fields));
  const baseId = useId();
  const listErrors = Object.entries(errors ?? {})
    .filter(([key]) => key === name || key.startsWith(`${name}.`))
    .flatMap(([key, messages]) => {
      const index = Number(key.split(".")[1]);
      return (messages ?? []).map((message) => (Number.isNaN(index) ? message : `${itemLabel} ${index + 1}: ${message}`));
    });

  const update = (index: number, key: string, value: string) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  const move = (index: number, direction: -1 | 1) =>
    setRows((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-admin-text">{legend}</legend>
      {description ? <p className="-mt-1 text-xs text-admin-mute">{description}</p> : null}
      <input type="hidden" name={name} value={JSON.stringify(fromRows(rows, fields))} />
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-admin-line px-4 py-5 text-center text-sm text-admin-mute">
          Nenhum item adicionado.
        </p>
      ) : null}
      <ol className="space-y-3">
        {rows.map((row, index) => (
          <li key={index} className="rounded-xl border border-admin-line bg-admin-bg/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-admin-mute">
                {itemLabel} {index + 1}
              </span>
              <div className="flex gap-1">
                <IconButton label={`Mover ${itemLabel.toLowerCase()} ${index + 1} para cima`} onClick={() => move(index, -1)} disabled={index === 0}>
                  <ArrowUp className="size-4" />
                </IconButton>
                <IconButton
                  label={`Mover ${itemLabel.toLowerCase()} ${index + 1} para baixo`}
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                >
                  <ArrowDown className="size-4" />
                </IconButton>
                <IconButton
                  label={`Remover ${itemLabel.toLowerCase()} ${index + 1}`}
                  onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                >
                  <X className="size-4" />
                </IconButton>
              </div>
            </div>
            <div className="grid gap-3">
              {fields.map((field) => {
                const id = `${baseId}-${index}-${field.key}`;
                return (
                  <div key={field.key} className="space-y-1">
                    <label htmlFor={id} className="block text-xs font-medium text-admin-mute">
                      {field.label}
                    </label>
                    {field.type === "textarea" || field.type === "lines" ? (
                      <textarea
                        id={id}
                        rows={field.type === "lines" ? 4 : 3}
                        value={row[field.key] ?? ""}
                        placeholder={field.placeholder}
                        onChange={(event) => update(index, field.key, event.target.value)}
                        className={cn(inputClass, "resize-y")}
                      />
                    ) : (
                      <input
                        id={id}
                        value={row[field.key] ?? ""}
                        placeholder={field.placeholder}
                        onChange={(event) => update(index, field.key, event.target.value)}
                        className={inputClass}
                      />
                    )}
                    {field.hint ? <p className="text-[0.7rem] text-admin-mute">{field.hint}</p> : null}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      {listErrors.length ? (
        <ul className="space-y-1 text-xs font-medium text-danger" role="alert">
          {listErrors.slice(0, 5).map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
      {rows.length < max ? (
        <button
          type="button"
          onClick={() => setRows((current) => [...current, Object.fromEntries(fields.map((f) => [f.key, ""]))])}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-admin-line bg-white px-4 text-sm font-medium text-admin-text transition-colors hover:border-admin-text/40"
        >
          <Plus className="size-4" aria-hidden /> {addLabel}
        </button>
      ) : null}
    </fieldset>
  );
}

function IconButton({
  label,
  children,
  ...props
}: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="inline-flex size-8 items-center justify-center rounded-lg text-admin-mute transition-colors hover:bg-white hover:text-admin-text disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-admin-line bg-admin-surface p-5 sm:p-7">
      <h2 className="text-base font-semibold text-admin-text">{title}</h2>
      {description ? <p className="mt-1 text-sm text-admin-mute">{description}</p> : null}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}
