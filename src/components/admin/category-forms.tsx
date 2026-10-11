"use client";

import { saveCategoryAction } from "@/server/actions/admin";
import { ActionForm, TextField } from "./form";

type Category = { id: string; name: string; slug: string; sortOrder: number };

export function CategoryForm({ category }: { category?: Category }) {
  return (
    <ActionForm
      action={saveCategoryAction}
      submitLabel={category ? "Salvar" : "Criar categoria"}
      resetOnSuccess={!category}
      className="space-y-4"
    >
      {(errors) => (
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_8rem]">
          {category ? <input type="hidden" name="id" value={category.id} /> : null}
          <TextField name="name" label="Nome" required maxLength={60} defaultValue={category?.name} errors={errors.name} />
          <TextField
            name="slug"
            label="Slug"
            hint="Opcional; gerado a partir do nome."
            maxLength={80}
            defaultValue={category?.slug}
            errors={errors.slug}
          />
          <TextField name="sortOrder" label="Ordem" type="number" defaultValue={String(category?.sortOrder ?? 0)} errors={errors.sortOrder} />
        </div>
      )}
    </ActionForm>
  );
}
