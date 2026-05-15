import { expect, test } from "@playwright/test";

import { getRoleCredentials, hasRoleFixtures, login } from "./helpers/auth";

const approvedConvenioId = process.env.E2E_ADMIN_DIRECT_EDIT_APPROVED_ID;
const revisionConvenioId = process.env.E2E_ADMIN_DIRECT_EDIT_REVISION_ID;

test.describe("Admin direct edit flow", () => {
  test.skip(!hasRoleFixtures("admin"), "Set admin e2e credentials to run this test suite.");

  test("shows a destructive confirmation before editing an approved convenio", async ({ page }) => {
    test.skip(!approvedConvenioId, "Set E2E_ADMIN_DIRECT_EDIT_APPROVED_ID to run this scenario.");

    await login(page, getRoleCredentials("admin")!);
    await page.goto(`/protected/convenio-detalle/${approvedConvenioId}?mode=correccion&origin=admin-edit`);

    await expect(page.getByText(/resetear un convenio aprobado/i)).toBeVisible();
    await page.getByRole("button", { name: /continuar con la edición/i }).click();
    await expect(page.getByText(/clasificación del convenio/i)).toBeVisible();
  });

  test("reuses the correction form directly for non-approved convenios", async ({ page }) => {
    test.skip(!revisionConvenioId, "Set E2E_ADMIN_DIRECT_EDIT_REVISION_ID to run this scenario.");

    await login(page, getRoleCredentials("admin")!);
    await page.goto(`/protected/convenio-detalle/${revisionConvenioId}?mode=correccion&origin=admin-edit`);

    await expect(page.getByText(/clasificación del convenio/i)).toBeVisible();
    await expect(page.getByText(/resetear un convenio aprobado/i)).not.toBeVisible();
  });
});
