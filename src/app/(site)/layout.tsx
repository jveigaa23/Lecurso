import type { Metadata } from "next";
import { BrandMark } from "@/components/site/brand-mark";
import { SiteFooter } from "@/components/site/site-footer";
import { Suspense } from "react";
import { SiteHeader, SiteHeaderFallback } from "@/components/site/site-header";
import { getSiteSettings } from "@/server/data/public";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = settings.seoTitle ?? [settings.brandName, settings.tagline].filter(Boolean).join(" — ");
  const description = settings.seoDescription ?? settings.description ?? undefined;
  return {
    title: { default: title, template: `%s · ${settings.brandName}` },
    description,
    applicationName: settings.brandName,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: settings.brandName,
      title,
      description,
      images: settings.ogImageUrl ? [{ url: settings.ogImageUrl }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();
  const brand = <BrandMark name={settings.brandName} logoUrl={settings.logoUrl} />;
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={<SiteHeaderFallback brand={brand} />}>
        <SiteHeader brand={brand} />
      </Suspense>
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
