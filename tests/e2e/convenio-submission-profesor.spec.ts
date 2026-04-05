import { test } from "@playwright/test";
import {
  getRoleCredentials,
  hasRoleFixtures,
  login,
  openConvenioForm,
} from "./helpers/auth";
import {
  expectMockedSuccess,
  expectScopedClassificationLoaded,
  expectScopedPayload,
  fillParticularForm,
  fillPracticaMarcoForm,
  interceptConvenioSubmission,
  submitFinalAction,
} from "./helpers/convenio-submission";

const runRealSubmission =
  process.env.E2E_REAL_SUBMISSION === "true";

test.describe("Profesor convenio submission", () => {
  test.skip(!hasRoleFixtures("profesor"), "Set profesor e2e credentials to run this test suite.");

  test("particular submission sends scope classification in payload", async ({ page }) => {
    const capture = await interceptConvenioSubmission(page);

    await login(page, getRoleCredentials("profesor")!);
    await openConvenioForm(page, "particular");
    const { secretariatValue, careerValue } = await expectScopedClassificationLoaded(page);

    await fillParticularForm(page, "mocked-particular");
    await submitFinalAction(page, /^Finalizar$/, /Enviar convenio/i);

    await expectMockedSuccess(page, "Convenio Particular Enviado");
    expectScopedPayload(capture.payload, secretariatValue, careerValue);
  });

  test("practica marco submission sends scope classification in payload", async ({ page }) => {
    const capture = await interceptConvenioSubmission(page);

    await login(page, getRoleCredentials("profesor")!);
    await openConvenioForm(page, "practica-marco");
    const { secretariatValue, careerValue } = await expectScopedClassificationLoaded(page);

    await fillPracticaMarcoForm(page, "mocked-practica-marco");
    await submitFinalAction(page, /Guardar y Enviar convenio/i, /Sí, enviar/i);

    await expectMockedSuccess(page, "Convenio de Práctica Supervisada Enviado");
    expectScopedPayload(capture.payload, secretariatValue, careerValue);
  });

  test("particular submission succeeds against real backend", async ({ page }) => {
    test.skip(!runRealSubmission, "Set E2E_REAL_SUBMISSION=true to run the real submission flow.");

    await login(page, getRoleCredentials("profesor")!);
    await openConvenioForm(page, "particular");
    await expectScopedClassificationLoaded(page);
    await fillParticularForm(page, `real-${Date.now()}`);
    await submitFinalAction(page, /^Finalizar$/, /Enviar convenio/i);
    await expectMockedSuccess(page, "Convenio Particular Enviado", 120_000);
  });
});
