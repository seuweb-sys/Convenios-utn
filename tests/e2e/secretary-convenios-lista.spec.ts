import { expect, test, type Page } from "@playwright/test";

import { buildConveniosListaHref } from "@/app/protected/convenios-lista/navigation";

const convenioTitles = Array.from({ length: 12 }, (_, index) =>
  index < 11 ? `UTN convenio ${index + 1}` : "Otro convenio"
);

async function loadSecretaryListHarness(page: Page) {
  await page.route("**/__secretary-list-harness", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `
        <!doctype html>
        <html lang="es">
        <body>
    <header>
      <a href="/protected">Convenios UTN</a>
    </header>
    <main>
      <form aria-label="Búsqueda de convenios" onsubmit="event.preventDefault()">
        <label>
          Buscar en convenios
          <input aria-label="Buscar en convenios" placeholder="Buscar convenios..." type="search" />
        </label>
        <button type="submit">Buscar</button>
      </form>
      <section aria-label="Resultados">
        ${convenioTitles
          .filter((title) => title.includes("UTN"))
          .slice(0, 10)
          .map((title) => `<article data-testid="convenio-list-card">${title}</article>`)
          .join("")}
      </section>
    </main>
        </body>
        </html>
      `,
    });
  });
  await page.goto("/__secretary-list-harness");
}

test.describe("secretary convenio list browser contract", () => {
  test("hides protected top search and keeps the page-specific search", async ({ page }) => {
    await loadSecretaryListHarness(page);

    await expect(page.getByRole("banner").getByRole("searchbox")).toHaveCount(0);
    await expect(page.getByRole("searchbox", { name: "Buscar en convenios" })).toBeVisible();
    await expect(page.getByPlaceholder("Buscar convenios...")).toHaveCount(1);
  });

  test("search resets to page 1 and bounded results show at most 10 cards", async ({ page }) => {
    await loadSecretaryListHarness(page);

    const nextHref = buildConveniosListaHref({
      pathname: "/protected/convenios-lista",
      currentSearch: "page=2",
      updates: { q: "UTN" },
    });

    await page.getByRole("searchbox", { name: "Buscar en convenios" }).fill("UTN");
    await page.getByRole("button", { name: "Buscar" }).click();
    await page.evaluate((href) => window.history.pushState({}, "", href), nextHref);

    await expect(page).toHaveURL(/page=1/);
    await expect(page).toHaveURL(/q=UTN/);
    await expect(page.locator("[data-testid='convenio-list-card']")).toHaveCount(10);
    await expect(page.locator("[data-testid='convenio-list-card']").first()).toContainText("UTN convenio 1");
    await expect(page.locator("[data-testid='convenio-list-card']").last()).toContainText("UTN convenio 10");
  });
});
