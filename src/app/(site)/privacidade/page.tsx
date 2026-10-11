import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getSiteSettings } from "@/server/data/public";

export const metadata: Metadata = {
  title: "Política de privacidade",
  alternates: { canonical: "/privacidade" },
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  return (
    <LegalPage title="Política de privacidade" settings={settings}>
      <section>
        <h2>Quais dados são tratados</h2>
        <p>
          Este site apresenta cursos e conteúdos informativos. A navegação pública não exige cadastro e o site não
          possui formulários de coleta de dados pessoais.
        </p>
        <ul>
          <li>
            Registros técnicos de acesso (como endereço IP, data e navegador) podem ser mantidos temporariamente pelo
            provedor de hospedagem para segurança e funcionamento do serviço.
          </li>
          <li>Cookies de sessão são usados exclusivamente na área administrativa, por usuários autorizados.</li>
        </ul>
      </section>
      <section>
        <h2>Compras e contato</h2>
        <p>
          Ao clicar em um botão de compra, você é direcionado à plataforma de pagamento parceira, que trata seus dados
          conforme a política própria dela. Ao usar o WhatsApp, Instagram ou e-mail, as informações que você enviar
          seguem as políticas desses serviços e são usadas apenas para responder ao seu contato.
        </p>
      </section>
      <section>
        <h2>Seus direitos</h2>
        <p>
          Você pode solicitar informações, correção ou exclusão de dados pessoais que tenha compartilhado diretamente
          conosco pelos canais de contato abaixo.
        </p>
      </section>
    </LegalPage>
  );
}
