import { and, asc, count, desc, eq, ne, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import {
  categories,
  courses,
  siteSettings,
  testimonials,
  type LegalInfo,
  type SiteSettings,
} from "@/db/schema";
import type { CourseInput } from "@/lib/validation/course";

/**
 * Regras de escrita do conteúdo. Estas funções NÃO verificam autenticação:
 * são chamadas apenas pelas server actions, que exigem `requireAdmin()` antes.
 */

export class ServiceError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

function pgErrorCode(error: unknown): string | undefined {
  const err = error as { code?: unknown; cause?: { code?: unknown } };
  const code = err?.code ?? err?.cause?.code;
  return typeof code === "string" ? code : undefined;
}

function pgConstraint(error: unknown): string | undefined {
  const err = error as { constraint?: unknown; cause?: { constraint?: unknown } };
  const name = err?.constraint ?? err?.cause?.constraint;
  return typeof name === "string" ? name : undefined;
}

/* ------------------------------ Cursos ------------------------------ */

async function assertSlugAvailable(db: Database, slug: string, ignoreId?: string) {
  const conditions = ignoreId ? and(eq(courses.slug, slug), ne(courses.id, ignoreId)) : eq(courses.slug, slug);
  const [existing] = await db.select({ id: courses.id }).from(courses).where(conditions).limit(1);
  if (existing) throw new ServiceError("Já existe um curso com este slug. Escolha outro.", "slug");
}

async function assertCategoryExists(db: Database, categoryId: string | null) {
  if (!categoryId) return;
  const [row] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (!row) throw new ServiceError("A categoria selecionada não existe mais.", "categoryId");
}

function translateCourseError(error: unknown): never {
  if (pgErrorCode(error) === "23505" && pgConstraint(error) === "courses_slug_key") {
    throw new ServiceError("Já existe um curso com este slug. Escolha outro.", "slug");
  }
  throw error;
}

export async function createCourse(db: Database, input: CourseInput) {
  await assertSlugAvailable(db, input.slug);
  await assertCategoryExists(db, input.categoryId);
  try {
    const [row] = await db
      .insert(courses)
      .values({ ...input, publishedAt: input.isPublished ? new Date() : null })
      .returning({ id: courses.id, slug: courses.slug });
    return row!;
  } catch (error) {
    translateCourseError(error);
  }
}

export async function updateCourse(db: Database, id: string, input: CourseInput) {
  const [current] = await db
    .select({ id: courses.id, slug: courses.slug, publishedAt: courses.publishedAt })
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  if (!current) throw new ServiceError("Curso não encontrado.");
  await assertSlugAvailable(db, input.slug, id);
  await assertCategoryExists(db, input.categoryId);
  try {
    const [row] = await db
      .update(courses)
      .set({
        ...input,
        publishedAt: input.isPublished ? (current.publishedAt ?? new Date()) : current.publishedAt,
      })
      .where(eq(courses.id, id))
      .returning({ id: courses.id, slug: courses.slug });
    return { ...row!, previousSlug: current.slug };
  } catch (error) {
    translateCourseError(error);
  }
}

export async function setCoursePublished(db: Database, id: string, published: boolean) {
  const [current] = await db
    .select({ publishedAt: courses.publishedAt, shortDescription: courses.shortDescription })
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  if (!current) throw new ServiceError("Curso não encontrado.");
  const [row] = await db
    .update(courses)
    .set({ isPublished: published, publishedAt: published ? (current.publishedAt ?? new Date()) : current.publishedAt })
    .where(eq(courses.id, id))
    .returning({ id: courses.id, slug: courses.slug, isPublished: courses.isPublished });
  return row!;
}

export async function deleteCourse(db: Database, id: string) {
  try {
    const [row] = await db.delete(courses).where(eq(courses.id, id)).returning({ slug: courses.slug });
    if (!row) throw new ServiceError("Curso não encontrado.");
    return row;
  } catch (error) {
    if (pgErrorCode(error) === "23503") {
      throw new ServiceError("Este curso possui pedidos registrados e não pode ser excluído. Despublique-o.");
    }
    throw error;
  }
}

/* ---------------------------- Categorias ---------------------------- */

type CategoryInput = { name: string; slug: string; sortOrder: number };

function translateCategoryError(error: unknown): never {
  if (pgErrorCode(error) === "23505") {
    const constraint = pgConstraint(error);
    if (constraint === "categories_name_key") throw new ServiceError("Já existe uma categoria com este nome.", "name");
    throw new ServiceError("Já existe uma categoria com este slug.", "slug");
  }
  throw error;
}

export async function createCategory(db: Database, input: CategoryInput) {
  try {
    const [row] = await db.insert(categories).values(input).returning();
    return row!;
  } catch (error) {
    translateCategoryError(error);
  }
}

export async function updateCategory(db: Database, id: string, input: CategoryInput) {
  try {
    const [row] = await db.update(categories).set(input).where(eq(categories.id, id)).returning();
    if (!row) throw new ServiceError("Categoria não encontrada.");
    return row;
  } catch (error) {
    translateCategoryError(error);
  }
}

/** Exclui a categoria; os cursos vinculados ficam "sem categoria" (ON DELETE SET NULL). */
export async function deleteCategory(db: Database, id: string) {
  const [row] = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
  if (!row) throw new ServiceError("Categoria não encontrada.");
  return row;
}

/* ---------------------------- Depoimentos ---------------------------- */

type TestimonialInput = {
  authorName: string;
  authorDetail: string | null;
  content: string;
  courseId: string | null;
  consentConfirmed: boolean;
  isPublished: boolean;
  sortOrder: number;
};

export async function createTestimonial(db: Database, input: TestimonialInput) {
  const [row] = await db.insert(testimonials).values(input).returning({ id: testimonials.id });
  return row!;
}

export async function updateTestimonial(db: Database, id: string, input: TestimonialInput) {
  const [row] = await db.update(testimonials).set(input).where(eq(testimonials.id, id)).returning({ id: testimonials.id });
  if (!row) throw new ServiceError("Depoimento não encontrado.");
  return row;
}

export async function deleteTestimonial(db: Database, id: string) {
  const [row] = await db.delete(testimonials).where(eq(testimonials.id, id)).returning({ id: testimonials.id });
  if (!row) throw new ServiceError("Depoimento não encontrado.");
  return row;
}

/* --------------------------- Configurações --------------------------- */

type SettingsPatch = Partial<Omit<SiteSettings, "id" | "updatedAt">>;

/** Atualiza (ou cria) a linha única de configurações. */
export async function upsertSettings(db: Database, patch: SettingsPatch) {
  await db
    .insert(siteSettings)
    .values({ id: 1, ...patch })
    .onConflictDoUpdate({ target: siteSettings.id, set: { ...patch, updatedAt: new Date() } });
}

export async function updateLegal(db: Database, legal: LegalInfo) {
  await upsertSettings(db, { legal });
}

/* ------------------------- Leituras do painel ------------------------- */

export async function listCoursesForAdmin(db: Database) {
  return db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      isPublished: courses.isPublished,
      isFeatured: courses.isFeatured,
      priceCents: courses.priceCents,
      currency: courses.currency,
      purchaseUrl: courses.purchaseUrl,
      updatedAt: courses.updatedAt,
      categoryName: categories.name,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .orderBy(desc(courses.updatedAt));
}

export async function getCourseForAdmin(db: Database, id: string) {
  const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return row ?? null;
}

export async function listCategoriesForAdmin(db: Database) {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      sortOrder: categories.sortOrder,
      courseCount: sql<number>`(select count(*)::int from ${courses} where ${courses.categoryId} = ${categories.id})`,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function listTestimonialsForAdmin(db: Database) {
  return db
    .select({
      id: testimonials.id,
      authorName: testimonials.authorName,
      authorDetail: testimonials.authorDetail,
      content: testimonials.content,
      courseId: testimonials.courseId,
      consentConfirmed: testimonials.consentConfirmed,
      isPublished: testimonials.isPublished,
      sortOrder: testimonials.sortOrder,
      courseTitle: courses.title,
    })
    .from(testimonials)
    .leftJoin(courses, eq(testimonials.courseId, courses.id))
    .orderBy(asc(testimonials.sortOrder), desc(testimonials.createdAt));
}

export async function getSettingsForAdmin(db: Database) {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return row ?? null;
}

export async function getDashboardStats(db: Database) {
  const [courseStats] = await db
    .select({
      total: count(),
      published: sql<number>`count(*) filter (where ${courses.isPublished})::int`,
      featured: sql<number>`count(*) filter (where ${courses.isPublished} and ${courses.isFeatured})::int`,
      withoutPurchase: sql<number>`count(*) filter (where ${courses.isPublished} and ${courses.purchaseUrl} is null)::int`,
    })
    .from(courses);
  const [testimonialStats] = await db
    .select({ total: count(), published: sql<number>`count(*) filter (where ${testimonials.isPublished})::int` })
    .from(testimonials);
  const [categoryStats] = await db.select({ total: count() }).from(categories);
  return {
    courses: {
      total: Number(courseStats?.total ?? 0),
      published: Number(courseStats?.published ?? 0),
      drafts: Number(courseStats?.total ?? 0) - Number(courseStats?.published ?? 0),
      featured: Number(courseStats?.featured ?? 0),
      withoutPurchase: Number(courseStats?.withoutPurchase ?? 0),
    },
    testimonials: {
      total: Number(testimonialStats?.total ?? 0),
      published: Number(testimonialStats?.published ?? 0),
    },
    categories: Number(categoryStats?.total ?? 0),
  };
}
