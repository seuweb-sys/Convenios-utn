import { test, expect } from "@playwright/test";
import {
  getRoleCredentials,
  hasRoleFixtures,
  login,
  openConvenioForm,
  type RoleKey,
} from "./helpers/auth";
import {
  expectLockedNonSaClassification,
  expectScopedClassificationLoaded,
  selectOrgUnit,
} from "./helpers/convenio-submission";

const saSecretariatLabel = "SA - Secretaría Académica";
const cytSecretariatLabel = "CYT - Secretaría de Ciencia y Tecnología";
const cytGroupLabel =
  "cinaptic - Centro de Investigación Aplicada en Tecnologías de la Información y Comunicación";

test.describe("Convenio classification scope", () => {
  const globalRoles: RoleKey[] = ["admin", "decano"];

  for (const role of globalRoles) {
    test(`${role} can choose secretariat and career only activates in SA`, async ({ page }) => {
      test.skip(!hasRoleFixtures(role), `Set ${role} e2e credentials to run this test.`);

      await login(page, getRoleCredentials(role)!);
      await openConvenioForm(page, "acuerdo");

      const secretariatSelect = page.locator("select").first();
      const careerSelect = page.locator("select").nth(1);

      await expect(secretariatSelect).toBeEnabled();

      await secretariatSelect.selectOption({ label: cytSecretariatLabel });
      await expect(careerSelect).toBeDisabled();
      await expect(careerSelect).toHaveValue("");

      await secretariatSelect.selectOption({ label: saSecretariatLabel });
      await expect(careerSelect).toBeEnabled();
    });
  }

  test("profesor practice scope stays in SA and loads an allowed career", async ({ page }) => {
    test.skip(!hasRoleFixtures("profesor"), "Set profesor e2e credentials to run this test.");

    await login(page, getRoleCredentials("profesor")!);
    await openConvenioForm(page, "particular");

    await expect(page.locator("select").first()).toBeDisabled();
    await expectScopedClassificationLoaded(page);
  });

  test("director outside SA has locked secretariat and disabled career", async ({ page }) => {
    test.skip(!hasRoleFixtures("director"), "Set director e2e credentials to run this test.");

    await login(page, getRoleCredentials("director")!);
    await openConvenioForm(page, "acuerdo");

    const { secretariatValue } = await expectLockedNonSaClassification(page);
    expect(secretariatValue).not.toBe("");
    const orgUnitOptions = await page.locator("select").nth(2).locator("option").count();
    expect(orgUnitOptions).toBeGreaterThan(1);
  });

  test("miembro outside SA selects an allowed CYT group", async ({ page }) => {
    test.skip(!hasRoleFixtures("miembro"), "Set miembro e2e credentials to run this test.");

    await login(page, getRoleCredentials("miembro")!);
    await openConvenioForm(page, "acuerdo");

    await expectLockedNonSaClassification(page);
    await selectOrgUnit(page, cytGroupLabel);
  });
});
