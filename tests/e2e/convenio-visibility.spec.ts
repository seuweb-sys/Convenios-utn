import { test, expect, type Page } from "@playwright/test";
import {
  getRoleCredentials,
  hasRoleFixtures,
  login,
  type RoleKey,
} from "./helpers/auth";

async function expectAllConvenioTypesVisible(page: Page) {
  await expect(page.getByText("Crear nuevo convenio")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Convenio Particular de Práctica Supervisada", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Convenio Marco Practica Supervisada/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Convenio Marco", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Convenio Específico", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Acuerdo de Colaboracion/i })).toBeVisible();
}

test.describe("Convenio dashboard visibility", () => {
  test("profesor only sees practice convenio types", async ({ page }) => {
    test.skip(!hasRoleFixtures("profesor"), "Set profesor e2e credentials to run this test.");

    await login(page, getRoleCredentials("profesor")!);
    await expect(page.getByText("Crear nuevo convenio")).toBeVisible();

    await expect(page.getByRole("heading", { name: "Convenio Particular de Práctica Supervisada", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Convenio Marco Practica Supervisada/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Convenio Marco", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Convenio Específico", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Acuerdo de Colaboracion/i })).toHaveCount(0);
  });

  const fullAccessRoles: RoleKey[] = ["admin", "director", "miembro"];

  for (const role of fullAccessRoles) {
    test(`${role} sees all five convenio types`, async ({ page }) => {
      test.skip(!hasRoleFixtures(role), `Set ${role} e2e credentials to run this test.`);

      await login(page, getRoleCredentials(role)!);
      await expectAllConvenioTypesVisible(page);
    });
  }

  test("decano sees the decano scope panel", async ({ page }) => {
    test.skip(!hasRoleFixtures("decano"), "Set decano e2e credentials to run this test.");

    await login(page, getRoleCredentials("decano")!);
    await page.goto("/protected/decano");

    await expect(page.getByText("Vista Decano")).toBeVisible();
    await expect(page.getByText(/solo lectura/i)).toBeVisible();
  });
});
