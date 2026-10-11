import { z } from "zod";
import {
  faqListSchema,
  imageListSchema,
  linesToList,
  optionalEmail,
  optionalHttpsUrl,
  optionalImageUrl,
  optionalText,
  optionalWhatsapp,
  parseJsonField,
  requiredText,
  slugSchema,
  slugify,
} from "./common";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/* --------------------------- Categorias --------------------------- */

export const categorySchema = z
  .object({
    name: requiredText(60, "O nome"),
    slug: z.string().trim().max(80).default(""),
    sortOrder: z.coerce.number().int().min(-1000).max(1000).default(0),
  })
  .transform((data, ctx) => {
    const parsed = slugSchema.safeParse(data.slug || slugify(data.name));
    if (!parsed.success) {
      ctx.addIssue({ code: "custom", path: ["slug"], message: parsed.error.issues[0]?.message ?? "Slug inválido." });
      return z.NEVER;
    }
    return { ...data, slug: parsed.data };
  });

export function categoryFormData(formData: FormData) {
  return {
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    sortOrder: text(formData, "sortOrder") || "0",
  };
}

/* --------------------------- Depoimentos -------------------------- */

export const testimonialSchema = z
  .object({
    authorName: requiredText(100, "O nome do autor"),
    authorDetail: optionalText(120),
    content: requiredText(1500, "O depoimento"),
    courseId: z
      .string()
      .trim()
      .transform((value) => (value === "" ? null : value))
      .refine((value) => value === null || z.uuid().safeParse(value).success, "Curso inválido."),
    consentConfirmed: z.boolean(),
    isPublished: z.boolean(),
    sortOrder: z.coerce.number().int().min(-1000).max(1000).default(0),
  })
  .refine((data) => !data.isPublished || data.consentConfirmed, {
    path: ["consentConfirmed"],
    message: "Confirme a autorização do autor antes de publicar o depoimento.",
  });

export function testimonialFormData(formData: FormData) {
  return {
    authorName: text(formData, "authorName"),
    authorDetail: text(formData, "authorDetail"),
    content: text(formData, "content"),
    courseId: text(formData, "courseId"),
    consentConfirmed: formData.get("consentConfirmed") === "on",
    isPublished: formData.get("isPublished") === "on",
    sortOrder: text(formData, "sortOrder") || "0",
  };
}

/* ------------------- Configurações: marca e contato ------------------- */

export const brandSettingsSchema = z.object({
  brandName: requiredText(60, "O nome da marca"),
  tagline: optionalText(120),
  description: optionalText(400),
  logoUrl: optionalImageUrl,
  city: optionalText(80),
  whatsappNumber: optionalWhatsapp,
  whatsappMessage: optionalText(300),
  instagramUrl: optionalHttpsUrl,
  email: optionalEmail,
  socialLinks: z
    .unknown()
    .pipe(
      z
        .array(
          z.object({
            label: requiredText(40, "O nome da rede"),
            url: z.string().trim().url("URL inválida.").startsWith("https://", "Use uma URL https://"),
          }),
          { error: "Lista de redes sociais inválida." },
        )
        .max(10),
    ),
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
  ogImageUrl: optionalImageUrl,
});

export function brandSettingsFormData(formData: FormData) {
  return {
    brandName: text(formData, "brandName"),
    tagline: text(formData, "tagline"),
    description: text(formData, "description"),
    logoUrl: text(formData, "logoUrl"),
    city: text(formData, "city"),
    whatsappNumber: text(formData, "whatsappNumber"),
    whatsappMessage: text(formData, "whatsappMessage"),
    instagramUrl: text(formData, "instagramUrl"),
    email: text(formData, "email"),
    socialLinks: parseJsonField(formData.get("socialLinks")),
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
    ogImageUrl: text(formData, "ogImageUrl"),
  };
}

/* ------------------- Configurações: página inicial ------------------- */

export const homeSettingsSchema = z.object({
  heroTitle: optionalText(120),
  heroSubtitle: optionalText(300),
  heroImageUrl: optionalImageUrl,
  heroImageAlt: optionalText(200),
  methodItems: z.unknown().pipe(
    z
      .array(
        z.object({
          title: requiredText(80, "O título do diferencial"),
          description: requiredText(400, "A descrição do diferencial"),
        }),
        { error: "Lista de diferenciais inválida." },
      )
      .max(8, "Use no máximo 8 diferenciais."),
  ),
  gallery: z.unknown().pipe(imageListSchema),
  faq: z.unknown().pipe(faqListSchema),
});

export function homeSettingsFormData(formData: FormData) {
  return {
    heroTitle: text(formData, "heroTitle"),
    heroSubtitle: text(formData, "heroSubtitle"),
    heroImageUrl: text(formData, "heroImageUrl"),
    heroImageAlt: text(formData, "heroImageAlt"),
    methodItems: parseJsonField(formData.get("methodItems")),
    gallery: parseJsonField(formData.get("gallery")),
    faq: parseJsonField(formData.get("faq")),
  };
}

/* ------------------- Configurações: profissional ------------------- */

export const profileSettingsSchema = z.object({
  instructorName: optionalText(100),
  instructorRole: optionalText(120),
  instructorSummary: optionalText(800),
  instructorPhotoUrl: optionalImageUrl,
  about: z.object({
    headline: optionalText(160).transform((v) => v ?? undefined),
    trajectory: optionalText(6000).transform((v) => v ?? undefined),
    philosophy: optionalText(4000).transform((v) => v ?? undefined),
    experience: optionalText(4000).transform((v) => v ?? undefined),
    specialties: z.array(z.string().max(80)).max(20, "Use no máximo 20 especialidades."),
    certifications: z
      .array(
        z.object({
          title: requiredText(160, "O nome da certificação"),
          issuer: optionalText(120).transform((v) => v ?? undefined),
          year: z
            .string()
            .trim()
            .optional()
            .transform((v) => (v ? v : undefined))
            .refine((v) => v === undefined || /^\d{4}$/.test(v), "Ano inválido (use 4 dígitos)."),
        }),
        { error: "Lista de certificações inválida." },
      )
      .max(30),
    photos: imageListSchema.max(12, "Use no máximo 12 fotos."),
  }),
});

export function profileSettingsFormData(formData: FormData) {
  const certifications = parseJsonField(formData.get("certifications"));
  const photos = parseJsonField(formData.get("aboutPhotos"));
  return {
    instructorName: text(formData, "instructorName"),
    instructorRole: text(formData, "instructorRole"),
    instructorSummary: text(formData, "instructorSummary"),
    instructorPhotoUrl: text(formData, "instructorPhotoUrl"),
    about: {
      headline: text(formData, "aboutHeadline"),
      trajectory: text(formData, "aboutTrajectory"),
      philosophy: text(formData, "aboutPhilosophy"),
      experience: text(formData, "aboutExperience"),
      specialties: linesToList(text(formData, "aboutSpecialties")),
      certifications,
      photos,
    },
  };
}

/* ------------------- Configurações: dados legais ------------------- */

export const legalSettingsSchema = z.object({
  responsibleName: optionalText(160).transform((v) => v ?? undefined),
  document: optionalText(40).transform((v) => v ?? undefined),
  address: optionalText(300).transform((v) => v ?? undefined),
  contactEmail: optionalEmail.transform((v) => v ?? undefined),
});

export function legalSettingsFormData(formData: FormData) {
  return {
    responsibleName: text(formData, "responsibleName"),
    document: text(formData, "document"),
    address: text(formData, "address"),
    contactEmail: text(formData, "contactEmail"),
  };
}
