import { SiteImage } from "@/components/ui/site-image";

/** Marca tipográfica provisória, substituída automaticamente pelo logotipo quando configurado. */
export function BrandMark({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <SiteImage src={logoUrl} alt={name} width={160} height={40} className="h-9 w-auto object-contain" priority />
    );
  }
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="display text-[1.6rem] leading-none text-paper">{name}</span>
      <span aria-hidden className="mb-0.5 inline-block size-1.5 rounded-full bg-gold" />
    </span>
  );
}
