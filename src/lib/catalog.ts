import { COURSE_LEVELS, type CourseLevel } from "@/lib/constants";
import { normalizeForSearch } from "./format";

export const SORT_OPTIONS = {
  relevancia: "Recomendados",
  recentes: "Mais recentes",
  "menor-preco": "Menor preço",
  "maior-preco": "Maior preço",
  "a-z": "Nome (A–Z)",
} as const;

export type SortOption = keyof typeof SORT_OPTIONS;

export type CatalogParams = {
  q: string;
  categoria: string | null;
  nivel: CourseLevel | null;
  ordem: SortOption;
};

export type CatalogCourse = {
  title: string;
  shortDescription: string;
  categorySlug: string | null;
  categoryName: string | null;
  level: CourseLevel;
  priceCents: number | null;
  isFeatured: boolean;
  sortOrder: number;
  publishedAt: Date | null;
  createdAt: Date;
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Normaliza os parâmetros da URL, descartando valores desconhecidos. */
export function parseCatalogParams(raw: Record<string, string | string[] | undefined>): CatalogParams {
  const q = first(raw.q).trim().slice(0, 80);
  const categoria = first(raw.categoria).trim().toLowerCase();
  const nivel = first(raw.nivel).trim();
  const ordem = first(raw.ordem).trim();
  return {
    q,
    categoria: /^[a-z0-9-]{1,80}$/.test(categoria) ? categoria : null,
    nivel: (COURSE_LEVELS as readonly string[]).includes(nivel) ? (nivel as CourseLevel) : null,
    ordem: ordem in SORT_OPTIONS ? (ordem as SortOption) : "relevancia",
  };
}

/** Busca (sem acentos), filtros e ordenação sobre a lista de cursos publicados. */
export function filterCourses<T extends CatalogCourse>(courses: readonly T[], params: CatalogParams): T[] {
  const terms = normalizeForSearch(params.q).split(/\s+/).filter(Boolean);

  const filtered = courses.filter((course) => {
    if (params.categoria && course.categorySlug !== params.categoria) return false;
    if (params.nivel && course.level !== params.nivel && course.level !== "todos") return false;
    if (terms.length) {
      const haystack = normalizeForSearch(
        `${course.title} ${course.shortDescription} ${course.categoryName ?? ""}`,
      );
      return terms.every((term) => haystack.includes(term));
    }
    return true;
  });

  const byPrice = (direction: 1 | -1) => (a: T, b: T) => {
    // Cursos sem preço informado vão para o fim em ambas as direções.
    if (a.priceCents === null && b.priceCents === null) return 0;
    if (a.priceCents === null) return 1;
    if (b.priceCents === null) return -1;
    return (a.priceCents - b.priceCents) * direction;
  };

  const sorted = [...filtered];
  switch (params.ordem) {
    case "recentes":
      sorted.sort(
        (a, b) =>
          (b.publishedAt ?? b.createdAt).getTime() - (a.publishedAt ?? a.createdAt).getTime(),
      );
      break;
    case "menor-preco":
      sorted.sort(byPrice(1));
      break;
    case "maior-preco":
      sorted.sort(byPrice(-1));
      break;
    case "a-z":
      sorted.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
      break;
    default:
      sorted.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          a.sortOrder - b.sortOrder ||
          a.title.localeCompare(b.title, "pt-BR"),
      );
  }
  return sorted;
}
