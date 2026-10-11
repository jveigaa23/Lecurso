import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSection } from "@/components/admin/form";
import { InlineAction } from "@/components/admin/inline-action";
import { PageHeader, PanelSkeleton, StatusBadge } from "@/components/admin/page-header";
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { getDb } from "@/db";
import { requireAdmin } from "@/lib/session";
import { deleteTestimonialAction } from "@/server/actions/admin";
import { listCoursesForAdmin, listTestimonialsForAdmin } from "@/server/services/content";

export const metadata: Metadata = { title: "Depoimentos" };

export default function TestimonialsPage() {
  return (
    <>
      <PageHeader
        title="Depoimentos"
        description="Publique apenas depoimentos reais, com autorização do autor. A seção só aparece no site quando houver depoimentos publicados."
      />
      <Suspense fallback={<PanelSkeleton />}>
        <Testimonials />
      </Suspense>
    </>
  );
}

async function Testimonials() {
  const session = await requireAdmin();
  const db = getDb();
  const [items, courses] = await Promise.all([listTestimonialsForAdmin(db), listCoursesForAdmin(db)]);
  const courseOptions = courses.map((course) => ({ id: course.id, title: course.title }));

  return (
    <div className="space-y-8">
      <FormSection title="Novo depoimento">
        <TestimonialForm courses={courseOptions} />
      </FormSection>

      <section aria-labelledby="lista-depoimentos">
        <h2 id="lista-depoimentos" className="mb-3 text-base font-semibold">
          Depoimentos cadastrados ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-admin-line bg-admin-surface p-8 text-center text-admin-mute">
            Nenhum depoimento cadastrado.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-2xl border border-admin-line bg-admin-surface">
                <details>
                  <summary className="flex items-start justify-between gap-4 p-5">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <StatusBadge published={item.isPublished} />
                        <span className="font-semibold">{item.authorName}</span>
                        {item.courseTitle ? <span className="text-sm text-admin-mute">· {item.courseTitle}</span> : null}
                      </span>
                      <span className="mt-2 line-clamp-2 block text-sm text-admin-mute">{item.content}</span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-admin-mute">Editar</span>
                  </summary>
                  <div className="space-y-4 border-t border-admin-line p-5">
                    <TestimonialForm testimonial={item} courses={courseOptions} />
                    {session.role === "owner" ? (
                      <div className="flex justify-end">
                        <InlineAction
                          action={deleteTestimonialAction}
                          fields={{ id: item.id }}
                          label="Excluir depoimento"
                          pendingLabel="Excluindo…"
                          variant="danger"
                          confirmMessage={`Excluir o depoimento de ${item.authorName}?`}
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
