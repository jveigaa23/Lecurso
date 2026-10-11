import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, email = "dono@e2e.test", password = "SenhaE2E123456") {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test.describe("painel administrativo", () => {
  test("rotas do painel exigem login", async ({ page, request }) => {
    for (const path of ["/admin", "/admin/cursos", "/admin/cursos/novo", "/admin/configuracoes"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/);
    }
    const response = await request.get("/admin", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
  });

  test("senha incorreta mostra mensagem genérica", async ({ page }) => {
    await login(page, "dono@e2e.test", "senha-errada-123");
    await expect(page.getByRole("alert").filter({ hasText: "incorretos" })).toHaveText("E-mail ou senha incorretos.");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("fluxo completo: criar, publicar no site, despublicar e sair", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: /Olá, Dono/ })).toBeVisible();

    await page.getByRole("link", { name: "Novo curso" }).first().click();
    await page.getByRole("textbox", { name: "Título", exact: true }).fill("Curso Criado no E2E");
    await expect(page.getByLabel("Endereço (slug)")).toHaveValue("curso-criado-no-e2e");
    await page.getByLabel("Descrição curta").fill("Curso criado pelo teste automatizado.");
    await page.getByLabel("Preço").fill("abc");
    await page.getByLabel("Link de compra").fill("https://golpe.example.com/pagar");
    await page.getByRole("button", { name: "Criar curso" }).click();

    // Erros de validação do servidor preservam o que foi digitado.
    await expect(page.getByRole("alert").filter({ hasText: "Revise" })).toContainText("Revise os campos destacados.");
    await expect(page.getByText(/Domínio não autorizado/)).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Título", exact: true })).toHaveValue("Curso Criado no E2E");

    await page.getByLabel("Preço").fill("199,90");
    await page.getByLabel("Link de compra").fill("https://pay.kiwify.com.br/e2e");
    await page.getByRole("button", { name: "Adicionar módulo" }).click();
    await page.getByLabel("Título do módulo").fill("Módulo inicial");
    await page.getByLabel("Aulas (uma por linha)").fill("Aula 1\nAula 2");
    await page.getByLabel("Publicado", { exact: true }).check();
    await page.getByRole("button", { name: "Criar curso" }).click();
    await expect(page).toHaveURL(/\/admin\/cursos\/[0-9a-f-]{36}\?criado=1/);
    await expect(page.getByText("Curso criado com sucesso.")).toBeVisible();

    // O site reflete a mudança imediatamente (cache invalidado pela action).
    await page.goto("/cursos/curso-criado-no-e2e");
    await expect(page.getByRole("heading", { level: 1, name: "Curso Criado no E2E" })).toBeVisible();
    await expect(page.getByTestId("purchase-link").first()).toHaveAttribute("href", "https://pay.kiwify.com.br/e2e");
    await expect(page.getByText("Módulo inicial")).toBeVisible();
    await page.goto("/cursos");
    await expect(page.getByText("4 cursos encontrados")).toBeVisible();

    await page.goto("/admin/cursos");
    const row = page.getByRole("listitem").filter({ hasText: "Curso Criado no E2E" });
    await row.getByRole("button", { name: "Despublicar" }).click();
    await expect(row.getByRole("button", { name: "Publicar" })).toBeVisible();

    await page.goto("/cursos");
    await expect(page.getByText("3 cursos encontrados")).toBeVisible();
    await page.goto("/cursos/curso-criado-no-e2e");
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();

    await page.goto("/admin");
    await page.getByRole("button", { name: "Sair" }).first().click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("configurações editadas aparecem no site", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: /Olá/ })).toBeVisible();
    await page.goto("/admin/perfil");
    await page.getByLabel("Nome do profissional").fill("Instrutor E2E");
    await page.getByLabel("Título profissional").fill("Barbeiro e educador");
    await page.getByLabel("Trajetória").fill("Primeiro parágrafo.\n\nSegundo parágrafo.");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("status")).toHaveText("Alterações salvas e publicadas no site.");

    await page.goto("/sobre");
    await expect(page.getByRole("heading", { level: 1, name: "Instrutor E2E" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Trajetória" })).toBeVisible();
    await expect(page.getByText("Segundo parágrafo.")).toBeVisible();
  });

  test("editor não vê a exclusão de cursos", async ({ page }) => {
    await login(page, "editor@e2e.test");
    await expect(page.getByRole("heading", { name: /Olá, Editor/ })).toBeVisible();
    await page.goto("/admin/cursos");
    await page.getByRole("link", { name: "Editar" }).first().click();
    await expect(page.getByRole("textbox", { name: "Título", exact: true })).toBeVisible();
    await expect(page.getByText("Excluir definitivamente")).toHaveCount(0);
  });
});
