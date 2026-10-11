import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, PanelSkeleton } from "@/components/admin/page-header";
import { BrandSettingsForm } from "@/components/admin/settings-forms";
import { getDb } from "@/db";
import { requireAdmin } from "@/lib/session";
import { DEFAULT_SETTINGS } from "@/lib/site-defaults";
import { getSettingsForAdmin } from "@/server/services/content";

export const metadata: Metadata = { title: "Marca e contato" };

export default function Page() {
  return (
    <>
      <PageHeader title="Marca e contato" description="Nome, logotipo, canais de contato e SEO padrão." />
      <Suspense fallback={<PanelSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await requireAdmin();
  const settings = (await getSettingsForAdmin(getDb())) ?? DEFAULT_SETTINGS;
  return <BrandSettingsForm settings={settings} />;
}
