import { z } from "zod";
import { COURSE_FORMATS, COURSE_LEVELS, CURRENCIES } from "@/lib/constants";
import {
  faqListSchema,
  isHostAllowed,
  isHttpsUrl,
  linesToList,
  optionalImageUrl,
  optionalText,
  parseJsonField,
  parsePriceToCents,
  requiredText,
  slugSchema,
  slugify,
} from "./common";

export { CURRENCIES };

export const curriculumSchema = z
  .array(
    z.object({
      title: requiredText(200, "O título do módulo"),
      lessons: z.array(z.string().trim().min(1).max(300)).max(60, "Use no máximo 60 aulas por módulo."),
    }),
    { error: "Conteúdo programático inválido." },
  )
  .max(40, "Use no máximo 40 módulos.");

/** Converte "12", "1,5" ou "1.5" (horas) em minutos inteiros. */
export function hoursToMinutes(raw: string): number | null {
  const value = raw.trim().replace(",", ".");
  if (value === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return Number.NaN;
  return Math.round(Number.parseFloat(value) * 60);
}

/**
 * Schema do formulário de curso. Recebe os domínios de compra permitidos
 * para que a validação seja pura e testável.
 */
export function createCourseSchema(allowedPurchaseHosts: readonly string[]) {
  return z
    .object({
      title: requiredText(140, "O título"),
      slug: z.string().trim().max(80).optional().default(""),
      shortDescription: requiredText(300, "A descrição curta"),
      description: z.string().trim().max(20000, "Texto muito longo.").default(""),
      coverImageUrl: optionalImageUrl,
      coverImageAlt: optionalText(200),
      categoryId: z
        .string()
        .trim()
        .transform((value) => (value === "" ? null : value))
        .nullable()
        .optional()
        .transform((value) => value ?? null)
        .refine((value) => value === null || z.uuid().safeParse(value).success, "Categoria inválida."),
      level: z.enum(COURSE_LEVELS, { error: "Selecione um nível válido." }),
      format: z
        .union([z.enum(COURSE_FORMATS), z.literal("")], { error: "Formato inválido." })
        .transform((value) => (value === "" ? null : value)),
      targetAudience: optionalText(2000),
      learningObjectives: z
        .string()
        .default("")
        .transform(linesToList)
        .pipe(z.array(z.string().max(300, "Cada objetivo deve ter até 300 caracteres.")).max(30)),
      curriculum: z.unknown().pipe(curriculumSchema),
      faq: z.unknown().pipe(faqListSchema),
      commercialNotes: optionalText(1000),
      durationHours: z
        .string()
        .default("")
        .transform(hoursToMinutes)
        .refine(
          (value) => value === null || (Number.isInteger(value) && value > 0 && value <= 100_000),
          "Informe a duração em horas, ex.: 8 ou 1,5",
        ),
      price: z
        .string()
        .default("")
        .transform(parsePriceToCents)
        .refine(
          (value) => value === null || (Number.isInteger(value) && value >= 0 && value <= 100_000_000),
          "Preço inválido. Use o formato 297,90",
        ),
      currency: z.enum(CURRENCIES, { error: "Moeda inválida." }),
      purchaseUrl: z
        .string()
        .trim()
        .max(2000)
        .default("")
        .transform((value) => (value === "" ? null : value))
        .superRefine((value, ctx) => {
          if (value === null) return;
          if (!isHttpsUrl(value)) {
            ctx.addIssue({ code: "custom", message: "O link de compra deve começar com https://" });
            return;
          }
          if (!isHostAllowed(new URL(value).hostname, allowedPurchaseHosts)) {
            ctx.addIssue({
              code: "custom",
              message: `Domínio não autorizado. Permitidos: ${allowedPurchaseHosts.join(", ")}`,
            });
          }
        }),
      isFeatured: z.boolean(),
      isPublished: z.boolean(),
      sortOrder: z.coerce
        .number({ error: "Ordem inválida." })
        .int("Ordem inválida.")
        .min(-1000)
        .max(1000)
        .default(0),
      seoTitle: optionalText(70),
      seoDescription: optionalText(170),
    })
    .transform((data, ctx) => {
      const slug = data.slug === "" ? slugify(data.title) : data.slug;
      const parsedSlug = slugSchema.safeParse(slug);
      if (!parsedSlug.success) {
        for (const issue of parsedSlug.error.issues) {
          ctx.addIssue({ code: "custom", path: ["slug"], message: issue.message });
        }
        return z.NEVER;
      }
      const { durationHours, price, ...rest } = data;
      return {
        ...rest,
        slug: parsedSlug.data,
        durationMinutes: durationHours,
        priceCents: price,
      };
    });
}

export type CourseInput = z.output<ReturnType<typeof createCourseSchema>>;

/** Extrai os campos do FormData no formato esperado pelo schema. */
export function courseFormDataToObject(formData: FormData) {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    title: text("title"),
    slug: text("slug"),
    shortDescription: text("shortDescription"),
    description: text("description"),
    coverImageUrl: text("coverImageUrl"),
    coverImageAlt: text("coverImageAlt"),
    categoryId: text("categoryId"),
    level: text("level"),
    format: text("format"),
    targetAudience: text("targetAudience"),
    learningObjectives: text("learningObjectives"),
    curriculum: parseJsonField(formData.get("curriculum")),
    faq: parseJsonField(formData.get("faq")),
    commercialNotes: text("commercialNotes"),
    durationHours: text("durationHours"),
    price: text("price"),
    currency: text("currency") || "BRL",
    purchaseUrl: text("purchaseUrl"),
    isFeatured: formData.get("isFeatured") === "on",
    isPublished: formData.get("isPublished") === "on",
    sortOrder: text("sortOrder") || "0",
    seoTitle: text("seoTitle"),
    seoDescription: text("seoDescription"),
  };
}
