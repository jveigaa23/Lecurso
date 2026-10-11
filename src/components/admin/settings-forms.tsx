"use client";

import type { SiteSettings } from "@/db/schema";
import {
  saveBrandSettingsAction,
  saveHomeSettingsAction,
  saveLegalSettingsAction,
  saveProfileSettingsAction,
} from "@/server/actions/admin";
import { ActionForm, FormSection, ImageUrlField, ListEditor, TextAreaField, TextField } from "./form";

export function BrandSettingsForm({ settings }: { settings: SiteSettings }) {
  return (
    <ActionForm action={saveBrandSettingsAction}>
      {(errors) => (
        <>
          <FormSection title="Marca" description="Enquanto não houver logotipo, o nome é exibido em tipografia.">
            <TextField name="brandName" label="Nome da marca" required maxLength={60} defaultValue={settings.brandName} errors={errors.brandName} />
            <TextField name="tagline" label="Assinatura curta" hint="Ex.: Barbearia · Técnica · Ensino" maxLength={120} defaultValue={settings.tagline ?? ""} errors={errors.tagline} />
            <TextAreaField name="description" label="Descrição" rows={3} maxLength={400} hint="Exibida no rodapé e usada como descrição padrão." defaultValue={settings.description ?? ""} errors={errors.description} />
            <ImageUrlField name="logoUrl" label="Logotipo" hint="Opcional. Prefira PNG/SVG com fundo transparente e cor clara." defaultValue={settings.logoUrl} errors={errors.logoUrl} />
          </FormSection>

          <FormSection title="Contato e redes">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                name="whatsappNumber"
                label="WhatsApp"
                inputMode="tel"
                hint="Com DDI e DDD. Ex.: 55 11 91234-5678"
                defaultValue={settings.whatsappNumber ?? ""}
                errors={errors.whatsappNumber}
              />
              <TextField name="email" label="E-mail comercial" type="email" defaultValue={settings.email ?? ""} errors={errors.email} />
            </div>
            <TextAreaField
              name="whatsappMessage"
              label="Mensagem inicial do WhatsApp"
              rows={2}
              maxLength={300}
              hint="Texto pré-preenchido quando o visitante clica no botão."
              defaultValue={settings.whatsappMessage ?? ""}
              errors={errors.whatsappMessage}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="instagramUrl" label="Instagram (URL)" inputMode="url" placeholder="https://instagram.com/..." defaultValue={settings.instagramUrl ?? ""} errors={errors.instagramUrl} />
              <TextField name="city" label="Cidade / região" maxLength={80} defaultValue={settings.city ?? ""} errors={errors.city} />
            </div>
            <ListEditor
              name="socialLinks"
              legend="Outras redes"
              itemLabel="Rede"
              addLabel="Adicionar rede"
              max={10}
              errors={errors}
              initialItems={settings.socialLinks}
              fields={[
                { key: "label", label: "Nome", placeholder: "YouTube" },
                { key: "url", label: "URL", placeholder: "https://" },
              ]}
            />
          </FormSection>

          <FormSection title="SEO padrão" description="Usado na página inicial e quando uma página não define o próprio.">
            <TextField name="seoTitle" label="Título" maxLength={70} defaultValue={settings.seoTitle ?? ""} errors={errors.seoTitle} />
            <TextAreaField name="seoDescription" label="Descrição" rows={2} maxLength={170} defaultValue={settings.seoDescription ?? ""} errors={errors.seoDescription} />
            <ImageUrlField name="ogImageUrl" label="Imagem de compartilhamento" hint="1200×630 px recomendado (WhatsApp, Instagram, Facebook)." defaultValue={settings.ogImageUrl} errors={errors.ogImageUrl} />
          </FormSection>
        </>
      )}
    </ActionForm>
  );
}

export function HomeSettingsForm({ settings }: { settings: SiteSettings }) {
  return (
    <ActionForm action={saveHomeSettingsAction}>
      {(errors) => (
        <>
          <FormSection title="Destaque principal (hero)" description="Use *asteriscos* para destacar uma palavra do título em itálico dourado.">
            <TextField
              name="heroTitle"
              label="Título"
              maxLength={120}
              placeholder="A técnica por trás de cada *corte*."
              defaultValue={settings.heroTitle ?? ""}
              errors={errors.heroTitle}
            />
            <TextAreaField name="heroSubtitle" label="Subtítulo" rows={3} maxLength={300} defaultValue={settings.heroSubtitle ?? ""} errors={errors.heroSubtitle} />
            <ImageUrlField name="heroImageUrl" label="Fotografia principal" hint="Retrato vertical (4:5) de boa resolução. Sem foto, exibimos um painel tipográfico." defaultValue={settings.heroImageUrl} errors={errors.heroImageUrl} />
            <TextField name="heroImageAlt" label="Descrição da fotografia" defaultValue={settings.heroImageAlt ?? ""} errors={errors.heroImageAlt} />
          </FormSection>

          <FormSection title="Diferenciais do método" description="Seção “Como o ensino funciona”. Fica oculta se vazia.">
            <ListEditor
              name="methodItems"
              legend="Diferenciais"
              itemLabel="Diferencial"
              addLabel="Adicionar diferencial"
              max={8}
              errors={errors}
              initialItems={settings.methodItems}
              fields={[
                { key: "title", label: "Título" },
                { key: "description", label: "Descrição", type: "textarea" },
              ]}
            />
          </FormSection>

          <FormSection title="Galeria de trabalhos" description="Somente fotos de trabalhos reais. Fica oculta se vazia.">
            <ListEditor
              name="gallery"
              legend="Fotos"
              itemLabel="Foto"
              addLabel="Adicionar foto"
              max={40}
              errors={errors}
              initialItems={settings.gallery}
              fields={[
                { key: "url", label: "URL da imagem", placeholder: "https://" },
                { key: "alt", label: "Descrição da foto", placeholder: "Ex.: Degradê navalhado com acabamento na barba" },
              ]}
            />
          </FormSection>

          <FormSection title="Perguntas frequentes" description="Exibidas na página inicial. Ficam ocultas se vazias.">
            <ListEditor
              name="faq"
              legend="Perguntas"
              itemLabel="Pergunta"
              addLabel="Adicionar pergunta"
              errors={errors}
              initialItems={settings.faq}
              fields={[
                { key: "question", label: "Pergunta" },
                { key: "answer", label: "Resposta", type: "textarea" },
              ]}
            />
          </FormSection>
        </>
      )}
    </ActionForm>
  );
}

export function ProfileSettingsForm({ settings }: { settings: SiteSettings }) {
  const about = settings.about;
  return (
    <ActionForm action={saveProfileSettingsAction}>
      {(errors) => (
        <>
          <FormSection title="Apresentação" description="Exibida na página inicial, na página Sobre e nas páginas dos cursos.">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="instructorName" label="Nome do profissional" maxLength={100} defaultValue={settings.instructorName ?? ""} errors={errors.instructorName} />
              <TextField name="instructorRole" label="Título profissional" hint="Ex.: Barbeiro e educador" maxLength={120} defaultValue={settings.instructorRole ?? ""} errors={errors.instructorRole} />
            </div>
            <TextAreaField name="instructorSummary" label="Resumo" rows={3} maxLength={800} defaultValue={settings.instructorSummary ?? ""} errors={errors.instructorSummary} />
            <ImageUrlField name="instructorPhotoUrl" label="Retrato" defaultValue={settings.instructorPhotoUrl} errors={errors.instructorPhotoUrl} />
          </FormSection>

          <FormSection title="Página Sobre" description="Separe parágrafos com uma linha em branco. Blocos vazios não aparecem.">
            <TextField name="aboutHeadline" label="Frase de abertura" maxLength={160} defaultValue={about.headline ?? ""} errors={errors["about.headline"]} />
            <TextAreaField name="aboutTrajectory" label="Trajetória" rows={6} defaultValue={about.trajectory ?? ""} errors={errors["about.trajectory"]} />
            <TextAreaField name="aboutExperience" label="Experiência" rows={4} defaultValue={about.experience ?? ""} errors={errors["about.experience"]} />
            <TextAreaField name="aboutPhilosophy" label="Filosofia de ensino" rows={4} defaultValue={about.philosophy ?? ""} errors={errors["about.philosophy"]} />
            <TextAreaField
              name="aboutSpecialties"
              label="Especialidades"
              rows={4}
              hint="Uma por linha. Ex.: Degradê, Barba, Acabamento na navalha"
              defaultValue={about.specialties.join("\n")}
              errors={errors["about.specialties"]}
            />
          </FormSection>

          <FormSection title="Formação e certificações" description="Inclua apenas certificações reais e comprováveis.">
            <ListEditor
              name="certifications"
              legend="Certificações"
              itemLabel="Certificação"
              addLabel="Adicionar certificação"
              errors={Object.fromEntries(Object.entries(errors).map(([k, v]) => [k.replace("about.", ""), v]))}
              initialItems={about.certifications}
              fields={[
                { key: "title", label: "Nome" },
                { key: "issuer", label: "Instituição (opcional)" },
                { key: "year", label: "Ano (opcional)", placeholder: "2023" },
              ]}
            />
          </FormSection>

          <FormSection title="Fotografias da página Sobre">
            <ListEditor
              name="aboutPhotos"
              legend="Fotos"
              itemLabel="Foto"
              addLabel="Adicionar foto"
              max={12}
              errors={Object.fromEntries(Object.entries(errors).map(([k, v]) => [k.replace("about.photos", "aboutPhotos"), v]))}
              initialItems={about.photos}
              fields={[
                { key: "url", label: "URL da imagem", placeholder: "https://" },
                { key: "alt", label: "Descrição da foto" },
              ]}
            />
          </FormSection>
        </>
      )}
    </ActionForm>
  );
}

export function LegalSettingsForm({ settings }: { settings: SiteSettings }) {
  const legal = settings.legal;
  return (
    <ActionForm action={saveLegalSettingsAction}>
      {(errors) => (
        <FormSection
          title="Responsável pelo site"
          description="Exibido nas páginas de privacidade, termos e cookies. Recomendamos revisar os textos legais com um profissional."
        >
          <TextField name="responsibleName" label="Nome ou razão social" maxLength={160} defaultValue={legal.responsibleName ?? ""} errors={errors.responsibleName} />
          <TextField name="document" label="CPF/CNPJ (opcional)" maxLength={40} defaultValue={legal.document ?? ""} errors={errors.document} />
          <TextAreaField name="address" label="Endereço (opcional)" rows={2} maxLength={300} defaultValue={legal.address ?? ""} errors={errors.address} />
          <TextField name="contactEmail" label="E-mail para assuntos legais" type="email" hint="Se vazio, usamos o e-mail comercial." defaultValue={legal.contactEmail ?? ""} errors={errors.contactEmail} />
        </FormSection>
      )}
    </ActionForm>
  );
}
