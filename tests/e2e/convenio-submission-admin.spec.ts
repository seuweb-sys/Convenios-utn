import { test } from "@playwright/test";
import {
  getRoleCredentials,
  hasRoleFixtures,
  login,
  openConvenioForm,
} from "./helpers/auth";
import {
  createFakeUploadFile,
  expectCareerDisabledOutsideSA,
  expectAnexosCount,
  expectMockedSuccess,
  expectScopedPayload,
  fillParticularForm,
  fillAcuerdoForm,
  fillEspecificoForm,
  fillMarcoForm,
  interceptConvenioSubmission,
  setAdminClassification,
  submitFinalAction,
} from "./helpers/convenio-submission";

const saSecretariatLabel = "SA - Secretaría Académica";
const saCareerLabel = "ISI - Ingeniería en Sistemas de Información";
const cytSecretariatLabel = "CYT - Secretaría de Ciencia y Tecnología";

test.describe("Admin convenio submission", () => {
  test.skip(!hasRoleFixtures("admin"), "Set admin e2e credentials to run this test suite.");

  test("marco submission includes anexos and scope classification in payload", async ({ page }) => {
    const capture = await interceptConvenioSubmission(page);
    const uploadFile = createFakeUploadFile(
      "anexo-marco.pdf",
      "application/pdf",
      "fake marco attachment"
    );

    await login(page, getRoleCredentials("admin")!);
    await openConvenioForm(page, "marco");
    const { secretariatValue, careerValue } = await setAdminClassification(page, cytSecretariatLabel);
    await expectCareerDisabledOutsideSA(page);

    await fillMarcoForm(page, "mocked-marco", uploadFile);
    await submitFinalAction(page, /Guardar y Enviar convenio/i, /Sí, enviar/i);

    await expectMockedSuccess(page, "Convenio Creado!");
    expectScopedPayload(capture.payload, secretariatValue, careerValue, null);
    expectAnexosCount(capture.payload, 1);
  });

  test("especifico submission includes anexos and scope classification in payload", async ({ page }) => {
    const capture = await interceptConvenioSubmission(page);
    const uploadFile = createFakeUploadFile(
      "anexo-especifico.pdf",
      "application/pdf",
      "fake especifico attachment"
    );

    await login(page, getRoleCredentials("admin")!);
    await openConvenioForm(page, "especifico");
    const { secretariatValue, careerValue } = await setAdminClassification(page, cytSecretariatLabel);
    await expectCareerDisabledOutsideSA(page);

    await fillEspecificoForm(page, "mocked-especifico", uploadFile);
    await submitFinalAction(page, /Guardar y Enviar convenio/i, /Sí, enviar/i);

    await expectMockedSuccess(page, "Convenio Específico Enviado");
    expectScopedPayload(capture.payload, secretariatValue, careerValue, null);
    expectAnexosCount(capture.payload, 1);
  });

  test("acuerdo submission sends scope classification in payload", async ({ page }) => {
    const capture = await interceptConvenioSubmission(page);

    await login(page, getRoleCredentials("admin")!);
    await openConvenioForm(page, "acuerdo");
    const { secretariatValue, careerValue } = await setAdminClassification(page, cytSecretariatLabel);
    await expectCareerDisabledOutsideSA(page);

    await fillAcuerdoForm(page, "mocked-acuerdo");
    await submitFinalAction(page, /^Finalizar$/, /Enviar acuerdo/i);

    await expectMockedSuccess(page, "Acuerdo de Colaboración Enviado");
    expectScopedPayload(capture.payload, secretariatValue, careerValue, null);
  });

  test("practice submission in SA requires and sends career classification", async ({ page }) => {
    const capture = await interceptConvenioSubmission(page);

    await login(page, getRoleCredentials("admin")!);
    await openConvenioForm(page, "particular");
    const { secretariatValue, careerValue } = await setAdminClassification(page, saSecretariatLabel, {
      careerLabel: saCareerLabel,
    });

    await fillParticularForm(page, "mocked-admin-particular");
    await submitFinalAction(page, /^Finalizar$/, /Enviar convenio/i);

    await expectMockedSuccess(page, "Convenio Particular Enviado");
    expectScopedPayload(capture.payload, secretariatValue, careerValue, null);
  });
});
