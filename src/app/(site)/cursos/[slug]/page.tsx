import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Check, ChevronDown, Clock, Layers, Monitor, Signal } from "lucide-react";
import { CourseCard } from "@/components/site/course-card";
import { FaqList } from "@/components/site/faq-list";
import { PurchaseCta } from "@/components/site/purchase-cta";
import { RichText } from "@/components/site/rich-text";
import { Container } from "@/components/ui/container";
import { SiteImage } from "@/components/ui/site-image";
import { FORMAT_LABELS, formatDuration, formatPrice, LEVEL_LABELS, minutesToIsoDuration } from "@/lib/format";
import { getSiteUrl } from "@/lib/env";
import {
  getPublishedCourseBySlug,
  getPublishedCourses,
  getRelatedCourses,
  getSiteSettings,
  type PublicCourse,
} from "@/server/data/public";

export async function generateStaticParams() {
  const courses = await getPublishedCourses();
  // Cache Components exige ao menos um parâmetro; slugs inexistentes caem no not-found.
  return courses.length ? courses.map((course) => ({ slug: course.slug })) : [{ slug: "__vazio" }];
}

export async function generateMetadata({ params }: PageProps<"/cursos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublishedCourseBySlug(slug);
  if (!course) return { title: "Curso não encontrado", robots: { index: false } };
  const title = course.seoTitle ?? course.title;
  const description = course.seoDescription ?? course.shortDescription;
  return {
    title,
    description,
    alternates: { canonical: `/cursos/${course.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/cursos/${course.slug}`,
      images: course.coverImageUrl ? [{ url: course.coverImageUrl, alt: course.coverImageAlt ?? course.title }] : undefined,
    },
  };
}

export default function CoursePage({ params }: PageProps<"/cursos/[slug]">) {
  return (
    <Suspense fallback={<CourseSkeleton />}>
      <CourseContent params={params} />
    </Suspense>
  );
}

async function CourseContent({ params }: Pick<PageProps<"/cursos/[slug]">, "params">) {
  const { slug } = await params;
  const course = await getPublishedCourseBySlug(slug);
  if (!course) notFound();

  const [settings, related] = await Promise.all([getSiteSettings(), getRelatedCourses(course)]);
  const price = formatPrice(course.priceCents, course.currency);
  const duration = formatDuration(course.durationMinutes);
  const facts = [
    { icon: Signal, label: "Nível", value: LEVEL_LABELS[course.level] },
    duration ? { icon: Clock, label: "Duração", value: duration } : null,
    course.format ? { icon: Monitor, label: "Formato", value: FORMAT_LABELS[course.format] } : null,
    course.curriculum.length
      ? {
          icon: Layers,
          label: "Conteúdo",
          value: `${course.curriculum.length} ${course.curriculum.length === 1 ? "módulo" : "módulos"}`,
        }
      : null,
  ].filter((fact) => fact !== null);

  const purchase = (
    <PurchaseCta courseTitle={course.title} purchaseUrl={course.purchaseUrl} whatsappNumber={settings.whatsappNumber} />
  );

  return (
    <>
      <CourseJsonLd course={course} brandName={settings.brandName} />

      <section className="border-b border-line">
        <Container className="pb-12 pt-8 lg:pb-16 lg:pt-12">
          <nav aria-label="Trilha de navegação" className="text-sm text-mute">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/cursos" className="inline-flex items-center gap-1.5 py-2 hover:text-paper">
                  <ArrowLeft className="size-4" aria-hidden /> Cursos
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="truncate text-soft">
                {course.title}
              </li>
            </ol>
          </nav>

          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              {course.categoryName ? <p className="eyebrow">{course.categoryName}</p> : null}
              <h1 className="display mt-5 text-5xl text-paper sm:text-6xl lg:text-7xl">{course.title}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-soft">{course.shortDescription}</p>
              <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
                {facts.map((fact) => (
                  <div key={fact.label} className="bg-ink p-4">
                    <dt className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-mute">
                      <fact.icon className="size-3.5" aria-hidden />
                      {fact.label}
                    </dt>
                    <dd className="mt-2 font-semibold text-paper">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-line bg-graphite">
              {course.coverImageUrl ? (
                <SiteImage
                  src={course.coverImageUrl}
                  alt={course.coverImageAlt ?? ""}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div aria-hidden className="hairline-grid flex h-full items-end p-8">
                  <span className="display text-6xl text-paper/15">{course.title}</span>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Container className="grid gap-12 py-14 lg:grid-cols-[1fr_22rem] lg:gap-16 lg:py-20">
        <div className="min-w-0 space-y-16">
          {course.description ? (
            <section aria-labelledby="sobre-curso">
              <h2 id="sobre-curso" className="text-2xl font-semibold tracking-tight text-paper">
                Sobre o curso
              </h2>
              <RichText text={course.description} className="prose-site mt-5 text-[1.05rem]" />
            </section>
          ) : null}

          {course.targetAudience ? (
            <section aria-labelledby="publico">
              <h2 id="publico" className="text-2xl font-semibold tracking-tight text-paper">
                Para quem é
              </h2>
              <RichText text={course.targetAudience} className="prose-site mt-5 text-[1.05rem]" />
            </section>
          ) : null}

          {course.learningObjectives.length ? (
            <section aria-labelledby="objetivos">
              <h2 id="objetivos" className="text-2xl font-semibold tracking-tight text-paper">
                O que você vai aprender
              </h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {course.learningObjectives.map((objective) => (
                  <li key={objective} className="flex gap-3 rounded-2xl border border-line bg-graphite p-4 text-soft">
                    <Check className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {course.curriculum.length ? (
            <section aria-labelledby="conteudo-programatico">
              <h2 id="conteudo-programatico" className="text-2xl font-semibold tracking-tight text-paper">
                Conteúdo programático
              </h2>
              <ol className="mt-6 space-y-3">
                {course.curriculum.map((module, index) => (
                  <li key={`${module.title}-${index}`}>
                    <details className="group rounded-2xl border border-line bg-graphite" open={index === 0}>
                      <summary className="flex items-center gap-4 p-5">
                        <span className="font-serif text-2xl italic text-gold">{String(index + 1).padStart(2, "0")}</span>
                        <span className="flex-1 font-semibold text-paper">{module.title}</span>
                        {module.lessons.length ? (
                          <span className="hidden text-sm text-mute sm:inline">
                            {module.lessons.length} {module.lessons.length === 1 ? "aula" : "aulas"}
                          </span>
                        ) : null}
                        <ChevronDown aria-hidden className="size-5 text-mute transition-transform group-open:rotate-180" />
                      </summary>
                      {module.lessons.length ? (
                        <ul className="space-y-2 border-t border-line px-5 py-4 text-sm text-soft">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <li key={lessonIndex} className="flex gap-3">
                              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-gold/70" />
                              {lesson}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </details>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {settings.instructorName ? (
            <section aria-labelledby="instrutor" className="rounded-3xl border border-line bg-ink-2 p-6 sm:p-8">
              <p className="eyebrow">Instrutor</p>
              <div className="mt-5 flex items-center gap-5">
                {settings.instructorPhotoUrl ? (
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-graphite">
                    <SiteImage src={settings.instructorPhotoUrl} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                ) : null}
                <div>
                  <h2 id="instrutor" className="text-xl font-semibold text-paper">
                    {settings.instructorName}
                  </h2>
                  {settings.instructorRole ? <p className="text-sm text-gold">{settings.instructorRole}</p> : null}
                </div>
              </div>
              {settings.instructorSummary ? (
                <p className="mt-5 leading-relaxed text-soft">{settings.instructorSummary}</p>
              ) : null}
              <Link href="/sobre" className="mt-5 inline-block text-sm font-medium text-gold hover:text-gold-strong">
                Ver trajetória completa
              </Link>
            </section>
          ) : null}

          {course.faq.length ? (
            <section aria-labelledby="faq-curso">
              <h2 id="faq-curso" className="mb-4 text-2xl font-semibold tracking-tight text-paper">
                Perguntas frequentes
              </h2>
              <FaqList items={course.faq} />
            </section>
          ) : null}
        </div>

        <aside aria-label="Inscrição" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-line bg-graphite p-6 sm:p-8">
            <p className="text-sm text-mute">Investimento</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-paper">{price ?? "Sob consulta"}</p>
            {course.commercialNotes ? <p className="mt-3 text-sm leading-relaxed text-soft">{course.commercialNotes}</p> : null}
            <div className="mt-6">{purchase}</div>
            {course.purchaseUrl ? (
              <p className="mt-4 text-xs leading-relaxed text-mute">
                O pagamento é processado com segurança pela plataforma parceira, em nova aba.
              </p>
            ) : null}
          </div>
        </aside>
      </Container>

      {related.length ? (
        <section aria-labelledby="relacionados" className="border-t border-line">
          <Container className="py-16 lg:py-24">
            <h2 id="relacionados" className="display text-4xl text-paper sm:text-5xl">
              Outros cursos
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <CourseCard key={item.id} course={item} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Barra de compra fixa no celular */}
      <div className="sticky bottom-0 z-30 border-t border-line bg-ink/95 backdrop-blur lg:hidden">
        <Container className="flex items-center gap-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-mute">{course.title}</p>
            <p className="font-semibold text-paper">{price ?? "Sob consulta"}</p>
          </div>
          <PurchaseCta
            courseTitle={course.title}
            purchaseUrl={course.purchaseUrl}
            whatsappNumber={settings.whatsappNumber}
            compact
            className="w-auto shrink-0"
          />
        </Container>
      </div>
    </>
  );
}

/** Dados estruturados apenas com informações reais do curso (sem avaliações inventadas). */
function CourseJsonLd({ course, brandName }: { course: PublicCourse; brandName: string }) {
  const url = `${getSiteUrl()}/cursos/${course.slug}`;
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description: course.shortDescription,
      url,
      inLanguage: "pt-BR",
      provider: { "@type": "Organization", name: brandName, sameAs: getSiteUrl() },
      ...(course.coverImageUrl ? { image: course.coverImageUrl } : {}),
      ...(course.durationMinutes ? { timeRequired: minutesToIsoDuration(course.durationMinutes) } : {}),
      ...(course.level !== "todos" ? { educationalLevel: LEVEL_LABELS[course.level] } : {}),
      ...(course.priceCents !== null
        ? {
            offers: {
              "@type": "Offer",
              price: (course.priceCents / 100).toFixed(2),
              priceCurrency: course.currency,
              category: "Paid",
              ...(course.purchaseUrl ? { url: course.purchaseUrl } : {}),
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Cursos", item: `${getSiteUrl()}/cursos` },
        { "@type": "ListItem", position: 2, name: course.title, item: url },
      ],
    },
  ];
  return (
    <script
      type="application/ld+json"
      // JSON.stringify + escape de "<" impede a quebra do <script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

function CourseSkeleton() {
  return (
    <Container className="py-12" >
      <div role="status" aria-label="Carregando curso" className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="h-3 w-28 animate-pulse rounded bg-graphite" />
          <div className="h-16 w-4/5 animate-pulse rounded-xl bg-graphite" />
          <div className="h-5 w-full animate-pulse rounded bg-graphite" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-graphite" />
        </div>
        <div className="aspect-[4/3] animate-pulse rounded-[1.75rem] bg-graphite" />
        <span className="sr-only">Carregando curso…</span>
      </div>
    </Container>
  );
}
