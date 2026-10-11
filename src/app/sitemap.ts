import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { getPublishedCourses } from "@/server/data/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const courses = await getPublishedCourses();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/cursos`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/sobre`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contato`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacidade`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/termos`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/cookies`, changeFrequency: "yearly", priority: 0.1 },
  ];
  return [
    ...staticPages,
    ...courses.map((course) => ({
      url: `${base}/cursos/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
