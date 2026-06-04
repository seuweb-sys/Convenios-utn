import { test } from "@playwright/test";
import {
  getRoleCredentials,
  hasRoleFixtures,
  login,
  openConvenioForm,
} from "./helpers/auth";
import {
  expectAttachmentMetadataOnly,
  expectAnexosCount,
  expectMockedSuccess,
  expectScopedClassificationLoaded,
  expectScopedPayload,
  fillParticularForm,
  interceptConvenioSubmissionWithOptions,
  fillPracticaMarcoForm,
  interceptConvenioSubmission,
  mockDirectDriveUpload,
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
    expectAnexosCount(capture.payload, 0);
  });

  test("particular edit preserves existing attachment refs when the user does not change them", async ({ page }) => {
    const capture = await interceptConvenioSubmissionWithOptions(page, {
      method: "PATCH",
      urlPattern: "**/api/convenios/conv-pps-edit",
    });

    await page.route("**/api/convenios/conv-pps-edit", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "conv-pps-edit",
          convenio_type_id: 1,
          status: "revision",
          secretariat_id: "sec-1",
          career_id: "career-1",
          agreement_year: new Date().getFullYear(),
          form_data: {
            empresa_nombre: "Empresa Edit",
            empresa_representante_nombre: "Ana Edit",
            empresa_representante_caracter: "Gerente",
            empresa_direccion_calle: "Calle Edit 123",
            empresa_direccion_ciudad: "Resistencia",
            empresa_tutor_nombre: "Tutor Edit",
            alumno_nombre: "Alumno Edit",
            alumno_carrera: "Ingeniería en Sistemas de Información",
            alumno_dni: "40123456",
            alumno_legajo: "12345",
            fecha_inicio: "2026-04-05",
            fecha_fin: "2026-08-05",
            practica_duracion: "4 meses",
            practica_tematica: "Práctica supervisada ya existente para edición.",
            facultad_docente_tutor_nombre: "Docente Tutor",
            fecha_firma: "2026-04-04",
            anexos: [
              {
                name: "pps-existente.pdf",
                driveFileId: "drive-existing-1",
                mimeType: "application/pdf",
                webViewLink: "https://drive.google.com/file/d/drive-existing-1/view",
              },
            ],
          },
        }),
      });
    });

    await login(page, getRoleCredentials("profesor")!);
    await page.goto("/protected/convenio-detalle/conv-pps-edit?type=particular&mode=correccion");
    await page.getByText("pps-existente.pdf").waitFor({ timeout: 30_000 });
    await page.getByRole("button", { name: /^Siguiente$/ }).click();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();
    await page.getByLabel(/Confirmo que toda la información es correcta/i).check();
    await submitFinalAction(page, /^Finalizar$/, /Enviar convenio/i);

    await expectMockedSuccess(page, "Convenio Particular Enviado");
    expectAnexosCount(capture.payload, 1);
    expectAttachmentMetadataOnly(capture.payload);
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

  test("particular submission uploads optional attachment refs for professors", async ({ page }) => {
    const capture = await interceptConvenioSubmission(page);
    const uploadFile = {
      name: "pps-profesor.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fake profesor attachment"),
    };

    await mockDirectDriveUpload(page, ["drive-profesor-1"]);
    await login(page, getRoleCredentials("profesor")!);
    await openConvenioForm(page, "particular");
    const { secretariatValue, careerValue } = await expectScopedClassificationLoaded(page);

    await fillParticularForm(page, "mocked-particular-attachment", {
      attachments: [uploadFile],
    });
    await submitFinalAction(page, /^Finalizar$/, /Enviar convenio/i);

    await expectMockedSuccess(page, "Convenio Particular Enviado");
    expectScopedPayload(capture.payload, secretariatValue, careerValue);
    expectAnexosCount(capture.payload, 1);
    expectAttachmentMetadataOnly(capture.payload);
  });

  test("particular submission uploads multiple optional attachment refs for professors", async ({ page }) => {
    const capture = await interceptConvenioSubmission(page);
    const uploadFiles = [
      {
        name: "pps-profesor-1.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("fake profesor attachment 1"),
      },
      {
        name: "pps-profesor-2.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("fake profesor attachment 2"),
      },
    ];

    await mockDirectDriveUpload(page, ["drive-profesor-a", "drive-profesor-b"]);
    await login(page, getRoleCredentials("profesor")!);
    await openConvenioForm(page, "particular");
    const { secretariatValue, careerValue } = await expectScopedClassificationLoaded(page);

    await fillParticularForm(page, "mocked-particular-multi-attachment", {
      attachments: uploadFiles,
    });
    await submitFinalAction(page, /^Finalizar$/, /Enviar convenio/i);

    await expectMockedSuccess(page, "Convenio Particular Enviado");
    expectScopedPayload(capture.payload, secretariatValue, careerValue);
    expectAnexosCount(capture.payload, 2);
    expectAttachmentMetadataOnly(capture.payload);
  });
});
