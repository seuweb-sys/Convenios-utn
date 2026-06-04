import { expect, test } from "@playwright/test";

const genericUserEmail = process.env.E2E_EMAIL;
const genericUserPassword = process.env.E2E_PASSWORD;

test.describe("Public auth smoke", () => {
  test("sign-in exposes login, registration, and password recovery entrypoints", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page.getByRole("heading", { name: /iniciar sesión|iniciar sesion/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /¿olvidaste tu contraseña\?|olvidaste tu contrasena/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /regístrate|registrate/i })).toBeVisible();
  });

  test("forgot-password page renders the email recovery form", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(page.getByRole("heading", { name: /recuperar contraseña/i })).toBeVisible();
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /enviar link de recuperación|enviar link de recuperacion/i })).toBeVisible();
  });

  test("generic user can sign in when shared E2E credentials are configured", async ({ page }) => {
    test.skip(!(genericUserEmail && genericUserPassword), "Set E2E_EMAIL and E2E_PASSWORD to run generic user auth smoke.");

    await page.goto("/sign-in");
    await page.getByLabel(/correo electrónico/i).fill(genericUserEmail!);
    await page.getByLabel(/contraseña/i).fill(genericUserPassword!);
    await page.getByRole("button", { name: /iniciar sesión|iniciar sesion/i }).click();

    await page.waitForURL(/\/protected(\/|$)/, { timeout: 60_000 });
    await expect(page).toHaveURL(/\/protected(\/|$)/);
  });
});
