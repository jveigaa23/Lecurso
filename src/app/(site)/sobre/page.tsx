import type { Metadata } from "next";
import { Award } from "lucide-react";
import { Emphasis } from "@/components/site/emphasis";
import { MonogramPanel } from "@/components/site/monogram-panel";
import { RichText } from "@/components/site/rich-text";
import { LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SiteImage } from "@/components/ui/site-image";
import { getSiteSettings } from "@/server/data/public";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const name = settings.instructorName ?? settings.brandName;
  return {
    title: "Sobre",
    description: settings.instructorSummary ?? `Conheça a trajetória e a filosofia de ensino de ${name}.`,
    alternates: { canonical: "/sobre" },
  };
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const { about } = settings;
  const name = settings.instructorName ?? settings.brandName;
  const blocks = [
    { id: "trajetoria", title: "Trajetória", text: about.trajectory },
    { id: "experiencia", title: "Experiência", text: about.experience },
    { id: "filosofia", title: "Filosofia de ensino", text: about.philosophy },
  ].filter((block) => block.text);

  return (
    <>
      <section className="border-b border-line">
        <Container className="grid items-end gap-10 pb-14 pt-12 sm:pt-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 lg:pb-20 lg:pt-20">
          <div>
            <p className="eyebrow">Sobre</p>
            <h1 className="display mt-5 text-6xl text-paper sm:text-7xl lg:text-8xl">{name}</h1>
            {settings.instructorRole ? <p className="mt-4 text-xl text-gold">{settings.instructorRole}</p> : null}
            {about.headline || settings.instructorSummary ? (
              <p className="mt-8 max-w-2xl text-xl leading-relaxed text-soft">
                {about.headline ?? settings.instructorSummary}
              </p>
            ) : null}
          </div>
          {settings.instructorPhotoUrl ? (
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-line bg-graphite">
              <SiteImage
                src={settings.instructorPhotoUrl}
                alt={`Retrato de ${name}`}
                fill
                priority
                sizes="(min-width: 1024px) 35vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <MonogramPanel name={name} className="aspect-[4/5]" compact />
          )}
        </Container>
      </section>

      {blocks.length ? (
        <Container className="divide-y divide-line py-6">
          {blocks.map((block) => (
            <section key={block.id} aria-labelledby={block.id} className="grid gap-6 py-14 lg:grid-cols-[0.6fr_1.4fr] lg:gap-16">
              <h2 id={block.id} className="display text-4xl text-paper sm:text-5xl">
                {block.title}
              </h2>
              <RichText text={block.text!} className="prose-site max-w-2xl text-lg" />
            </section>
          ))}
        </Container>
      ) : (
        <Container className="py-16">
          <p className="max-w-xl text-soft">A apresentação completa do instrutor será publicada em breve.</p>
        </Container>
      )}

      {about.specialties.length ? (
        <section aria-labelledby="especialidades" className="border-t border-line bg-ink-2">
          <Container className="py-16 lg:py-24">
            <h2 id="especialidades" className="display text-4xl text-paper sm:text-5xl">
              <Emphasis text="*Especialidades*" />
            </h2>
            <ul className="mt-10 flex flex-wrap gap-3">
              {about.specialties.map((item) => (
                <li key={item} className="rounded-full border border-line-strong px-5 py-2.5 text-paper">
                  {item}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {about.certifications.length ? (
        <section aria-labelledby="certificacoes" className="border-t border-line">
          <Container className="py-16 lg:py-24">
            <h2 id="certificacoes" className="display text-4xl text-paper sm:text-5xl">
              Formação e certificações
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-2">
              {about.certifications.map((item) => (
                <li key={`${item.title}-${item.year ?? ""}`} className="flex gap-4 rounded-2xl border border-line bg-graphite p-6">
                  <Award className="size-6 shrink-0 text-gold" aria-hidden />
                  <div>
                    <p className="font-semibold text-paper">{item.title}</p>
                    {item.issuer || item.year ? (
                      <p className="mt-1 text-sm text-mute">{[item.issuer, item.year].filter(Boolean).join(" · ")}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {about.photos.length ? (
        <section aria-label="Fotografias" className="border-t border-line">
          <Container className="py-16 lg:py-24">
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {about.photos.map((photo) => (
                <li key={photo.url} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-graphite">
                  <SiteImage src={photo.url} alt={photo.alt} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      <section className="border-t border-line">
        <Container className="flex flex-col items-start justify-between gap-6 py-16 sm:flex-row sm:items-center">
          <p className="display text-4xl text-paper sm:text-5xl">Pronto para aprender?</p>
          <LinkButton href="/cursos" size="lg">
            Ver cursos
          </LinkButton>
        </Container>
      </section>
    </>
  );
}
