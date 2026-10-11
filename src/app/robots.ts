import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  // Ambientes de preview da Vercel não devem ser indexados.
  const isPreview = process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production";
  return {
    rules: isPreview ? [{ userAgent: "*", disallow: "/" }] : [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
