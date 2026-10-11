import { describe, expect, it } from "vitest";
import { filterCourses, parseCatalogParams, type CatalogCourse } from "@/lib/catalog";
import { formatDuration, formatPrice, whatsappLink } from "@/lib/format";
import { isOptimizableImage } from "@/lib/images";
import {
  isValidImageSrc,
  normalizeWhatsapp,
  parsePriceToCents,
  sanitizePurchaseUrl,
  slugify,
} from "@/lib/validation/common";
import { testimonialSchema } from "@/lib/validation/content";
import { createCourseSchema, hoursToMinutes } from "@/lib/validation/course";

const HOSTS = ["hotmart.com", "kiwify.com.br", "wa.me"];

function courseForm(overrides: Record<string, unknown> = {}) {
  return {
    title: "Degradê Avançado",
    slug: "",
    shortDescription: "Descrição curta",
    description: "",
    coverImageUrl: "",
    coverImageAlt: "",
    categoryId: "",
    level: "avancado",
    format: "",
    targetAudience: "",
    learningObjectives: "Objetivo 1\n\n Objetivo 2 ",
    curriculum: [{ title: "Módulo 1", lessons: ["Aula 1"] }],
    faq: [],
    commercialNotes: "",
    durationHours: "1,5",
    price: "1.297,90",
    currency: "BRL",
    purchaseUrl: "https://pay.hotmart.com/ABC",
    isFeatured: false,
    isPublished: true,
    sortOrder: "0",
    seoTitle: "",
    seoDescription: "",
    ...overrides,
  };
}

describe("slugify", () => {
  it("remove acentos e caracteres especiais", () => {
    expect(slugify("Degradê & Navalha: Avançado!")).toBe("degrade-navalha-avancado");
    expect(slugify("  --Barba--  ")).toBe("barba");
  });
});

describe("parsePriceToCents", () => {
  it.each([
    ["297", 29700],
    ["297,90", 29790],
    ["1.297,90", 129790],
    ["R$ 1.297,90", 129790],
    ["1297.90", 129790],
    ["0", 0],
    ["", null],
  ])("%s → %s", (input, expected) => {
    expect(parsePriceToCents(input)).toBe(expected);
  });

  it("rejeita formatos inválidos", () => {
    expect(parsePriceToCents("12,3,4")).toBeNaN();
    expect(parsePriceToCents("abc")).toBeNaN();
    expect(parsePriceToCents("-10")).toBeNaN();
  });
});

describe("links de compra", () => {
  it("aceita https em domínios autorizados e subdomínios", () => {
    expect(sanitizePurchaseUrl("https://pay.hotmart.com/X1", HOSTS)).toBe("https://pay.hotmart.com/X1");
    expect(sanitizePurchaseUrl("https://kiwify.com.br/abc", HOSTS)).toBe("https://kiwify.com.br/abc");
  });

  it("rejeita http, javascript:, credenciais e domínios parecidos", () => {
    expect(sanitizePurchaseUrl("http://pay.hotmart.com/X1", HOSTS)).toBeNull();
    expect(sanitizePurchaseUrl("javascript:alert(1)", HOSTS)).toBeNull();
    expect(sanitizePurchaseUrl("https://user:pass@hotmart.com/", HOSTS)).toBeNull();
    expect(sanitizePurchaseUrl("https://hotmart.com.golpe.io/", HOSTS)).toBeNull();
    expect(sanitizePurchaseUrl("https://fakehotmart.com/", HOSTS)).toBeNull();
    expect(sanitizePurchaseUrl("", HOSTS)).toBeNull();
    expect(sanitizePurchaseUrl(null, HOSTS)).toBeNull();
  });
});

describe("imagens", () => {
  it("aceita https e caminhos locais seguros", () => {
    expect(isValidImageSrc("https://res.cloudinary.com/x/foto.jpg")).toBe(true);
    expect(isValidImageSrc("/images/foto.webp")).toBe(true);
    expect(isValidImageSrc("/images/../segredo.png")).toBe(false);
    expect(isValidImageSrc("//evil.com/a.png")).toBe(false);
    expect(isValidImageSrc("http://site.com/a.png")).toBe(false);
    expect(isValidImageSrc("data:image/png;base64,AAA")).toBe(false);
  });

  it("otimiza apenas hosts configurados", () => {
    const hosts = ["res.cloudinary.com", "*.public.blob.vercel-storage.com"];
    expect(isOptimizableImage("https://res.cloudinary.com/a.jpg", hosts)).toBe(true);
    expect(isOptimizableImage("https://abc.public.blob.vercel-storage.com/a.jpg", hosts)).toBe(true);
    expect(isOptimizableImage("https://outro.com/a.jpg", hosts)).toBe(false);
    expect(isOptimizableImage("/local.jpg", hosts)).toBe(true);
  });
});

describe("schema de curso", () => {
  const schema = createCourseSchema(HOSTS);

  it("normaliza um formulário válido", () => {
    const result = schema.parse(courseForm());
    expect(result.slug).toBe("degrade-avancado");
    expect(result.priceCents).toBe(129790);
    expect(result.durationMinutes).toBe(90);
    expect(result.learningObjectives).toEqual(["Objetivo 1", "Objetivo 2"]);
    expect(result.format).toBeNull();
    expect(result.categoryId).toBeNull();
  });

  it("exige título e descrição curta", () => {
    const result = schema.safeParse(courseForm({ title: "  ", shortDescription: "" }));
    expect(result.success).toBe(false);
    const paths = result.error!.issues.map((issue) => issue.path.join("."));
    expect(paths).toContain("title");
    expect(paths).toContain("shortDescription");
  });

  it("bloqueia link de compra fora da lista ou sem https", () => {
    expect(schema.safeParse(courseForm({ purchaseUrl: "https://golpe.com/pagar" })).success).toBe(false);
    expect(schema.safeParse(courseForm({ purchaseUrl: "http://pay.hotmart.com/x" })).success).toBe(false);
    expect(schema.safeParse(courseForm({ purchaseUrl: "" })).data?.purchaseUrl).toBeNull();
  });

  it("rejeita slug inválido, preço negativo, nível e JSON corrompido", () => {
    expect(schema.safeParse(courseForm({ slug: "Slug Com Espaço" })).success).toBe(false);
    expect(schema.safeParse(courseForm({ price: "-5" })).success).toBe(false);
    expect(schema.safeParse(courseForm({ level: "mestre" })).success).toBe(false);
    expect(schema.safeParse(courseForm({ curriculum: Symbol.for("invalid-json") })).success).toBe(false);
    expect(schema.safeParse(courseForm({ categoryId: "not-a-uuid" })).success).toBe(false);
  });

  it("converte horas em minutos", () => {
    expect(hoursToMinutes("2")).toBe(120);
    expect(hoursToMinutes("0,25")).toBe(15);
    expect(hoursToMinutes("")).toBeNull();
    expect(hoursToMinutes("duas")).toBeNaN();
  });
});

describe("depoimentos", () => {
  it("não permite publicar sem autorização registrada", () => {
    const base = { authorName: "Ana", authorDetail: "", content: "Ótimo curso", courseId: "", sortOrder: "0" };
    expect(testimonialSchema.safeParse({ ...base, isPublished: true, consentConfirmed: false }).success).toBe(false);
    expect(testimonialSchema.safeParse({ ...base, isPublished: true, consentConfirmed: true }).success).toBe(true);
    expect(testimonialSchema.safeParse({ ...base, isPublished: false, consentConfirmed: false }).success).toBe(true);
  });
});

describe("formatação", () => {
  it("formata preço, duração e WhatsApp", () => {
    expect(formatPrice(29790)).toBe("R$ 297,90");
    expect(formatPrice(null)).toBeNull();
    expect(formatDuration(90)).toBe("1h30");
    expect(formatDuration(120)).toBe("2 horas");
    expect(normalizeWhatsapp("+55 (11) 91234-5678")).toBe("5511912345678");
    expect(whatsappLink("5511912345678", "Olá & tudo?")).toBe("https://wa.me/5511912345678?text=Ol%C3%A1%20%26%20tudo%3F");
    expect(whatsappLink("123", null)).toBeNull();
  });
});

describe("catálogo: busca, filtros e ordenação", () => {
  const base = { isFeatured: false, sortOrder: 0, publishedAt: null, createdAt: new Date("2025-01-01") };
  const courses: CatalogCourse[] = [
    { ...base, title: "Degradê do zero", shortDescription: "Fundamentos", categorySlug: "degrade", categoryName: "Degradê", level: "iniciante", priceCents: 29700 },
    { ...base, title: "Barba completa", shortDescription: "Modelagem", categorySlug: "barba", categoryName: "Barba", level: "todos", priceCents: null },
    { ...base, title: "Navalha avançada", shortDescription: "Acabamento", categorySlug: null, categoryName: null, level: "avancado", priceCents: 49700, isFeatured: true },
  ];

  it("busca ignorando acentos e maiúsculas", () => {
    expect(filterCourses(courses, parseCatalogParams({ q: "DEGRADE" })).map((c) => c.title)).toEqual(["Degradê do zero"]);
    expect(filterCourses(courses, parseCatalogParams({ q: "acabamento navalha" }))).toHaveLength(1);
    expect(filterCourses(courses, parseCatalogParams({ q: "inexistente" }))).toHaveLength(0);
  });

  it("filtra por categoria e nível (\"todos os níveis\" aparece em qualquer nível)", () => {
    expect(filterCourses(courses, parseCatalogParams({ categoria: "barba" })).map((c) => c.title)).toEqual(["Barba completa"]);
    expect(filterCourses(courses, parseCatalogParams({ nivel: "avancado" })).map((c) => c.title).sort()).toEqual([
      "Barba completa",
      "Navalha avançada",
    ]);
  });

  it("ordena por preço deixando cursos sem preço no fim", () => {
    expect(filterCourses(courses, parseCatalogParams({ ordem: "menor-preco" })).map((c) => c.priceCents)).toEqual([29700, 49700, null]);
    expect(filterCourses(courses, parseCatalogParams({ ordem: "maior-preco" })).map((c) => c.priceCents)).toEqual([49700, 29700, null]);
    expect(filterCourses(courses, parseCatalogParams({}))[0]!.title).toBe("Navalha avançada");
  });

  it("descarta parâmetros desconhecidos ou maliciosos", () => {
    const params = parseCatalogParams({ categoria: "<script>", nivel: "mestre", ordem: "drop", q: "x".repeat(500) });
    expect(params).toEqual({ q: "x".repeat(80), categoria: null, nivel: null, ordem: "relevancia" });
  });
});
