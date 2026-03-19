import { test, expect } from "@playwright/test";

const hasAuthFixtures =
  !!process.env.E2E_EMAIL &&
  !!process.env.E2E_PASSWORD;

test.describe("Convenios scope flows", () => {
  test.skip(!hasAuthFixtures, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated e2e flows.");

  test("profesor sees scoped panel and can open list", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Correo electrónico").fill(process.env.E2E_EMAIL!);
    await page.getByLabel("Contraseña").fill(process.env.E2E_PASSWORD!);
    await page.getByRole("button", { name: /iniciar sesión|iniciar sesion/i }).click();

    await page.waitForURL(/\/protected/);
    await page.goto("/protected/convenios-lista");
    await expect(page.getByText(/convenios/i).first()).toBeVisible();
  });
});
