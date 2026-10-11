import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { AutoSubmitSelect } from "@/components/site/auto-submit-select";
import { CourseCard } from "@/components/site/course-card";
import { Emphasis } from "@/components/site/emphasis";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { COURSE_LEVELS } from "@/lib/constants";
import { filterCourses, parseCatalogParams, SORT_OPTIONS, type CatalogParams } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { LEVEL_LABELS } from "@/lib/format";
import { getPublicCategories, getPublishedCourses } from "@/server/data/public";

export const metadata: Metadata = {
  title: "Cursos",
  description: "Catálogo de cursos de barbearia: degradê, acabamento, técnicas de corte e mais.",
  alternates: { canonical: "/cursos" },
};

export default function CoursesPage({ searchParams }: PageProps<"/cursos">) {
  return (
    <>
      <section className="border-b border-line">
        <Container className="pb-12 pt-12 sm:pt-16 lg:pb-16 lg:pt-20">
          <p className="eyebrow">Catálogo</p>
          <h1 className="display mt-5 text-6xl text-paper sm:text-7xl lg:text-8xl">
            Cursos <Emphasis text="*disponíveis*" />
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-soft">
            Encontre a formação certa para o seu momento — do fundamento às técnicas avançadas.
          </p>
        </Container>
      </section>
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function buildHref(params: CatalogParams, patch: Partial<CatalogParams>) {
  const next = { ...params, ...patch };
  const query = new URLSearchParams();
  if (next.q) query.set("q", next.q);
  if (next.categoria) query.set("categoria", next.categoria);
  if (next.nivel) query.set("nivel", next.nivel);
  if (next.ordem !== "relevancia") query.set("ordem", next.ordem);
  const qs = query.toString();
  return qs ? `/cursos?${qs}` : "/cursos";
}

async function Catalog({ searchParams }: Pick<PageProps<"/cursos">, "searchParams">) {
  const params = parseCatalogParams(await searchParams);
  const [courses, categories] = await Promise.all([getPublishedCourses(), getPublicCategories()]);
  const results = filterCourses(courses, params);
  const hasFilters = Boolean(params.q || params.categoria || params.nivel);

  return (
    <Container className="py-10 lg:py-14">
      {courses.length ? (
        <>
          <form role="search" action="/cursos" className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            {params.categoria ? <input type="hidden" name="categoria" value={params.categoria} /> : null}
            <label className="relative block">
              <span className="sr-only">Buscar cursos</span>
              <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mute" />
              <input
                type="search"
                name="q"
                defaultValue={params.q}
                placeholder="Buscar por nome ou tema"
                maxLength={80}
                className="h-12 w-full rounded-full border border-line bg-graphite pl-11 pr-4 text-paper placeholder:text-mute focus:border-gold focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="sr-only">Nível</span>
              <AutoSubmitSelect
                name="nivel"
                defaultValue={params.nivel ?? ""}
                className="h-12 w-full rounded-full border border-line bg-graphite px-4 text-paper focus:border-gold focus:outline-none"
              >
                <option value="">Todos os níveis</option>
                {COURSE_LEVELS.filter((level) => level !== "todos").map((level) => (
                  <option key={level} value={level}>
                    {LEVEL_LABELS[level]}
                  </option>
                ))}
              </AutoSubmitSelect>
            </label>
            <label className="block">
              <span className="sr-only">Ordenar por</span>
              <AutoSubmitSelect
                name="ordem"
                defaultValue={params.ordem}
                className="h-12 w-full rounded-full border border-line bg-graphite px-4 text-paper focus:border-gold focus:outline-none"
              >
                {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </AutoSubmitSelect>
            </label>
            <button type="submit" className={buttonClasses({ className: "h-12" })}>
              Buscar
            </button>
          </form>

          {categories.length > 1 ? (
            <nav aria-label="Categorias" className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
                <li>
                  <CategoryChip href={buildHref(params, { categoria: null })} active={!params.categoria}>
                    Todas
                  </CategoryChip>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <CategoryChip
                      href={buildHref(params, { categoria: category.slug })}
                      active={params.categoria === category.slug}
                    >
                      {category.name}
                    </CategoryChip>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <div className="mt-10 flex items-center justify-between gap-4 border-b border-line pb-4 text-sm text-mute">
            <p aria-live="polite">
              {results.length === 1 ? "1 curso encontrado" : `${results.length} cursos encontrados`}
            </p>
            {hasFilters ? (
              <Link href="/cursos" className="font-medium text-gold hover:text-gold-strong">
                Limpar filtros
              </Link>
            ) : null}
          </div>

          {results.length ? (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((course, index) => (
                <li key={course.id} className="flex">
                  <div className="w-full">
                    <CourseCard course={course} headingLevel="h2" priority={index < 2} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-10 rounded-3xl border border-dashed border-line-strong p-10 text-center">
              <p className="text-xl font-semibold text-paper">Nenhum curso corresponde à sua busca.</p>
              <p className="mt-2 text-soft">Tente outro termo ou remova os filtros.</p>
              <Link href="/cursos" className={buttonClasses({ variant: "secondary", className: "mt-6" })}>
                Ver todos os cursos
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-line-strong p-10 text-center sm:p-16">
          <p className="display text-4xl text-paper">Novas turmas em preparação</p>
          <p className="mx-auto mt-3 max-w-md text-soft">
            Ainda não há cursos publicados. Volte em breve ou entre em contato para saber das próximas turmas.
          </p>
          <Link href="/contato" className={buttonClasses({ variant: "secondary", className: "mt-8" })}>
            Entrar em contato
          </Link>
        </div>
      )}
    </Container>
  );
}

function CategoryChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex min-h-10 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors",
        active ? "border-gold bg-gold text-ink" : "border-line text-soft hover:border-line-strong hover:text-paper",
      )}
    >
      {children}
    </Link>
  );
}

function CatalogSkeleton() {
  return (
    <Container className="py-10 lg:py-14">
      <div role="status" aria-label="Carregando cursos">
        <div className="h-12 animate-pulse rounded-full bg-graphite" />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-3xl border border-line bg-graphite">
              <div className="aspect-[4/3] animate-pulse bg-graphite-2" />
              <div className="space-y-3 p-6">
                <div className="h-3 w-24 animate-pulse rounded bg-graphite-2" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-graphite-2" />
                <div className="h-4 w-full animate-pulse rounded bg-graphite-2" />
              </div>
            </div>
          ))}
        </div>
        <span className="sr-only">Carregando cursos…</span>
      </div>
    </Container>
  );
}
