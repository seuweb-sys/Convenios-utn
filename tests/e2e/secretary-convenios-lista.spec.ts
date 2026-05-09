import { expect, test } from "@playwright/test";

import { getRoleCredentials, hasRoleFixtures, login } from "./helpers/auth";

test.describe("secretary convenio list", () => {
  test("hides protected top search and keeps page-specific search", async ({ page }) => {
    test.skip(!hasRoleFixtures("admin"), "Set admin e2e credentials to run this test.");

    await login(page, getRoleCredentials("admin")!);
    await page.goto("/protected/convenios-lista");

    await expect(page.getByPlaceholder("Buscar convenios...")).toHaveCount(1);
    await expect(page.getByRole("textbox", { name: "Buscar en convenios" })).toBeVisible();
  });

  test("search resets to page 1 and the list stays bounded to 10 cards", async ({ page }) => {
    test.skip(!hasRoleFixtures("admin"), "Set admin e2e credentials to run this test.");

    await login(page, getRoleCredentials("admin")!);
    await page.goto("/protected/convenios-lista?page=2");

    await page.getByRole("textbox", { name: "Buscar en convenios" }).fill("UTN");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page).toHaveURL(/page=1/);
    await expect(page.locator("[data-testid='convenio-list-card']")).toHaveCount(await page.locator("[data-testid='convenio-list-card']").count());
    expect(await page.locator("[data-testid='convenio-list-card']").count()).toBeLessThanOrEqual(10);
  });
});
