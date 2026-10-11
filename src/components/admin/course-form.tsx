"use client";

import { useState } from "react";
import type { Course } from "@/db/schema";
import { COURSE_FORMATS, COURSE_LEVELS, CURRENCIES } from "@/lib/constants";
import { centsToInput, FORMAT_LABELS, LEVEL_LABELS, minutesToHoursInput } from "@/lib/format";
import { slugify } from "@/lib/validation/common";
import { saveCourseAction } from "@/server/actions/admin";
import {
  ActionForm,
  CheckboxField,
  FormSection,
  ImageUrlField,
  ListEditor,
  SelectField,
  TextAreaField,
  TextField,
} from "./form";

type Props = {
  course?: Course | null;
  categories: Array<{ id: string; name: string }>;
  purchaseHosts: string[];
};

export function CourseForm({ course, categories, purchaseHosts }: Props) {
  const [title, setTitle] = useState(course?.title ?? "");
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(course));

  return (
    <ActionForm action={saveCourseAction} submitLabel={course ? "Salvar alterações" : "Criar curso"}>
      {(errors) => (
        <>
          {course ? <input type="hidden" name="id" value={course.id} /> : null}

          <FormSection title="Informações principais">
            <TextField
              name="title"
              label="Título"
              required
              maxLength={140}
              value={title}
              errors={errors.title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
            />
            <TextField
              name="slug"
              label="Endereço (slug)"
              hint={`Aparece na URL: /cursos/${slug || "nome-do-curso"}. Use letras minúsculas, números e hífens.`}
              maxLength={80}
              value={slug}
              errors={errors.slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value.toLowerCase());
              }}
            />
            <TextAreaField
              name="shortDescription"
              label="Descrição curta"
              required
              rows={2}
              maxLength={300}
              hint="Usada nos cards do catálogo e no Google (até 300 caracteres)."
              defaultValue={course?.shortDescription}
              errors={errors.shortDescription}
            />
            <TextAreaField
              name="description"
              label="Descrição completa"
              rows={8}
              hint="Separe parágrafos com uma linha em branco."
              defaultValue={course?.description}
              errors={errors.description}
            />
            <div className="grid gap-5 sm:grid-cols-3">
              <SelectField
                name="categoryId"
                label="Categoria"
                defaultValue={course?.categoryId ?? ""}
                errors={errors.categoryId}
                options={[{ value: "", label: "Sem categoria" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
              />
              <SelectField
                name="level"
                label="Nível"
                defaultValue={course?.level ?? "todos"}
                errors={errors.level}
                options={COURSE_LEVELS.map((level) => ({ value: level, label: LEVEL_LABELS[level] }))}
              />
              <SelectField
                name="format"
                label="Formato"
                defaultValue={course?.format ?? ""}
                errors={errors.format}
                options={[{ value: "", label: "Não informar" }, ...COURSE_FORMATS.map((f) => ({ value: f, label: FORMAT_LABELS[f] }))]}
              />
            </div>
            <TextField
              name="durationHours"
              label="Duração (em horas)"
              hint="Opcional. Ex.: 8 ou 1,5"
              inputMode="decimal"
              defaultValue={minutesToHoursInput(course?.durationMinutes)}
              errors={errors.durationMinutes ?? errors.durationHours}
              className="sm:max-w-xs"
            />
          </FormSection>

          <FormSection title="Capa">
            <ImageUrlField name="coverImageUrl" label="Imagem de capa" defaultValue={course?.coverImageUrl} errors={errors.coverImageUrl} />
            <TextField
              name="coverImageAlt"
              label="Descrição da imagem (acessibilidade)"
              hint="Descreva o que aparece na foto. Ex.: Barbeiro finalizando degradê com navalha."
              defaultValue={course?.coverImageAlt ?? ""}
              errors={errors.coverImageAlt}
            />
          </FormSection>

          <FormSection title="Conteúdo do curso">
            <TextAreaField
              name="targetAudience"
              label="Para quem é"
              rows={3}
              defaultValue={course?.targetAudience ?? ""}
              errors={errors.targetAudience}
            />
            <TextAreaField
              name="learningObjectives"
              label="O que o aluno vai aprender"
              rows={5}
              hint="Um objetivo por linha."
              defaultValue={course?.learningObjectives.join("\n")}
              errors={errors.learningObjectives}
            />
            <ListEditor
              name="curriculum"
              legend="Conteúdo programático"
              description="Organize em módulos. Informe uma aula por linha."
              itemLabel="Módulo"
              addLabel="Adicionar módulo"
              max={40}
              errors={errors}
              initialItems={course?.curriculum ?? []}
              fields={[
                { key: "title", label: "Título do módulo" },
                { key: "lessons", label: "Aulas (uma por linha)", type: "lines" },
              ]}
            />
            <ListEditor
              name="faq"
              legend="Perguntas frequentes do curso"
              itemLabel="Pergunta"
              addLabel="Adicionar pergunta"
              errors={errors}
              initialItems={course?.faq ?? []}
              fields={[
                { key: "question", label: "Pergunta" },
                { key: "answer", label: "Resposta", type: "textarea" },
              ]}
            />
          </FormSection>

          <FormSection
            title="Venda"
            description="Só informe condições confirmadas (parcelamento, certificado, garantia, bônus etc.)."
          >
            <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
              <TextField
                name="price"
                label="Preço"
                hint="Opcional. Ex.: 297,90 — deixe vazio para exibir “Sob consulta”."
                inputMode="decimal"
                defaultValue={centsToInput(course?.priceCents)}
                errors={errors.priceCents ?? errors.price}
              />
              <SelectField
                name="currency"
                label="Moeda"
                defaultValue={course?.currency ?? "BRL"}
                errors={errors.currency}
                options={CURRENCIES.map((currency) => ({ value: currency, label: currency }))}
              />
            </div>
            <TextField
              name="purchaseUrl"
              label="Link de compra"
              inputMode="url"
              placeholder="https://"
              hint={`Opcional. Deve começar com https:// e pertencer a: ${purchaseHosts.join(", ")}. Sem link, o site oferece o WhatsApp.`}
              defaultValue={course?.purchaseUrl ?? ""}
              errors={errors.purchaseUrl}
            />
            <TextAreaField
              name="commercialNotes"
              label="Condições comerciais confirmadas"
              rows={2}
              hint="Exibido abaixo do preço. Ex.: Pagamento à vista ou em até 12x no cartão (taxas da plataforma)."
              defaultValue={course?.commercialNotes ?? ""}
              errors={errors.commercialNotes}
            />
          </FormSection>

          <FormSection title="SEO (opcional)" description="Se vazio, usamos o título e a descrição curta.">
            <TextField name="seoTitle" label="Título para o Google" maxLength={70} defaultValue={course?.seoTitle ?? ""} errors={errors.seoTitle} />
            <TextAreaField
              name="seoDescription"
              label="Descrição para o Google"
              rows={2}
              maxLength={170}
              defaultValue={course?.seoDescription ?? ""}
              errors={errors.seoDescription}
            />
          </FormSection>

          <FormSection title="Publicação">
            <CheckboxField
              name="isPublished"
              label="Publicado"
              hint="Somente cursos publicados aparecem no site."
              defaultChecked={course?.isPublished ?? false}
            />
            <CheckboxField
              name="isFeatured"
              label="Destaque na página inicial"
              defaultChecked={course?.isFeatured ?? false}
            />
            <TextField
              name="sortOrder"
              label="Ordem de exibição"
              type="number"
              hint="Números menores aparecem primeiro."
              defaultValue={String(course?.sortOrder ?? 0)}
              errors={errors.sortOrder}
              className="sm:max-w-40"
            />
          </FormSection>
        </>
      )}
    </ActionForm>
  );
}
