import { expect, test } from "@playwright/test";

test("menu móvel abre, navega e fecha", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Abrir menu" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  const menu = page.getByRole("navigation", { name: "Menu móvel" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Sobre" }).click();
  await expect(page).toHaveURL(/\/sobre$/);
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Abrir menu" })).toBeVisible();
});

test("barra de compra fixa no celular", async ({ page }) => {
  await page.goto("/cursos/degrade-do-zero");
  await page.mouse.wheel(0, 2000);
  await expect(page.getByTestId("purchase-link").last()).toBeInViewport();
});

test("alvos de toque principais têm ao menos 44px", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Abrir menu", "Conhecer os cursos"]) {
    const box = await page.getByRole(name === "Abrir menu" ? "button" : "link", { name }).first().boundingBox();
    expect(box!.height, name).toBeGreaterThanOrEqual(44);
  }
});
