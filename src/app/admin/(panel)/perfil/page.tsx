import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, PanelSkeleton } from "@/components/admin/page-header";
import { ProfileSettingsForm } from "@/components/admin/settings-forms";
import { getDb } from "@/db";
import { requireAdmin } from "@/lib/session";
import { DEFAULT_SETTINGS } from "@/lib/site-defaults";
import { getSettingsForAdmin } from "@/server/services/content";

export const metadata: Metadata = { title: "Profissional" };

export default function Page() {
  return (
    <>
      <PageHeader title="Profissional" description="Apresentação do instrutor e conteúdo da página Sobre." />
      <Suspense fallback={<PanelSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await requireAdmin();
  const settings = (await getSettingsForAdmin(getDb())) ?? DEFAULT_SETTINGS;
  return <ProfileSettingsForm settings={settings} />;
}
