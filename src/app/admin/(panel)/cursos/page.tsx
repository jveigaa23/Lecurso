import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CircleAlert, Plus } from "lucide-react";
import { InlineAction } from "@/components/admin/inline-action";
import { PageHeader, PanelSkeleton, StatusBadge } from "@/components/admin/page-header";
import { buttonClasses } from "@/components/ui/button";
import { getDb } from "@/db";
import { formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { toggleCoursePublishedAction } from "@/server/actions/admin";
import { listCoursesForAdmin } from "@/server/services/content";

export const metadata: Metadata = { title: "Cursos" };

export default function AdminCoursesPage({ searchParams }: PageProps<"/admin/cursos">) {
  return (
    <>
      <PageHeader
        title="Cursos"
        description="Crie, edite e publique os cursos exibidos no site."
        actions={
          <Link href="/admin/cursos/novo" className={buttonClasses({ variant: "admin" })}>
            <Plus className="size-4" aria-hidden /> Novo curso
          </Link>
        }
      />
      <Suspense fallback={<PanelSkeleton />}>
        <CourseList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function CourseList({ searchParams }: Pick<PageProps<"/admin/cursos">, "searchParams">) {
  await requireAdmin();
  const [courses, params] = await Promise.all([listCoursesForAdmin(getDb()), searchParams]);

  return (
    <>
      {params.excluido ? (
        <p role="status" className="mb-6 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-[#1d6b49]">
          Curso excluído.
        </p>
      ) : null}
      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-admin-line bg-admin-surface p-10 text-center">
          <p className="text-lg font-semibold">Nenhum curso cadastrado</p>
          <p className="mt-1 text-admin-mute">Comece criando o primeiro curso.</p>
          <Link href="/admin/cursos/novo" className={buttonClasses({ variant: "admin", className: "mt-6" })}>
            Criar curso
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-admin-line overflow-hidden rounded-2xl border border-admin-line bg-admin-surface">
          {courses.map((course) => (
            <li key={course.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge published={course.isPublished} />
                  {course.isFeatured ? (
                    <span className="rounded-full bg-[#fdf6e3] px-2.5 py-1 text-xs font-medium text-[#6b5214]">Destaque</span>
                  ) : null}
                  {course.isPublished && !course.purchaseUrl ? (
                    <span className="inline-flex items-center gap-1 text-xs text-admin-mute">
                      <CircleAlert className="size-3.5" aria-hidden /> Sem link de compra
                    </span>
                  ) : null}
                </div>
                <Link href={`/admin/cursos/${course.id}`} className="mt-2 block truncate text-base font-semibold hover:underline">
                  {course.title}
                </Link>
                <p className="mt-0.5 truncate text-sm text-admin-mute">
                  {[course.categoryName ?? "Sem categoria", formatPrice(course.priceCents, course.currency) ?? "Sem preço"].join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-start gap-2">
                <InlineAction
                  action={toggleCoursePublishedAction}
                  fields={{ id: course.id, publish: String(!course.isPublished) }}
                  label={course.isPublished ? "Despublicar" : "Publicar"}
                  pendingLabel={course.isPublished ? "Despublicando…" : "Publicando…"}
                />
                <Link href={`/admin/cursos/${course.id}`} className={buttonClasses({ variant: "admin", size: "sm" })}>
                  Editar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
