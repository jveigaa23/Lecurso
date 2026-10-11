import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/db";
import { createDatabase } from "@/db/client";
import { categories, courses, orders, testimonials } from "@/db/schema";
import { createCourseSchema } from "@/lib/validation/course";
import * as service from "@/server/services/content";
import { resetContent } from "../support/db";

const schema = createCourseSchema(["hotmart.com"]);

function input(overrides: Record<string, unknown> = {}) {
  return schema.parse({
    title: "Curso de teste",
    slug: "",
    shortDescription: "Descrição",
    level: "todos",
    format: "",
    curriculum: [],
    faq: [],
    currency: "BRL",
    isFeatured: false,
    isPublished: false,
    ...overrides,
  });
}

beforeEach(resetContent);

describe("cursos", () => {
  it("cria, edita, publica e despublica", async () => {
    const db = getDb();
    const created = await service.createCourse(db, input());
    expect(created.slug).toBe("curso-de-teste");

    await service.updateCourse(db, created.id, input({ title: "Novo título", slug: "novo-titulo", price: "99,90" }));
    let row = await service.getCourseForAdmin(db, created.id);
    expect(row).toMatchObject({ title: "Novo título", slug: "novo-titulo", priceCents: 9990, isPublished: false, publishedAt: null });

    await service.setCoursePublished(db, created.id, true);
    row = await service.getCourseForAdmin(db, created.id);
    expect(row?.isPublished).toBe(true);
    const firstPublishedAt = row?.publishedAt;
    expect(firstPublishedAt).toBeInstanceOf(Date);

    await service.setCoursePublished(db, created.id, false);
    row = await service.getCourseForAdmin(db, created.id);
    expect(row?.isPublished).toBe(false);
    expect(row?.publishedAt).toEqual(firstPublishedAt);
  });

  it("impede slugs duplicados com mensagem no campo", async () => {
    const db = getDb();
    await service.createCourse(db, input({ slug: "repetido" }));
    await expect(service.createCourse(db, input({ slug: "repetido" }))).rejects.toMatchObject({
      name: "ServiceError",
      field: "slug",
    });
    const other = await service.createCourse(db, input({ slug: "outro" }));
    await expect(service.updateCourse(db, other.id, input({ slug: "repetido" }))).rejects.toMatchObject({ field: "slug" });
  });

  it("valida a categoria e trata curso inexistente", async () => {
    const db = getDb();
    await expect(
      service.createCourse(db, input({ categoryId: "00000000-0000-4000-8000-000000000000" })),
    ).rejects.toMatchObject({ field: "categoryId" });
    await expect(service.updateCourse(db, "00000000-0000-4000-8000-000000000000", input())).rejects.toThrow("Curso não encontrado");
    await expect(service.deleteCourse(db, "00000000-0000-4000-8000-000000000000")).rejects.toThrow("Curso não encontrado");
  });

  it("não exclui curso com pedidos (preserva histórico)", async () => {
    const db = getDb();
    const course = await service.createCourse(db, input());
    await db.insert(orders).values({
      courseId: course.id,
      customerEmail: "aluno@exemplo.com",
      amountCents: 100,
      paymentProvider: "teste",
      providerReference: "ref-1",
    });
    await expect(service.deleteCourse(db, course.id)).rejects.toThrow(/pedidos registrados/);
  });

  it("restrições do banco barram dados inválidos mesmo sem a aplicação", async () => {
    const db = getDb();
    await expect(db.insert(courses).values({ title: "x", slug: "Slug Inválido" })).rejects.toThrow();
    await expect(db.insert(courses).values({ title: "x", slug: "preco", priceCents: -1 })).rejects.toThrow();
    await expect(db.insert(courses).values({ title: "x", slug: "moeda", currency: "real" })).rejects.toThrow();
    await expect(db.insert(courses).values({ title: "x", slug: "link", purchaseUrl: "http://inseguro.com" })).rejects.toThrow();
    await expect(
      db.insert(testimonials).values({ authorName: "A", content: "B", isPublished: true, consentConfirmed: false }),
    ).rejects.toThrow();
  });
});

describe("categorias", () => {
  it("excluir categoria deixa cursos sem categoria", async () => {
    const db = getDb();
    const category = await service.createCategory(db, { name: "Degradê", slug: "degrade", sortOrder: 0 });
    const course = await service.createCourse(db, input({ categoryId: category.id }));
    await expect(service.createCategory(db, { name: "Degradê", slug: "outro", sortOrder: 0 })).rejects.toMatchObject({ field: "name" });

    const [listed] = await service.listCategoriesForAdmin(db);
    expect(listed?.courseCount).toBe(1);

    await service.deleteCategory(db, category.id);
    const row = await service.getCourseForAdmin(db, course.id);
    expect(row?.categoryId).toBeNull();
    expect(await db.select().from(categories).where(eq(categories.id, category.id))).toHaveLength(0);
  });
});

describe("configurações e painel", () => {
  it("upsert mantém uma única linha de configurações", async () => {
    const db = getDb();
    await service.upsertSettings(db, { brandName: "Marca A" });
    await service.upsertSettings(db, { whatsappNumber: "5511912345678" });
    const settings = await service.getSettingsForAdmin(db);
    expect(settings).toMatchObject({ id: 1, brandName: "Marca A", whatsappNumber: "5511912345678" });
  });

  it("estatísticas refletem dados reais (sem números fictícios)", async () => {
    const db = getDb();
    const empty = await service.getDashboardStats(db);
    expect(empty.courses).toEqual({ total: 0, published: 0, drafts: 0, featured: 0, withoutPurchase: 0 });

    await service.createCourse(db, input({ slug: "aa", isPublished: true, isFeatured: true }));
    await service.createCourse(db, input({ slug: "bb", isPublished: true, purchaseUrl: "https://pay.hotmart.com/x" }));
    await service.createCourse(db, input({ slug: "cc" }));
    const stats = await service.getDashboardStats(db);
    expect(stats.courses).toEqual({ total: 3, published: 2, drafts: 1, featured: 1, withoutPurchase: 1 });
  });
});

describe("falha de conexão", () => {
  it("rejeita a consulta quando o banco está indisponível", async () => {
    const { db, close } = createDatabase("postgresql://ninguem:senha@127.0.0.1:1/inexistente");
    await expect(service.getDashboardStats(db)).rejects.toThrow();
    await close();
  });
});
