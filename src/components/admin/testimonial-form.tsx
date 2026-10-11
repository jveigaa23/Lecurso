"use client";

import { saveTestimonialAction } from "@/server/actions/admin";
import { ActionForm, CheckboxField, SelectField, TextAreaField, TextField } from "./form";

type Testimonial = {
  id: string;
  authorName: string;
  authorDetail: string | null;
  content: string;
  courseId: string | null;
  consentConfirmed: boolean;
  isPublished: boolean;
  sortOrder: number;
};

export function TestimonialForm({
  testimonial,
  courses,
}: {
  testimonial?: Testimonial;
  courses: Array<{ id: string; title: string }>;
}) {
  return (
    <ActionForm
      action={saveTestimonialAction}
      submitLabel={testimonial ? "Salvar" : "Cadastrar depoimento"}
      resetOnSuccess={!testimonial}
    >
      {(errors) => (
        <>
          {testimonial ? <input type="hidden" name="id" value={testimonial.id} /> : null}
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="authorName" label="Nome do autor" required maxLength={100} defaultValue={testimonial?.authorName} errors={errors.authorName} />
            <TextField
              name="authorDetail"
              label="Complemento"
              hint="Opcional. Ex.: Barbeiro em Campinas"
              maxLength={120}
              defaultValue={testimonial?.authorDetail ?? ""}
              errors={errors.authorDetail}
            />
          </div>
          <TextAreaField
            name="content"
            label="Depoimento"
            required
            rows={4}
            maxLength={1500}
            hint="Transcreva o texto exatamente como o aluno escreveu/autorizou."
            defaultValue={testimonial?.content}
            errors={errors.content}
          />
          <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
            <SelectField
              name="courseId"
              label="Curso relacionado"
              defaultValue={testimonial?.courseId ?? ""}
              errors={errors.courseId}
              options={[{ value: "", label: "Nenhum" }, ...courses.map((c) => ({ value: c.id, label: c.title }))]}
            />
            <TextField name="sortOrder" label="Ordem" type="number" defaultValue={String(testimonial?.sortOrder ?? 0)} errors={errors.sortOrder} />
          </div>
          <CheckboxField
            name="consentConfirmed"
            label="Tenho autorização do autor para publicar este depoimento"
            hint="Obrigatório para publicar. Guarde o registro da autorização (mensagem, e-mail etc.)."
            defaultChecked={testimonial?.consentConfirmed}
            errors={errors.consentConfirmed}
          />
          <CheckboxField name="isPublished" label="Publicado no site" defaultChecked={testimonial?.isPublished} />
        </>
      )}
    </ActionForm>
  );
}
