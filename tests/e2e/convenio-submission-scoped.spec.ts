import { test } from "@playwright/test";
import {
  getRoleCredentials,
  hasRoleFixtures,
  login,
  openConvenioForm,
} from "./helpers/auth";
import {
  expectLockedNonSaClassification,
  expectMockedSuccess,
  expectScopedPayload,
  fillAcuerdoForm,
  interceptConvenioSubmission,
  selectOrgUnit,
  submitFinalAction,
} from "./helpers/convenio-submission";

const cytGroupLabel =
  "cinaptic - Centro de Investigación Aplicada en Tecnologías de la Información y Comunicación";

test.describe("Scoped convenio submission", () => {
  test("director submits non-SA convenio with secretariat scope and no career", async ({ page }) => {
    test.skip(!hasRoleFixtures("director"), "Set director e2e credentials to run this test.");

    const capture = await interceptConvenioSubmission(page);

    await login(page, getRoleCredentials("director")!);
    await openConvenioForm(page, "acuerdo");
    const { secretariatValue, careerValue } = await expectLockedNonSaClassification(page);

    await fillAcuerdoForm(page, "mocked-director-acuerdo");
    await submitFinalAction(page, /^Finalizar$/, /Enviar acuerdo/i);

    await expectMockedSuccess(page, "Acuerdo de Colaboración Enviado");
    expectScopedPayload(capture.payload, secretariatValue, careerValue, null);
  });

  test("member submits non-SA convenio within own org unit", async ({ page }) => {
    test.skip(!hasRoleFixtures("miembro"), "Set miembro e2e credentials to run this test.");

    const capture = await interceptConvenioSubmission(page);

    await login(page, getRoleCredentials("miembro")!);
    await openConvenioForm(page, "acuerdo");
    const { secretariatValue, careerValue } = await expectLockedNonSaClassification(page);
    const orgUnitValue = await selectOrgUnit(page, cytGroupLabel);

    await fillAcuerdoForm(page, "mocked-member-acuerdo");
    await submitFinalAction(page, /^Finalizar$/, /Enviar acuerdo/i);

    await expectMockedSuccess(page, "Acuerdo de Colaboración Enviado");
    expectScopedPayload(capture.payload, secretariatValue, careerValue, orgUnitValue);
  });
});
