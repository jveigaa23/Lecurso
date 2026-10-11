import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getSiteSettings } from "@/server/data/public";

export const metadata: Metadata = {
  title: "Política de cookies",
  alternates: { canonical: "/cookies" },
};

export default async function CookiesPage() {
  const settings = await getSiteSettings();
  return (
    <LegalPage title="Política de cookies" settings={settings}>
      <section>
        <h2>Cookies utilizados</h2>
        <p>
          As páginas públicas deste site não utilizam cookies de publicidade, rastreamento ou análise de terceiros.
        </p>
        <ul>
          <li>
            <strong className="text-paper">Cookies de sessão administrativa</strong> — necessários para manter o
            login de usuários autorizados no painel. São do tipo HttpOnly e não são definidos para visitantes.
          </li>
        </ul>
      </section>
      <section>
        <h2>Serviços externos</h2>
        <p>
          Plataformas de pagamento, WhatsApp e Instagram, acessados a partir de links deste site, podem utilizar
          cookies próprios conforme as políticas de cada serviço.
        </p>
      </section>
    </LegalPage>
  );
}
