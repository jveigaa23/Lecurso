import { Container } from "@/components/ui/container";
import type { SiteSettings } from "@/db/schema";

export function LegalPage({
  title,
  settings,
  children,
}: {
  title: string;
  settings: SiteSettings;
  children: React.ReactNode;
}) {
  const { legal } = settings;
  const contact = legal.contactEmail ?? settings.email;
  return (
    <Container className="pb-24 pt-12 sm:pt-16 lg:pt-20">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Informações legais</p>
        <h1 className="display mt-5 text-5xl text-paper sm:text-6xl">{title}</h1>
        <div className="prose-site mt-12 space-y-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-paper [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
          {children}
          <section>
            <h2>Responsável e contato</h2>
            <p>
              {legal.responsibleName ?? settings.brandName}
              {legal.document ? ` — ${legal.document}` : ""}
              {legal.address ? <><br />{legal.address}</> : null}
            </p>
            {contact ? (
              <p>
                Para dúvidas ou solicitações relacionadas a este documento, escreva para{" "}
                <a className="text-gold underline-offset-4 hover:underline" href={`mailto:${contact}`}>
                  {contact}
                </a>
                .
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </Container>
  );
}
