import type { SiteSettings } from "@/db/schema";

/**
 * Valores usados enquanto o proprietário não configura o site no painel.
 * São textos neutros: não afirmam números, prêmios ou resultados.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  brandName: "LeCurso",
  tagline: "Barbearia, técnica e ensino",
  description:
    "Cursos de barbearia com foco em técnica, precisão e acabamento — do fundamento à execução profissional.",
  logoUrl: null,
  heroTitle: null,
  heroSubtitle: null,
  heroImageUrl: null,
  heroImageAlt: null,
  instructorName: null,
  instructorRole: null,
  instructorSummary: null,
  instructorPhotoUrl: null,
  about: { specialties: [], certifications: [], photos: [] },
  methodItems: [],
  gallery: [],
  faq: [],
  whatsappNumber: null,
  whatsappMessage: null,
  instagramUrl: null,
  email: null,
  socialLinks: [],
  city: null,
  seoTitle: null,
  seoDescription: null,
  ogImageUrl: null,
  legal: {},
  updatedAt: new Date(0),
};

export const DEFAULT_HERO_TITLE = "A técnica por trás de cada *corte*.";
export const DEFAULT_HERO_SUBTITLE =
  "Aprenda barbearia com método: fundamentos sólidos, degradê, acabamento e a precisão que diferencia o trabalho profissional.";
