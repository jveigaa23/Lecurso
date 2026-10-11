import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/db";
import { categories, courses, siteSettings, testimonials } from "@/db/schema";
import { getPurchaseAllowedHosts } from "@/lib/env";
import { DEFAULT_SETTINGS } from "@/lib/site-defaults";
import { sanitizePurchaseUrl } from "@/lib/validation/common";
import { TAGS } from "./tags";

/**
 * Leituras públicas. Todas usam `use cache` com tags: as server actions do painel
 * chamam `updateTag` após cada alteração, então o site reflete as mudanças na hora
 * sem consultar o banco a cada visita.
 */

const publicCourseColumns = {
  id: courses.id,
  title: courses.title,
  slug: courses.slug,
  shortDescription: courses.shortDescription,
  description: courses.description,
  coverImageUrl: courses.coverImageUrl,
  coverImageAlt: courses.coverImageAlt,
  level: courses.level,
  format: courses.format,
  targetAudience: courses.targetAudience,
  learningObjectives: courses.learningObjectives,
  curriculum: courses.curriculum,
  faq: courses.faq,
  commercialNotes: courses.commercialNotes,
  durationMinutes: courses.durationMinutes,
  priceCents: courses.priceCents,
  currency: courses.currency,
  purchaseUrl: courses.purchaseUrl,
  isFeatured: courses.isFeatured,
  sortOrder: courses.sortOrder,
  seoTitle: courses.seoTitle,
  seoDescription: courses.seoDescription,
  publishedAt: courses.publishedAt,
  createdAt: courses.createdAt,
  updatedAt: courses.updatedAt,
  categoryId: courses.categoryId,
  categoryName: categories.name,
  categorySlug: categories.slug,
};

export async function getSiteSettings() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.settings);
  const [row] = await getDb().select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return row ?? DEFAULT_SETTINGS;
}

export async function getPublishedCourses() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.courses);
  const rows = await getDb()
    .select(publicCourseColumns)
    .from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.isPublished, true))
    .orderBy(desc(courses.isFeatured), asc(courses.sortOrder), asc(courses.title));

  const allowedHosts = getPurchaseAllowedHosts();
  // Revalida o link de compra na leitura: se a lista de domínios mudar,
  // links que deixaram de ser permitidos não são exibidos.
  return rows.map((row) => ({ ...row, purchaseUrl: sanitizePurchaseUrl(row.purchaseUrl, allowedHosts) }));
}

export type PublicCourse = Awaited<ReturnType<typeof getPublishedCourses>>[number];

/**
 * Busca por slug em uma entrada de cache própria (chaveada pelo slug).
 * Não reutiliza a lista completa: na primeira visita a um curso recém-publicado
 * (slug ausente no build), a lista pode vir do snapshot do build.
 */
export async function getPublishedCourseBySlug(slug: string): Promise<PublicCourse | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.courses);
  const [row] = await getDb()
    .select(publicCourseColumns)
    .from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(and(eq(courses.slug, slug), eq(courses.isPublished, true)))
    .limit(1);
  if (!row) return null;
  return { ...row, purchaseUrl: sanitizePurchaseUrl(row.purchaseUrl, getPurchaseAllowedHosts()) };
}

export async function getFeaturedCourses(limit = 3): Promise<PublicCourse[]> {
  const all = await getPublishedCourses();
  // Destaques primeiro; completa a grade com os demais publicados.
  return [...all.filter((course) => course.isFeatured), ...all.filter((course) => !course.isFeatured)].slice(0, limit);
}

export async function getRelatedCourses(course: PublicCourse, limit = 3): Promise<PublicCourse[]> {
  const all = await getPublishedCourses();
  const others = all.filter((item) => item.id !== course.id);
  const sameCategory = others.filter((item) => course.categoryId && item.categoryId === course.categoryId);
  const rest = others.filter((item) => !sameCategory.includes(item));
  return [...sameCategory, ...rest].slice(0, limit);
}

/** Categorias que possuem ao menos um curso publicado. */
export async function getPublicCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.courses, TAGS.categories);
  const all = await getPublishedCourses();
  const used = new Set(all.map((course) => course.categoryId).filter(Boolean));
  const rows = await getDb()
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return rows.filter((row) => used.has(row.id));
}

export async function getPublishedTestimonials() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.testimonials);
  return getDb()
    .select({
      id: testimonials.id,
      authorName: testimonials.authorName,
      authorDetail: testimonials.authorDetail,
      content: testimonials.content,
      courseId: testimonials.courseId,
    })
    .from(testimonials)
    .where(and(eq(testimonials.isPublished, true), eq(testimonials.consentConfirmed, true)))
    .orderBy(asc(testimonials.sortOrder), desc(testimonials.createdAt));
}
