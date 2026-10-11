export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-admin-mute">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div role="status" aria-label="Carregando" className="space-y-4">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-admin-line/70" />
      <div className="h-4 w-80 animate-pulse rounded bg-admin-line/60" />
      <div className="mt-8 h-64 animate-pulse rounded-2xl bg-admin-line/50" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

export function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={
        published
          ? "inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-xs font-medium text-[#1d6b49]"
          : "inline-flex items-center gap-1.5 rounded-full bg-admin-line/70 px-2.5 py-1 text-xs font-medium text-admin-mute"
      }
    >
      <span aria-hidden className={published ? "size-1.5 rounded-full bg-success" : "size-1.5 rounded-full bg-admin-mute"} />
      {published ? "Publicado" : "Rascunho"}
    </span>
  );
}
