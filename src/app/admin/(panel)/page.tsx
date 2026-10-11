import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CircleCheck, CircleDashed, Plus } from "lucide-react";
import { PageHeader, PanelSkeleton } from "@/components/admin/page-header";
import { buttonClasses } from "@/components/ui/button";
import { getDb } from "@/db";
import { requireAdmin } from "@/lib/session";
import { getDashboardStats, getSettingsForAdmin } from "@/server/services/content";

export const metadata: Metadata = { title: "Visão geral" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const session = await requireAdmin();
  const db = getDb();
  const [stats, settings] = await Promise.all([getDashboardStats(db), getSettingsForAdmin(db)]);

  const checklist = [
    { done: Boolean(settings?.instructorName), label: "Nome e apresentação do profissional", href: "/admin/perfil" },
    { done: Boolean(settings?.instructorPhotoUrl || settings?.heroImageUrl), label: "Fotografia principal", href: "/admin/pagina-inicial" },
    { done: Boolean(settings?.whatsappNumber || settings?.email), label: "Canal de contato (WhatsApp ou e-mail)", href: "/admin/configuracoes" },
    { done: stats.courses.published > 0, label: "Ao menos um curso publicado", href: "/admin/cursos" },
    { done: stats.courses.withoutPurchase === 0 && stats.courses.published > 0, label: "Links de compra em todos os cursos publicados", href: "/admin/cursos" },
    { done: Boolean(settings?.legal?.responsibleName), label: "Dados do responsável (páginas legais)", href: "/admin/legal" },
  ];
  const pending = checklist.filter((item) => !item.done).length;

  const cards = [
    { label: "Cursos publicados", value: stats.courses.published, href: "/admin/cursos" },
    { label: "Rascunhos", value: stats.courses.drafts, href: "/admin/cursos" },
    { label: "Em destaque", value: stats.courses.featured, href: "/admin/cursos" },
    { label: "Depoimentos publicados", value: stats.testimonials.published, href: "/admin/depoimentos" },
  ];

  return (
    <>
      <PageHeader
        title={`Olá, ${session.name.split(" ")[0]}`}
        description="Gerencie cursos, conteúdos e informações do site."
        actions={
          <Link href="/admin/cursos/novo" className={buttonClasses({ variant: "admin" })}>
            <Plus className="size-4" aria-hidden /> Novo curso
          </Link>
        }
      />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <li key={card.label}>
            <Link
              href={card.href}
              className="block rounded-2xl border border-admin-line bg-admin-surface p-5 transition-colors hover:border-admin-text/30"
            >
              <p className="text-sm text-admin-mute">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{card.value}</p>
            </Link>
          </li>
        ))}
      </ul>

      {stats.courses.withoutPurchase > 0 ? (
        <p className="mt-6 rounded-xl border border-[#e8c97a] bg-[#fdf6e3] px-4 py-3 text-sm text-[#6b5214]">
          {stats.courses.withoutPurchase === 1
            ? "1 curso publicado está sem link de compra"
            : `${stats.courses.withoutPurchase} cursos publicados estão sem link de compra`}
          . Nesses casos, o site oferece contato pelo WhatsApp (se configurado).
        </p>
      ) : null}

      <section className="mt-10 rounded-2xl border border-admin-line bg-admin-surface p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Checklist de publicação</h2>
          <span className="text-sm text-admin-mute">
            {pending === 0 ? "Tudo pronto" : `${pending} ${pending === 1 ? "pendência" : "pendências"}`}
          </span>
        </div>
        <ul className="mt-4 divide-y divide-admin-line">
          {checklist.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="group flex items-center gap-3 py-3 text-sm">
                {item.done ? (
                  <CircleCheck className="size-5 text-success" aria-label="Concluído" />
                ) : (
                  <CircleDashed className="size-5 text-admin-mute" aria-label="Pendente" />
                )}
                <span className={item.done ? "flex-1 text-admin-mute" : "flex-1 font-medium"}>{item.label}</span>
                <ArrowRight className="size-4 text-admin-mute transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
