import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryForm } from "@/components/admin/category-forms";
import { InlineAction } from "@/components/admin/inline-action";
import { PageHeader, PanelSkeleton } from "@/components/admin/page-header";
import { FormSection } from "@/components/admin/form";
import { getDb } from "@/db";
import { requireAdmin } from "@/lib/session";
import { deleteCategoryAction } from "@/server/actions/admin";
import { listCategoriesForAdmin } from "@/server/services/content";

export const metadata: Metadata = { title: "Categorias" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Categorias" description="Usadas nos filtros do catálogo. Só aparecem no site categorias com cursos publicados." />
      <Suspense fallback={<PanelSkeleton />}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  const session = await requireAdmin();
  const categories = await listCategoriesForAdmin(getDb());
  return (
    <div className="space-y-8">
      <FormSection title="Nova categoria">
        <CategoryForm />
      </FormSection>

      <section aria-labelledby="lista-categorias">
        <h2 id="lista-categorias" className="mb-3 text-base font-semibold">
          Categorias cadastradas ({categories.length})
        </h2>
        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-admin-line bg-admin-surface p-8 text-center text-admin-mute">
            Nenhuma categoria cadastrada.
          </p>
        ) : (
          <ul className="space-y-3">
            {categories.map((category) => (
              <li key={category.id} className="rounded-2xl border border-admin-line bg-admin-surface">
                <details>
                  <summary className="flex items-center justify-between gap-4 p-5">
                    <span>
                      <span className="font-semibold">{category.name}</span>
                      <span className="ml-2 text-sm text-admin-mute">
                        /{category.slug} · {category.courseCount} {category.courseCount === 1 ? "curso" : "cursos"}
                      </span>
                    </span>
                    <span className="text-sm font-medium text-admin-mute">Editar</span>
                  </summary>
                  <div className="space-y-4 border-t border-admin-line p-5">
                    <CategoryForm category={category} />
                    {session.role === "owner" ? (
                      <div className="flex justify-end">
                        <InlineAction
                          action={deleteCategoryAction}
                          fields={{ id: category.id }}
                          label="Excluir categoria"
                          pendingLabel="Excluindo…"
                          variant="danger"
                          confirmMessage={`Excluir a categoria "${category.name}"? Os cursos vinculados ficarão sem categoria.`}
                        />
                      </div>
                    ) : null}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
