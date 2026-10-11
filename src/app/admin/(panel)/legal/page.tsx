import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, PanelSkeleton } from "@/components/admin/page-header";
import { LegalSettingsForm } from "@/components/admin/settings-forms";
import { getDb } from "@/db";
import { requireAdmin } from "@/lib/session";
import { DEFAULT_SETTINGS } from "@/lib/site-defaults";
import { getSettingsForAdmin } from "@/server/services/content";

export const metadata: Metadata = { title: "Dados legais" };

export default function Page() {
  return (
    <>
      <PageHeader title="Dados legais" description="Informações do responsável exibidas nas páginas legais." />
      <Suspense fallback={<PanelSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await requireAdmin();
  const settings = (await getSettingsForAdmin(getDb())) ?? DEFAULT_SETTINGS;
  return <LegalSettingsForm settings={settings} />;
}
