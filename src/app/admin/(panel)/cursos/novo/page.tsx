import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { CourseForm } from "@/components/admin/course-form";
import { PageHeader, PanelSkeleton } from "@/components/admin/page-header";
import { getDb } from "@/db";
import { getPurchaseAllowedHosts } from "@/lib/env";
import { requireAdmin } from "@/lib/session";
import { listCategoriesForAdmin } from "@/server/services/content";

export const metadata: Metadata = { title: "Novo curso" };

export default function NewCoursePage() {
  return (
    <>
      <Link href="/admin/cursos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-admin-mute hover:text-admin-text">
        <ArrowLeft className="size-4" aria-hidden /> Cursos
      </Link>
      <PageHeader title="Novo curso" description="Campos com * são obrigatórios. O curso pode ser salvo como rascunho." />
      <Suspense fallback={<PanelSkeleton />}>
        <NewCourse />
      </Suspense>
    </>
  );
}

async function NewCourse() {
  await requireAdmin();
  const categories = await listCategoriesForAdmin(getDb());
  return <CourseForm categories={categories} purchaseHosts={getPurchaseAllowedHosts()} />;
}
