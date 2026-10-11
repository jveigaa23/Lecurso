import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { CourseCard } from "@/components/site/course-card";
import { Emphasis } from "@/components/site/emphasis";
import { FaqList } from "@/components/site/faq-list";
import { MonogramPanel } from "@/components/site/monogram-panel";
import { ExternalButton, LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { WhatsappIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { SiteImage } from "@/components/ui/site-image";
import { whatsappLink } from "@/lib/format";
import { DEFAULT_HERO_SUBTITLE, DEFAULT_HERO_TITLE } from "@/lib/site-defaults";
import { getFeaturedCourses, getPublishedTestimonials, getSiteSettings } from "@/server/data/public";

export default async function HomePage() {
  const [settings, featured, testimonials] = await Promise.all([
    getSiteSettings(),
    getFeaturedCourses(3),
    getPublishedTestimonials(),
  ]);
  const whatsapp = whatsappLink(settings.whatsappNumber, settings.whatsappMessage);
  const specialties = settings.about.specialties;
  const hasInstructor = Boolean(settings.instructorName || settings.instructorSummary);

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(60%_60%_at_70%_0%,rgb(198_161_91/0.09),transparent_70%)]"
        />
        <Container className="grid items-center gap-12 pb-16 pt-10 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pb-28 lg:pt-20">
          <div className="animate-rise">
            <p className="eyebrow">{settings.tagline ?? "Barbearia · Técnica · Ensino"}</p>
            <h1 id="hero-title" className="display mt-6 text-[3.4rem] text-paper sm:text-7xl lg:text-[6.4rem]">
              <Emphasis text={settings.heroTitle ?? DEFAULT_HERO_TITLE} />
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-soft sm:text-xl">
              {settings.heroSubtitle ?? DEFAULT_HERO_SUBTITLE}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/cursos" size="lg">
                Conhecer os cursos
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </LinkButton>
              <LinkButton href="/sobre" size="lg" variant="secondary">
                Conheça o instrutor
              </LinkButton>
            </div>
            {specialties.length ? (
              <ul aria-label="Especialidades" className="mt-12 flex flex-wrap gap-2">
                {specialties.slice(0, 5).map((item) => (
                  <li key={item} className="rounded-full border border-line px-4 py-1.5 text-sm text-soft">
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="animate-rise [animation-delay:120ms]">
            {settings.heroImageUrl ? (
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-line bg-graphite">
                <SiteImage
                  src={settings.heroImageUrl}
                  alt={settings.heroImageAlt ?? `${settings.instructorName ?? settings.brandName} em atendimento`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent" />
              </div>
            ) : (
              <MonogramPanel
                name={settings.instructorName ?? settings.brandName}
                caption="Fundamento, precisão e acabamento — ensinados passo a passo."
                className="aspect-[4/5]"
              />
            )}
          </div>
        </Container>
      </section>

      {/* Instrutor */}
      {hasInstructor ? (
        <section aria-labelledby="instrutor-title" className="border-t border-line bg-ink-2">
          <Container className="grid items-center gap-10 py-20 md:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-28">
            {settings.instructorPhotoUrl ? (
              <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-line bg-graphite">
                <SiteImage
                  src={settings.instructorPhotoUrl}
                  alt={`Retrato de ${settings.instructorName ?? "instrutor"}`}
                  fill
                  sizes="(min-width: 768px) 35vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <MonogramPanel name={settings.instructorName ?? settings.brandName} className="aspect-square" compact />
            )}
            <div>
              <p className="eyebrow">O instrutor</p>
              <h2 id="instrutor-title" className="display mt-5 text-5xl text-paper sm:text-6xl">
                {settings.instructorName ?? settings.brandName}
              </h2>
              {settings.instructorRole ? <p className="mt-3 text-lg text-gold">{settings.instructorRole}</p> : null}
              {settings.instructorSummary ? (
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-soft">{settings.instructorSummary}</p>
              ) : null}
              <Link
                href="/sobre"
                className="group mt-8 inline-flex items-center gap-2 border-b border-gold/50 pb-1 font-medium text-paper transition-colors hover:border-gold"
              >
                Conheça a trajetória
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </Container>
        </section>
      ) : null}

      {/* Cursos em destaque */}
      <section aria-labelledby="cursos-title" className="border-t border-line">
        <Container className="py-20 lg:py-28">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              id="cursos-title"
              eyebrow="Cursos"
              title={
                <>
                  Aprenda com <Emphasis text="*método*" />
                </>
              }
              description="Formações pensadas para quem quer evoluir na técnica e trabalhar com segurança."
            />
            {featured.length ? (
              <LinkButton href="/cursos" variant="secondary" className="self-start md:self-auto">
                Ver todos os cursos
              </LinkButton>
            ) : null}
          </div>

          {featured.length ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((course, index) => (
                <CourseCard key={course.id} course={course} priority={index === 0} />
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-3xl border border-dashed border-line-strong p-10 text-center sm:p-14">
              <p className="display text-3xl text-paper">Novas turmas em preparação</p>
              <p className="mx-auto mt-3 max-w-md text-soft">
                Os cursos serão publicados aqui em breve.
                {whatsapp ? " Enquanto isso, fale diretamente pelo WhatsApp." : ""}
              </p>
              {whatsapp ? (
                <ExternalButton href={whatsapp} className="mt-8" variant="secondary">
                  <WhatsappIcon className="size-4" /> Falar no WhatsApp
                </ExternalButton>
              ) : null}
            </div>
          )}
        </Container>
      </section>

      {/* Método */}
      {settings.methodItems.length ? (
        <section aria-labelledby="metodo-title" className="border-t border-line bg-ink-2">
          <Container className="py-20 lg:py-28">
            <SectionHeading
              id="metodo-title"
              eyebrow="O método"
              title={
                <>
                  Como o ensino <Emphasis text="*funciona*" />
                </>
              }
            />
            <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {settings.methodItems.map((item, index) => (
                <li key={item.title} className="bg-ink-2 p-8 lg:p-10">
                  <span className="font-serif text-5xl italic text-gold">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight text-paper">{item.title}</h3>
                  <p className="mt-3 leading-relaxed text-soft">{item.description}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      ) : null}

      {/* Galeria */}
      {settings.gallery.length ? (
        <section aria-labelledby="galeria-title" className="border-t border-line">
          <Container className="py-20 lg:py-28">
            <SectionHeading
              id="galeria-title"
              eyebrow="Trabalhos"
              title={
                <>
                  Resultado na <Emphasis text="*cadeira*" />
                </>
              }
            />
            <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {settings.gallery.map((image, index) => (
                <li
                  key={image.url}
                  className={
                    index % 5 === 0
                      ? "relative col-span-2 row-span-2 aspect-square overflow-hidden rounded-2xl bg-graphite"
                      : "relative aspect-square overflow-hidden rounded-2xl bg-graphite"
                  }
                >
                  <SiteImage
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes={index % 5 === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                    className="object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
                  />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* Depoimentos (somente os autorizados e publicados) */}
      {testimonials.length ? (
        <section aria-labelledby="depoimentos-title" className="border-t border-line bg-ink-2">
          <Container className="py-20 lg:py-28">
            <SectionHeading id="depoimentos-title" eyebrow="Depoimentos" title="Quem já passou por aqui" />
            <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <figure className="flex h-full flex-col rounded-3xl border border-line bg-graphite p-8">
                    <Quote className="size-7 text-gold" aria-hidden />
                    <blockquote className="mt-5 flex-1 leading-relaxed text-paper/90">{item.content}</blockquote>
                    <figcaption className="mt-6 border-t border-line pt-5 text-sm">
                      <span className="font-semibold text-paper">{item.authorName}</span>
                      {item.authorDetail ? <span className="block text-mute">{item.authorDetail}</span> : null}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* FAQ */}
      {settings.faq.length ? (
        <section aria-labelledby="faq-title" className="border-t border-line">
          <Container className="grid gap-12 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
            <SectionHeading id="faq-title" eyebrow="Dúvidas" title="Perguntas frequentes" />
            <FaqList items={settings.faq} />
          </Container>
        </section>
      ) : null}

      {/* CTA final */}
      <section aria-labelledby="cta-title" className="border-t border-line">
        <Container className="py-20 lg:py-28">
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-graphite px-6 py-16 text-center sm:px-12 lg:py-24">
            <div aria-hidden className="hairline-grid absolute inset-0 opacity-60" />
            <div className="relative">
              <h2 id="cta-title" className="display mx-auto max-w-3xl text-5xl text-paper sm:text-6xl lg:text-7xl">
                O próximo nível começa na <Emphasis text="*técnica*" />.
              </h2>
              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <LinkButton href="/cursos" size="lg">
                  Escolher meu curso
                </LinkButton>
                {whatsapp ? (
                  <ExternalButton href={whatsapp} size="lg" variant="secondary">
                    <WhatsappIcon className="size-4" /> Tirar dúvidas
                  </ExternalButton>
                ) : null}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
