import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Tipos das colunas JSON (validadas com Zod antes de gravar)          */
/* ------------------------------------------------------------------ */

export type CurriculumModule = { title: string; lessons: string[] };
export type FaqItem = { question: string; answer: string };
export type GalleryImage = { url: string; alt: string };
export type Certification = { title: string; issuer?: string; year?: string };
export type MethodItem = { title: string; description: string };
export type SocialLink = { label: string; url: string };
export type AboutContent = {
  headline?: string;
  trajectory?: string;
  philosophy?: string;
  experience?: string;
  specialties: string[];
  certifications: Certification[];
  photos: GalleryImage[];
};
export type LegalInfo = {
  responsibleName?: string;
  document?: string;
  address?: string;
  contactEmail?: string;
};

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

import { ADMIN_ROLES, COURSE_FORMATS, COURSE_LEVELS, PAYMENT_STATUSES } from "../lib/constants";

export { ADMIN_ROLES, COURSE_FORMATS, COURSE_LEVELS, PAYMENT_STATUSES };
export type { AdminRole, CourseFormat, CourseLevel } from "../lib/constants";

/* ------------------------------------------------------------------ */
/* Conteúdo                                                            */
/* ------------------------------------------------------------------ */

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("categories_slug_key").on(t.slug),
    uniqueIndex("categories_name_key").on(t.name),
    check("categories_slug_format", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  ],
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description").notNull().default(""),
    description: text("description").notNull().default(""),
    coverImageUrl: text("cover_image_url"),
    coverImageAlt: text("cover_image_alt"),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    level: text("level", { enum: COURSE_LEVELS }).notNull().default("todos"),
    format: text("format", { enum: COURSE_FORMATS }),
    targetAudience: text("target_audience"),
    learningObjectives: jsonb("learning_objectives").$type<string[]>().notNull().default([]),
    curriculum: jsonb("curriculum").$type<CurriculumModule[]>().notNull().default([]),
    faq: jsonb("faq").$type<FaqItem[]>().notNull().default([]),
    commercialNotes: text("commercial_notes"),
    durationMinutes: integer("duration_minutes"),
    priceCents: integer("price_cents"),
    currency: text("currency").notNull().default("BRL"),
    purchaseUrl: text("purchase_url"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("courses_slug_key").on(t.slug),
    index("courses_published_idx").on(t.isPublished, t.sortOrder),
    index("courses_featured_idx")
      .on(t.isFeatured, t.sortOrder)
      .where(sql`${t.isPublished} = true`),
    index("courses_category_idx").on(t.categoryId),
    check("courses_slug_format", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    check("courses_price_non_negative", sql`${t.priceCents} IS NULL OR ${t.priceCents} >= 0`),
    check(
      "courses_duration_positive",
      sql`${t.durationMinutes} IS NULL OR ${t.durationMinutes} > 0`,
    ),
    check("courses_currency_format", sql`${t.currency} ~ '^[A-Z]{3}$'`),
    check(
      "courses_purchase_url_https",
      sql`${t.purchaseUrl} IS NULL OR ${t.purchaseUrl} LIKE 'https://%'`,
    ),
  ],
);

export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorName: text("author_name").notNull(),
    authorDetail: text("author_detail"),
    content: text("content").notNull(),
    courseId: uuid("course_id").references(() => courses.id, { onDelete: "set null" }),
    consentConfirmed: boolean("consent_confirmed").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("testimonials_published_idx").on(t.isPublished, t.sortOrder),
    index("testimonials_course_idx").on(t.courseId),
    // Um depoimento só pode ser publicado com autorização registrada.
    check(
      "testimonials_publish_requires_consent",
      sql`${t.isPublished} = false OR ${t.consentConfirmed} = true`,
    ),
  ],
);

/** Linha única (id = 1) com as configurações editáveis do site. */
export const siteSettings = pgTable(
  "site_settings",
  {
    id: smallint("id").primaryKey().default(1),
    brandName: text("brand_name").notNull().default("LeCurso"),
    tagline: text("tagline"),
    description: text("description"),
    logoUrl: text("logo_url"),
    heroTitle: text("hero_title"),
    heroSubtitle: text("hero_subtitle"),
    heroImageUrl: text("hero_image_url"),
    heroImageAlt: text("hero_image_alt"),
    instructorName: text("instructor_name"),
    instructorRole: text("instructor_role"),
    instructorSummary: text("instructor_summary"),
    instructorPhotoUrl: text("instructor_photo_url"),
    about: jsonb("about")
      .$type<AboutContent>()
      .notNull()
      .default({ specialties: [], certifications: [], photos: [] }),
    methodItems: jsonb("method_items").$type<MethodItem[]>().notNull().default([]),
    gallery: jsonb("gallery").$type<GalleryImage[]>().notNull().default([]),
    faq: jsonb("faq").$type<FaqItem[]>().notNull().default([]),
    whatsappNumber: text("whatsapp_number"),
    whatsappMessage: text("whatsapp_message"),
    instagramUrl: text("instagram_url"),
    email: text("email"),
    socialLinks: jsonb("social_links").$type<SocialLink[]>().notNull().default([]),
    city: text("city"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ogImageUrl: text("og_image_url"),
    legal: jsonb("legal").$type<LegalInfo>().notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [check("site_settings_singleton", sql`${t.id} = 1`)],
);

/**
 * Preparação para a fase 2 (integração com provedor de pagamento).
 * Nenhum fluxo da fase 1 grava nesta tabela.
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "restrict" }),
    customerEmail: text("customer_email").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("BRL"),
    paymentProvider: text("payment_provider").notNull(),
    providerReference: text("provider_reference").notNull(),
    paymentStatus: text("payment_status", { enum: PAYMENT_STATUSES }).notNull().default("pending"),
    ...timestamps,
  },
  (t) => [
    // Evita processar duas vezes o mesmo evento/transação do provedor.
    uniqueIndex("orders_provider_reference_key").on(t.paymentProvider, t.providerReference),
    index("orders_course_idx").on(t.courseId),
    index("orders_status_idx").on(t.paymentStatus),
    check("orders_amount_non_negative", sql`${t.amountCents} >= 0`),
    check("orders_currency_format", sql`${t.currency} ~ '^[A-Z]{3}$'`),
  ],
);

/* ------------------------------------------------------------------ */
/* Autenticação (tabelas usadas pelo Better Auth)                      */
/* As senhas ficam apenas em auth_accounts.password, com hash scrypt.  */
/* ------------------------------------------------------------------ */

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: text("role", { enum: ADMIN_ROLES }).notNull().default("editor"),
    ...timestamps,
  },
  (t) => [uniqueIndex("admin_users_email_key").on(sql`lower(${t.email})`)],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("auth_sessions_token_key").on(t.token), index("auth_sessions_user_idx").on(t.userId)],
);

export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("auth_accounts_user_idx").on(t.userId)],
);

export const authVerifications = pgTable(
  "auth_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("auth_verifications_identifier_idx").on(t.identifier)],
);

export const authRateLimits = pgTable(
  "auth_rate_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    count: integer("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
  },
  (t) => [uniqueIndex("auth_rate_limits_key_key").on(t.key)],
);

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
