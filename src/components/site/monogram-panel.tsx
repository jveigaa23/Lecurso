import { cn } from "@/lib/cn";

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0]!.slice(0, 2);
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

/**
 * Composição tipográfica usada quando ainda não há fotografia cadastrada.
 * É uma peça gráfica intencional — não simula uma foto do profissional.
 */
export function MonogramPanel({
  name,
  caption,
  className,
  compact = false,
}: {
  name: string;
  caption?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={`Identidade visual de ${name}`}
      className={cn(
        "hairline-grid relative isolate flex overflow-hidden rounded-[1.75rem] border border-line bg-graphite",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute -right-1/4 -top-1/4 -z-10 size-[80%] rounded-full bg-[radial-gradient(circle,rgb(198_161_91/0.16),transparent_65%)]"
      />
      <div className="flex w-full flex-col justify-between p-6 sm:p-8">
        <div className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-mute">
          <span>{name}</span>
          <span className="h-px w-10 bg-gold/60" />
        </div>
        <p
          className={cn(
            "font-serif italic leading-none text-paper/90",
            compact ? "text-[6rem] sm:text-[7rem]" : "text-[9rem] sm:text-[12rem] lg:text-[13rem]",
          )}
        >
          {initials(name)}
        </p>
        {caption ? (
          <p className="max-w-[16rem] text-sm leading-relaxed text-soft">{caption}</p>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
