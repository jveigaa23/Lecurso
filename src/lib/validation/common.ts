import { z } from "zod";

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Converte um texto livre em slug ASCII ("Degradê Avançado" → "degrade-avancado"). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Texto opcional: string vazia vira null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional()
    .transform((value) => value ?? null);

export const requiredText = (max: number, label = "Este campo") =>
  z
    .string({ error: `${label} é obrigatório.` })
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `Use no máximo ${max} caracteres.`);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "O slug precisa ter ao menos 2 caracteres.")
  .max(80, "Use no máximo 80 caracteres.")
  .regex(SLUG_PATTERN, "Use apenas letras minúsculas, números e hífens (ex.: degrade-avancado).");

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function isHttpsUrl(value: string): boolean {
  const url = parseUrl(value);
  return !!url && url.protocol === "https:" && !url.username && !url.password;
}

/** Verifica se o host é igual a um domínio permitido ou subdomínio dele. */
export function isHostAllowed(hostname: string, allowedHosts: readonly string[]): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/** URL de compra: HTTPS e em um domínio autorizado. Retorna null quando inválida. */
export function sanitizePurchaseUrl(
  value: string | null | undefined,
  allowedHosts: readonly string[],
): string | null {
  if (!value) return null;
  const url = parseUrl(value.trim());
  if (!url || url.protocol !== "https:" || url.username || url.password) return null;
  if (!isHostAllowed(url.hostname, allowedHosts)) return null;
  return url.toString();
}

export const httpsUrlSchema = z
  .string()
  .trim()
  .max(2000, "URL muito longa.")
  .refine(isHttpsUrl, "Informe uma URL completa iniciada por https://");

export const optionalHttpsUrl = z
  .string()
  .trim()
  .max(2000, "URL muito longa.")
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional()
  .transform((value) => value ?? null)
  .refine((value) => value === null || isHttpsUrl(value), "Informe uma URL completa iniciada por https://");

/** Imagens: URL https ou caminho local do diretório /public (ex.: /images/foto.jpg). */
export function isValidImageSrc(value: string): boolean {
  if (/^\/(?!\/)[\w\-./]+\.(avif|webp|png|jpe?g|svg)$/i.test(value) && !value.includes("..")) {
    return true;
  }
  return isHttpsUrl(value);
}

export const optionalImageUrl = z
  .string()
  .trim()
  .max(2000, "URL muito longa.")
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional()
  .transform((value) => value ?? null)
  .refine(
    (value) => value === null || isValidImageSrc(value),
    "Use uma URL https:// ou um caminho local como /images/foto.jpg",
  );

/**
 * Converte valores digitados no formato brasileiro para centavos.
 * Aceita "297", "297,90", "1.297,90", "R$ 1.297,90" e "1297.90".
 */
export function parsePriceToCents(raw: string): number | null {
  const value = raw.replace(/R\$\s?/i, "").replace(/\s/g, "").trim();
  if (value === "") return null;
  let normalized: string;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(value) || /^\d+(,\d{1,2})?$/.test(value)) {
    normalized = value.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+(\.\d{1,2})?$/.test(value)) {
    normalized = value;
  } else {
    return Number.NaN;
  }
  return Math.round(Number.parseFloat(normalized) * 100);
}

/** Mantém apenas dígitos do WhatsApp; exige DDI + DDD + número (10 a 15 dígitos). */
export function normalizeWhatsapp(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return null;
  return digits;
}

export const optionalWhatsapp = z
  .string()
  .trim()
  .max(30)
  .transform(normalizeWhatsapp)
  .nullable()
  .optional()
  .transform((value) => value ?? null)
  .refine(
    (value) => value === null || /^\d{10,15}$/.test(value),
    "Informe o número com DDI e DDD, ex.: 55 11 91234-5678",
  );

export const optionalEmail = z
  .string()
  .trim()
  .max(254)
  .transform((value) => (value === "" ? null : value.toLowerCase()))
  .nullable()
  .optional()
  .transform((value) => value ?? null)
  .refine((value) => value === null || z.email().safeParse(value).success, "E-mail inválido.");

/** Lê uma lista com um item por linha (ignorando linhas vazias). */
export function linesToList(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Lê um campo JSON vindo de um <input type="hidden"> com segurança. */
export function parseJsonField(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    return JSON.parse(raw);
  } catch {
    return Symbol.for("invalid-json");
  }
}

export const faqListSchema = z
  .array(
    z.object({
      question: requiredText(300, "A pergunta"),
      answer: requiredText(2000, "A resposta"),
    }),
    { error: "Lista de perguntas inválida." },
  )
  .max(30, "Use no máximo 30 perguntas.");

export const imageListSchema = z
  .array(
    z.object({
      url: z.string().trim().refine(isValidImageSrc, "Imagem com URL inválida."),
      alt: requiredText(200, "A descrição da imagem"),
    }),
    { error: "Lista de imagens inválida." },
  )
  .max(40, "Use no máximo 40 imagens.");

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
};

export const initialActionState: ActionState = { status: "idle" };

/** Converte os erros do Zod em um mapa campo → mensagens. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : "_form";
    (result[key] ??= []).push(issue.message);
  }
  return result;
}
