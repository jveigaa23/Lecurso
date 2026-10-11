import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("site público", () => {
  test("home apresenta proposta, cursos reais e navegação", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("A técnica por trás de cada");
    await expect(page.getByRole("heading", { name: "Degradê do zero" })).toBeVisible();
    await expect(page.getByText("Curso em rascunho")).toHaveCount(0);
    await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Cursos", exact: true }).click();
    await expect(page).toHaveURL(/\/cursos$/);
    await expect(page.getByText("3 cursos encontrados")).toBeVisible();
  });

  test("busca, filtro por categoria e ordenação no catálogo", async ({ page }) => {
    await page.goto("/cursos");
    await page.getByRole("searchbox", { name: "Buscar cursos" }).fill("degrade");
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page).toHaveURL(/q=degrade/);
    await expect(page.getByText("1 curso encontrado")).toBeVisible();

    await page.goto("/cursos?q=nada-existe");
    await expect(page.getByText("Nenhum curso corresponde à sua busca.")).toBeVisible();
    await page.getByRole("link", { name: "Limpar filtros" }).click();
    await expect(page.getByText("3 cursos encontrados")).toBeVisible();

    await page.getByRole("navigation", { name: "Categorias" }).getByRole("link", { name: "Barba" }).click();
    await expect(page.getByText("1 curso encontrado")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Barba completa" })).toBeVisible();

    await page.goto("/cursos");
    await page.getByRole("combobox", { name: "Ordenar por" }).selectOption("menor-preco");
    await expect(page).toHaveURL(/ordem=menor-preco/);
    await expect(page.locator("main article h2")).toHaveText(["Acabamento e navalha", "Degradê do zero", "Barba completa"]);
  });

  test("detalhes do curso com link de compra seguro e dados estruturados", async ({ page }) => {
    await page.goto("/cursos/degrade-do-zero");
    await expect(page.getByRole("heading", { level: 1, name: "Degradê do zero" })).toBeVisible();
    await expect(page.getByText("R$ 297,90").first()).toBeVisible();
    const buy = page.getByTestId("purchase-link").first();
    await expect(buy).toHaveAttribute("href", "https://pay.hotmart.com/EXEMPLO123");
    await expect(buy).toHaveAttribute("target", "_blank");
    await expect(buy).toHaveAttribute("rel", /noopener/);
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(jsonLd!);
    expect(data[0]).toMatchObject({ "@type": "Course", name: "Degradê do zero" });
    expect(JSON.stringify(data)).not.toMatch(/aggregateRating|review/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/cursos\/degrade-do-zero$/);
  });

  test("sem link de compra, oferece WhatsApp com mensagem do curso", async ({ page }) => {
    await page.goto("/cursos/acabamento-e-navalha");
    await expect(page.getByTestId("purchase-link")).toHaveCount(0);
    const whatsapp = page.getByTestId("whatsapp-cta").first();
    await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/5511900000000\?text=.*Acabamento/);
  });

  test("curso em rascunho e endereço inexistente exibem 404", async ({ page }) => {
    for (const path of ["/cursos/curso-em-rascunho", "/cursos/nao-existe", "/pagina-qualquer"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    }
  });

  test("sitemap e robots", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/cursos/degrade-do-zero");
    expect(sitemap).not.toContain("curso-em-rascunho");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
  });

  test("cabeçalhos de segurança", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  for (const path of ["/", "/cursos", "/cursos/degrade-do-zero", "/sobre", "/contato", "/privacidade", "/admin/login"]) {
    test(`acessibilidade (axe) sem violações graves: ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("sem rolagem horizontal nas larguras de referência", async ({ page }) => {
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/", "/cursos", "/cursos/degrade-do-zero", "/sobre", "/contato", "/admin/login"]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${path} @ ${width}px`).toBeLessThanOrEqual(0);
      }
    }
  });

  test("navegação por teclado alcança o link de pular conteúdo e o menu", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Página inicial" })).toBeFocused();
  });
});
