import type { CourseFormat, CourseLevel } from "@/lib/constants";

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
  todos: "Todos os níveis",
};

export const FORMAT_LABELS: Record<CourseFormat, string> = {
  online: "Online",
  presencial: "Presencial",
  hibrido: "Híbrido",
};

export function formatPrice(cents: number | null | undefined, currency = "BRL"): string | null {
  if (cents === null || cents === undefined) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

/** Valor para preencher o campo de preço no painel (ex.: 29790 → "297,90"). */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function minutesToHoursInput(minutes: number | null | undefined): string {
  if (!minutes) return "";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(2).replace(/0$/, "").replace(".", ",");
}

export function formatDuration(minutes: number | null | undefined): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return h === 1 ? "1 hora" : `${h} horas`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

/** ISO 8601 para dados estruturados (ex.: 90 → "PT1H30M"). */
export function minutesToIsoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}` || "PT0M";
}

export function whatsappLink(number: string | null | undefined, message?: string | null): string | null {
  if (!number || !/^\d{10,15}$/.test(number)) return null;
  const text = message?.trim() ? `?text=${encodeURIComponent(message.trim())}` : "";
  return `https://wa.me/${number}${text}`;
}

export function formatWhatsapp(number: string): string {
  if (number.startsWith("55") && (number.length === 12 || number.length === 13)) {
    const ddd = number.slice(2, 4);
    const rest = number.slice(4);
    const split = rest.length === 9 ? 5 : 4;
    return `+55 (${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
  }
  return `+${number}`;
}

export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
