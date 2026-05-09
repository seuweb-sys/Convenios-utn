import { expect, test } from "@playwright/test";

const componentRoute = "/playwright/secretary-convenios-lista";

test.describe("secretary convenio list production components", () => {
  test("hides protected header search while rendering the real list search", async ({ page }) => {
    await page.goto(componentRoute);

    await expect(page.getByRole("banner").getByRole("searchbox")).toHaveCount(0);
    await expect(page.getByRole("searchbox", { name: "Buscar en convenios" })).toBeVisible();
    await expect(page.getByTestId("convenio-list-card")).toHaveCount(10);
    await expect(page.getByText("Página 1 de 2 · 12 convenios")).toBeVisible();
  });

  test("search and pagination drive URL-backed bounded page results", async ({ page }) => {
    await page.goto(`${componentRoute}?page=2`);

    await expect(page.getByText("Página 2 de 2 · 12 convenios")).toBeVisible();
    await expect(page.getByTestId("convenio-list-card")).toHaveCount(2);
    await expect(page.getByText("UTN convenio 11")).toBeVisible();

    await page.getByRole("searchbox", { name: "Buscar en convenios" }).fill("Otro");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page).toHaveURL(/page=1/);
    await expect(page).toHaveURL(/q=Otro/);
    await expect(page.getByTestId("convenio-list-card")).toHaveCount(1);
    await expect(page.getByText("Otro convenio final")).toBeVisible();
    await expect(page.getByRole("button", { name: "Anterior" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
});
