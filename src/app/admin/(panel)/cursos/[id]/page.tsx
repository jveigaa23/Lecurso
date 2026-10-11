import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { z } from "zod";
import { CourseForm } from "@/components/admin/course-form";
import { DangerZone } from "@/components/admin/danger-zone";
import { PageHeader, PanelSkeleton, StatusBadge } from "@/components/admin/page-header";
import { buttonClasses } from "@/components/ui/button";
import { getDb } from "@/db";
import { getPurchaseAllowedHosts } from "@/lib/env";
import { requireAdmin } from "@/lib/session";
import { deleteCourseAction } from "@/server/actions/admin";
import { getCourseForAdmin, listCategoriesForAdmin } from "@/server/services/content";

export const metadata: Metadata = { title: "Editar curso" };

export default function EditCoursePage(props: PageProps<"/admin/cursos/[id]">) {
  return (
    <>
      <Link href="/admin/cursos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-admin-mute hover:text-admin-text">
        <ArrowLeft className="size-4" aria-hidden /> Cursos
      </Link>
      <Suspense fallback={<PanelSkeleton />}>
        <EditCourse {...props} />
      </Suspense>
    </>
  );
}

async function EditCourse({ params, searchParams }: PageProps<"/admin/cursos/[id]">) {
  const session = await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();
  const db = getDb();
  const [course, categories] = await Promise.all([getCourseForAdmin(db, id), listCategoriesForAdmin(db)]);
  if (!course) notFound();

  return (
    <>
      <PageHeader
        title={course.title}
        description={<StatusBadge published={course.isPublished} />}
        actions={
          course.isPublished ? (
            <Link
              href={`/cursos/${course.slug}`}
              target="_blank"
              className={buttonClasses({ variant: "admin-outline", size: "sm" })}
            >
              Ver no site <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          ) : null
        }
      />
      {query.criado ? (
        <p role="status" className="mb-6 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-[#1d6b49]">
          Curso criado com sucesso.
        </p>
      ) : null}
      <CourseForm course={course} categories={categories} purchaseHosts={getPurchaseAllowedHosts()} />
      {session.role === "owner" ? (
        <div className="mt-10">
          <DangerZone
            action={deleteCourseAction}
            id={course.id}
            description="Remove o curso do site e do banco de dados. Esta ação não pode ser desfeita. Para apenas ocultar, use “Despublicar”."
          />
        </div>
      ) : null}
    </>
  );
}
