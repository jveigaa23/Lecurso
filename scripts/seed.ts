/**
 * Dados de DEMONSTRAÇÃO para desenvolvimento local e testes E2E.
 * Recusa-se a rodar em bancos remotos: nunca use em produção.
 *
 *   npm run db:seed
 */
import { categories, courses, siteSettings, testimonials } from "../src/db/schema";
import { connect, describeTarget, isLocalUrl } from "./_shared";

async function main() {
  const { url, db, close } = connect();
  if (!isLocalUrl(url) || process.env.NODE_ENV === "production") {
    console.error("✖ O seed de demonstração só pode ser executado em bancos locais.");
    process.exit(1);
  }
  console.log(`→ Banco: ${describeTarget(url)}`);

  await db.delete(testimonials);
  await db.delete(courses);
  await db.delete(categories);

  const [degrade, barba, avancado] = await db
    .insert(categories)
    .values([
      { name: "Degradê", slug: "degrade", sortOrder: 1 },
      { name: "Barba", slug: "barba", sortOrder: 2 },
      { name: "Técnicas avançadas", slug: "tecnicas-avancadas", sortOrder: 3 },
    ])
    .returning();

  const demo = "Conteúdo de demonstração — substitua pelos dados reais no painel.";

  const inserted = await db
    .insert(courses)
    .values([
      {
        title: "Degradê do zero",
        slug: "degrade-do-zero",
        shortDescription: "Fundamentos do degradê: divisão de áreas, escolha de pentes e transições limpas.",
        description: `${demo}\n\nCurso introdutório com foco em fundamentos e segurança na máquina.`,
        categoryId: degrade!.id,
        level: "iniciante",
        format: "online",
        targetAudience: "Iniciantes que querem construir uma base sólida.",
        learningObjectives: ["Dividir a cabeça em áreas de trabalho", "Escolher pentes para cada transição", "Corrigir marcas"],
        curriculum: [
          { title: "Ferramentas e preparação", lessons: ["Máquinas e pentes", "Higienização"] },
          { title: "Primeiras transições", lessons: ["Linha de base", "Esfumado", "Revisão"] },
        ],
        faq: [{ question: "Preciso ter experiência?", answer: "Não. O curso começa pelos fundamentos." }],
        durationMinutes: 480,
        priceCents: 29790,
        purchaseUrl: "https://pay.hotmart.com/EXEMPLO123",
        isFeatured: true,
        isPublished: true,
        sortOrder: 1,
        publishedAt: new Date(),
      },
      {
        title: "Acabamento e navalha",
        slug: "acabamento-e-navalha",
        shortDescription: "Contornos, pezinho e acabamento com navalha para um resultado limpo e duradouro.",
        description: demo,
        categoryId: avancado!.id,
        level: "intermediario",
        format: "presencial",
        learningObjectives: ["Desenhar contornos simétricos", "Usar a navalha com segurança"],
        curriculum: [{ title: "Navalha", lessons: ["Postura", "Ângulos", "Finalização"] }],
        durationMinutes: 240,
        priceCents: 19700,
        isFeatured: true,
        isPublished: true,
        sortOrder: 2,
        publishedAt: new Date(),
      },
      {
        title: "Barba completa",
        slug: "barba-completa",
        shortDescription: "Modelagem, alinhamento e cuidados para barbas de diferentes volumes.",
        description: demo,
        categoryId: barba!.id,
        level: "todos",
        format: "hibrido",
        durationMinutes: 180,
        isPublished: true,
        sortOrder: 3,
        publishedAt: new Date(),
      },
      {
        title: "Curso em rascunho",
        slug: "curso-em-rascunho",
        shortDescription: "Este curso não está publicado e não deve aparecer no site.",
        description: demo,
        level: "avancado",
        isPublished: false,
        sortOrder: 9,
      },
    ])
    .returning({ id: courses.id });

  await db
    .insert(siteSettings)
    .values({ id: 1, brandName: "LeCurso", whatsappNumber: "5511900000000", email: "contato@exemplo.com" })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { whatsappNumber: "5511900000000", email: "contato@exemplo.com" },
    });

  console.log(`✔ Seed concluído: ${inserted.length} cursos (3 publicados, 1 rascunho) e 3 categorias.`);
  await close();
}

main().catch((error) => {
  console.error("✖ Falha no seed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
