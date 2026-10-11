import type { Metadata } from "next";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { Emphasis } from "@/components/site/emphasis";
import { Container } from "@/components/ui/container";
import { InstagramIcon, WhatsappIcon } from "@/components/ui/icons";
import { formatWhatsapp, whatsappLink } from "@/lib/format";
import { getSiteSettings } from "@/server/data/public";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale diretamente pelo WhatsApp, Instagram ou e-mail.",
  alternates: { canonical: "/contato" },
};

function instagramHandle(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/\//g, "");
    return path ? `@${path}` : "Instagram";
  } catch {
    return "Instagram";
  }
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const whatsapp = whatsappLink(settings.whatsappNumber, settings.whatsappMessage);

  const channels = [
    whatsapp && settings.whatsappNumber
      ? {
          href: whatsapp,
          label: "WhatsApp",
          value: formatWhatsapp(settings.whatsappNumber),
          hint: "Resposta mais rápida",
          icon: <WhatsappIcon className="size-6" />,
          external: true,
        }
      : null,
    settings.instagramUrl
      ? {
          href: settings.instagramUrl,
          label: "Instagram",
          value: instagramHandle(settings.instagramUrl),
          hint: "Trabalhos e novidades",
          icon: <InstagramIcon className="size-6" />,
          external: true,
        }
      : null,
    settings.email
      ? {
          href: `mailto:${settings.email}`,
          label: "E-mail",
          value: settings.email,
          hint: "Parcerias e assuntos comerciais",
          icon: <Mail className="size-6" aria-hidden />,
          external: false,
        }
      : null,
    ...settings.socialLinks.map((link) => ({
      href: link.url,
      label: link.label,
      value: link.url.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, ""),
      hint: null,
      icon: <ArrowUpRight className="size-6" aria-hidden />,
      external: true,
    })),
  ].filter((channel) => channel !== null);

  return (
    <Container className="pb-20 pt-12 sm:pt-16 lg:pb-28 lg:pt-20">
      <p className="eyebrow">Contato</p>
      <h1 className="display mt-5 max-w-4xl text-6xl text-paper sm:text-7xl lg:text-8xl">
        Vamos <Emphasis text="*conversar*" />.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-soft">
        Dúvidas sobre cursos, turmas ou parcerias? Escolha o canal de sua preferência.
      </p>

      {channels.length ? (
        <ul className="mt-14 grid gap-4 md:grid-cols-2">
          {channels.map((channel) => (
            <li key={channel.href}>
              <a
                href={channel.href}
                {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex h-full items-center gap-5 rounded-3xl border border-line bg-graphite p-6 transition-colors hover:border-gold sm:p-8"
              >
                <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-gold">
                  {channel.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-mute">{channel.label}</span>
                  <span className="mt-1 block truncate text-lg font-semibold text-paper">{channel.value}</span>
                  {channel.hint ? <span className="mt-1 block text-sm text-soft">{channel.hint}</span> : null}
                </span>
                <ArrowUpRight
                  className="size-5 shrink-0 text-mute transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold"
                  aria-hidden
                />
                {channel.external ? <span className="sr-only">(abre em nova aba)</span> : null}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-14 rounded-3xl border border-dashed border-line-strong p-8 text-soft">
          Os canais de contato serão publicados em breve.
        </p>
      )}

      {settings.city ? (
        <p className="mt-10 inline-flex items-center gap-2 text-soft">
          <MapPin className="size-4 text-gold" aria-hidden /> {settings.city}
        </p>
      ) : null}
    </Container>
  );
}
