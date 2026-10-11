import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getSiteSettings } from "@/server/data/public";

export const metadata: Metadata = {
  title: "Termos de uso",
  alternates: { canonical: "/termos" },
};

export default async function TermsPage() {
  const settings = await getSiteSettings();
  return (
    <LegalPage title="Termos de uso" settings={settings}>
      <section>
        <h2>Sobre este site</h2>
        <p>
          Este site divulga os cursos de {settings.brandName}. As informações de cada curso — conteúdo, formato,
          duração e preço — são as publicadas na respectiva página e podem ser atualizadas.
        </p>
      </section>
      <section>
        <h2>Compras</h2>
        <p>
          As compras são realizadas em plataformas de pagamento externas. As condições de pagamento, acesso,
          cancelamento e reembolso são as informadas na página de compra e nos termos da plataforma utilizada.
        </p>
      </section>
      <section>
        <h2>Propriedade intelectual</h2>
        <p>
          Textos, fotografias e materiais deste site pertencem aos seus autores e não podem ser reproduzidos sem
          autorização.
        </p>
      </section>
    </LegalPage>
  );
}
