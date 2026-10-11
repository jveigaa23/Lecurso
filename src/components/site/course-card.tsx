import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { SiteImage } from "@/components/ui/site-image";
import { formatDuration, formatPrice, LEVEL_LABELS } from "@/lib/format";
import type { PublicCourse } from "@/server/data/public";
import { cn } from "@/lib/cn";

export function CourseCard({
  course,
  priority = false,
  headingLevel = "h3",
}: {
  course: PublicCourse;
  priority?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const price = formatPrice(course.priceCents, course.currency);
  const duration = formatDuration(course.durationMinutes);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-graphite transition-[border-color,transform] duration-300 ease-out hover:-translate-y-1 hover:border-line-strong">
      <div className="relative aspect-[4/3] overflow-hidden bg-graphite-2">
        {course.coverImageUrl ? (
          <SiteImage
            src={course.coverImageUrl}
            alt={course.coverImageAlt ?? ""}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div aria-hidden className="hairline-grid flex h-full items-end p-6">
            <span className="display line-clamp-2 text-5xl text-paper/15">{course.title}</span>
          </div>
        )}
        {course.categoryName ? (
          <span className="absolute left-4 top-4 rounded-full bg-ink/80 px-3 py-1 text-xs font-medium text-paper backdrop-blur">
            {course.categoryName}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium uppercase tracking-[0.14em] text-mute">
          <span>{LEVEL_LABELS[course.level]}</span>
          {duration ? (
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
              <Clock className="size-3.5" aria-hidden />
              {duration}
            </span>
          ) : null}
        </div>
        <Heading className="mt-3 text-xl font-semibold leading-snug tracking-tight text-paper">
          <Link href={`/cursos/${course.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {course.title}
          </Link>
        </Heading>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-soft">{course.shortDescription}</p>

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <p className={cn("text-lg font-semibold", price ? "text-paper" : "text-sm font-medium text-mute")}>
            {price ?? "Consulte condições"}
          </p>
          <span
            aria-hidden
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-paper transition-colors duration-300 group-hover:border-gold group-hover:bg-gold group-hover:text-ink"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
