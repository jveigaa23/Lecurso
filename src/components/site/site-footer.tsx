import Link from "next/link";
import { Mail } from "lucide-react";
import { InstagramIcon, WhatsappIcon } from "@/components/ui/icons";
import { Container } from "@/components/ui/container";
import type { SiteSettings } from "@/db/schema";
import { whatsappLink } from "@/lib/format";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const whatsapp = whatsappLink(settings.whatsappNumber, settings.whatsappMessage);

  return (
    <footer className="border-t border-line bg-ink-2">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="display text-3xl text-paper">{settings.brandName}</p>
          {settings.description ? <p className="mt-4 text-sm leading-relaxed text-mute">{settings.description}</p> : null}
          <div className="mt-6 flex gap-2">
            {settings.instagramUrl ? (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram (abre em nova aba)"
                className="inline-flex size-11 items-center justify-center rounded-full border border-line text-soft transition-colors hover:border-gold hover:text-gold"
              >
                <InstagramIcon className="size-5" />
              </a>
            ) : null}
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp (abre em nova aba)"
                className="inline-flex size-11 items-center justify-center rounded-full border border-line text-soft transition-colors hover:border-gold hover:text-gold"
              >
                <WhatsappIcon className="size-5" />
              </a>
            ) : null}
            {settings.email ? (
              <a
                href={`mailto:${settings.email}`}
                aria-label={`Enviar e-mail para ${settings.email}`}
                className="inline-flex size-11 items-center justify-center rounded-full border border-line text-soft transition-colors hover:border-gold hover:text-gold"
              >
                <Mail className="size-5" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>

        <nav aria-label="Rodapé">
          <p className="eyebrow mb-4 text-mute">Navegação</p>
          <ul className="space-y-1 text-sm">
            {[
              ["/cursos", "Cursos"],
              ["/sobre", "Sobre"],
              ["/contato", "Contato"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href!} className="inline-block py-1.5 text-soft transition-colors hover:text-paper">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Informações legais">
          <p className="eyebrow mb-4 text-mute">Legal</p>
          <ul className="space-y-1 text-sm">
            {[
              ["/privacidade", "Política de privacidade"],
              ["/termos", "Termos de uso"],
              ["/cookies", "Política de cookies"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href!} className="inline-block py-1.5 text-soft transition-colors hover:text-paper">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <Container className="flex flex-col gap-2 border-t border-line py-6 text-xs text-mute sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {settings.brandName}
          {settings.legal.responsibleName ? ` · ${settings.legal.responsibleName}` : ""}
          {settings.legal.document ? ` · ${settings.legal.document}` : ""}
        </p>
        {settings.city ? <p>{settings.city}</p> : null}
      </Container>
    </footer>
  );
}
