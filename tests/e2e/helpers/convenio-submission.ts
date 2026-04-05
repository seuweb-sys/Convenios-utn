import { expect, type Page, type Route } from "@playwright/test";

type SubmissionCapture = {
  payload: Record<string, unknown> | null;
  responseStatus: number | null;
};

export function createFakeUploadFile(name: string, mimeType: string, contents: string) {
  return {
    name,
    mimeType,
    buffer: Buffer.from(contents),
  };
}

export async function interceptConvenioSubmission(page: Page) {
  const capture: SubmissionCapture = {
    payload: null,
    responseStatus: null,
  };

  await page.route("**/api/convenios", async (route: Route) => {
    const request = route.request();

    if (request.method() !== "POST") {
      await route.continue();
      return;
    }

    capture.payload = request.postDataJSON() as Record<string, unknown>;
    capture.responseStatus = 200;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        id: "mock-convenio-id",
        convenio: {
          id: "mock-convenio-id",
          status: "enviado",
          document_path: "https://example.com/mock-doc",
          secretariat_id: capture.payload.secretariat_id,
          career_id: capture.payload.career_id,
          org_unit_id: capture.payload.org_unit_id,
        },
      }),
    });
  });

  return capture;
}

export async function expectScopedClassificationLoaded(page: Page) {
  const secretariatValue = await page.locator("select").first().inputValue();
  const careerValue = await page.locator("select").nth(1).inputValue();

  expect(secretariatValue).not.toBe("");
  expect(careerValue).not.toBe("");

  return { secretariatValue, careerValue };
}

export async function setAdminClassification(
  page: Page,
  secretariatLabel: string,
  options?: {
    careerLabel?: string;
    orgUnitLabel?: string;
  }
) {
  await page.locator("select").first().selectOption({ label: secretariatLabel });
  if (options?.careerLabel) {
    await page.locator("select").nth(1).selectOption({ label: options.careerLabel });
  }
  if (options?.orgUnitLabel) {
    await page.locator("select").nth(2).selectOption({ label: options.orgUnitLabel });
  }

  const secretariatValue = await page.locator("select").first().inputValue();
  const careerValue = await page.locator("select").nth(1).inputValue();
  const orgUnitValue = await page.locator("select").nth(2).inputValue();

  expect(secretariatValue).not.toBe("");
  if (options?.careerLabel) {
    expect(careerValue).not.toBe("");
  }
  if (options?.orgUnitLabel) {
    expect(orgUnitValue).not.toBe("");
  }

  return { secretariatValue, careerValue, orgUnitValue };
}

export async function expectCareerDisabledOutsideSA(page: Page) {
  const secretariatSelect = page.locator("select").first();
  const careerSelect = page.locator("select").nth(1);

  await expect(careerSelect).toBeDisabled();

  const secretariatValue = await secretariatSelect.inputValue();
  const careerValue = await careerSelect.inputValue();

  expect(secretariatValue).not.toBe("");
  expect(careerValue).toBe("");

  return { secretariatValue, careerValue };
}

export async function expectLockedNonSaClassification(page: Page) {
  const secretariatSelect = page.locator("select").first();
  const careerSelect = page.locator("select").nth(1);
  const orgUnitSelect = page.locator("select").nth(2);

  await expect(secretariatSelect).toBeDisabled();
  await expect(careerSelect).toBeDisabled();

  const secretariatValue = await secretariatSelect.inputValue();
  const careerValue = await careerSelect.inputValue();
  const orgUnitValue = await orgUnitSelect.inputValue();

  expect(secretariatValue).not.toBe("");
  expect(careerValue).toBe("");

  return { secretariatValue, careerValue, orgUnitValue };
}

export async function selectOrgUnit(page: Page, orgUnitLabel: string) {
  const orgUnitSelect = page.locator("select").nth(2);
  await orgUnitSelect.selectOption({ label: orgUnitLabel });
  const orgUnitValue = await orgUnitSelect.inputValue();
  expect(orgUnitValue).not.toBe("");
  return orgUnitValue;
}

export async function submitFinalAction(page: Page, triggerLabel: RegExp | string, confirmLabel: RegExp | string) {
  await page.getByRole("button", { name: triggerLabel }).click();
  await page.getByRole("button", { name: confirmLabel }).click();
}

export async function fillParticularForm(page: Page, suffix: string) {
  await page.getByLabel("Nombre de la Empresa *").fill(`Empresa E2E ${suffix}`);
  await page.getByLabel("CUIT (sin guiones) *").fill("30712345678");
  await page.getByLabel("Representante Legal *").fill("Ana Prueba");
  await page.getByLabel("Carácter del Representante *").fill("Gerente");
  await page.getByLabel("Dirección *").fill("Calle Falsa 123");
  await page.getByLabel("Ciudad *").fill("Resistencia");
  await page.getByLabel("Tutor por la Empresa *").fill("Carlos Tutor");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.getByLabel("Nombre Completo del Alumno *").fill(`Alumno ${suffix}`);
  await page.getByLabel("Carrera del Alumno *").fill("Ingeniería en Sistemas de Información");
  await page.getByLabel("DNI del Alumno *").fill("40123456");
  await page.getByLabel("Legajo del Alumno *").fill("12345");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.getByLabel("Fecha de Inicio *").fill("2026-04-05");
  await page.getByLabel("Fecha de Fin *").fill("2026-08-05");
  await page.getByLabel("Docente Tutor por la Facultad *").fill("Docente Tutor");
  await page.getByLabel("Duración de la práctica *").fill("4 meses");
  await page.getByLabel("Temática de Desarrollo *").fill(
    "Desarrollo de una práctica supervisada de prueba para validación end-to-end."
  );
  await page.locator("#mes").selectOption({ label: "Abril" });
  await page.locator("#dia").selectOption("4");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.getByLabel(/Confirmo que toda la información es correcta/i).check();
}

export async function fillPracticaMarcoForm(page: Page, suffix: string) {
  await page.getByLabel("Nombre de la Entidad *").fill(`Entidad Práctica ${suffix}`);
  await page.getByLabel("Tipo de Entidad *").fill("Empresa");
  await page.getByLabel("Dirección *").fill("Calle Práctica 123");
  await page.getByLabel("Ciudad *").fill("Resistencia");
  await page.getByLabel("CUIT (sin guiones) *").fill("30712345678");
  await page.getByLabel("Rubro/Actividad *").fill("Software");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.getByLabel("Nombre Completo *").fill("Representante Práctica");
  await page.getByLabel("Cargo *").fill("Gerente");
  await page.getByLabel("DNI *").fill("40123456");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.locator("#mes").selectOption({ label: "Abril" });
  await page.locator("#dia").selectOption("4");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();
}

export async function fillAcuerdoForm(page: Page, suffix: string) {
  await page.getByLabel("Nombre de la Entidad *").fill(`Entidad Acuerdo ${suffix}`);
  await page.getByLabel("CUIT (sin guiones) *").fill("30712345678");
  await page.getByLabel("Domicilio *").fill("Calle Acuerdo 123");
  await page.getByLabel("Ciudad *").fill("Resistencia");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.getByLabel("Nombre del Representante *").fill("Representante Acuerdo");
  await page.getByLabel("DNI del Representante *").fill("40123456");
  await page.getByLabel("Cargo del Representante *").fill("Director");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.getByLabel("Unidad Ejecutora (Facultad) *").fill("Departamento Académico");
  await page.getByLabel("Unidad Ejecutora (Entidad) *").fill("Área Técnica");
  await page.getByLabel("Asignatura *").fill("Proyecto Final");
  await page.getByLabel("Carrera *").fill("Ingeniería en Sistemas");
  await page.getByLabel("Objetivo General *").fill("Objetivo general del acuerdo de colaboración.");
  await page.getByLabel("Años de Vigencia *").fill("2");
  await page.getByLabel("Días de Extinción *").fill("30");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.locator("#mes").selectOption({ label: "Abril" });
  await page.locator("#dia").selectOption("4");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.getByLabel(/Confirmo que toda la información es correcta/i).check();
}

export async function fillEspecificoForm(page: Page, suffix: string, uploadFile: { name: string; mimeType: string; buffer: Buffer }) {
  await page.getByLabel("Nombre de la Entidad *").fill(`Entidad Específica ${suffix}`);
  await page.getByLabel("Domicilio *").fill("Calle Específica 123");
  await page.getByLabel("CUIT *").fill("30712345678");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.getByLabel("Nombre del Representante *").fill("Representante Específico");
  await page.getByLabel("Cargo *").fill("Gerente");
  await page.getByLabel("DNI *").fill("40123456");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.getByLabel("Fecha del Convenio Marco *").fill("2026-04-01");
  await page.getByLabel("Tipo de Convenio Específico *").fill("Asistencia Técnica");
  await page.getByLabel("Unidad Ejecutora Facultad *").fill("Departamento de Sistemas");
  await page.getByLabel("Unidad Ejecutora Entidad *").fill("Área de Desarrollo");
  await page.locator("#mes").selectOption({ label: "Abril" });
  await page.locator("#dia").selectOption("4");
  await page.locator("#multiple-word-upload").setInputFiles(uploadFile);
  await expect(page.getByText(uploadFile.name).first()).toBeVisible();
  await page.getByRole("button", { name: /^Siguiente$/ }).click();
}

export async function fillMarcoForm(page: Page, suffix: string, uploadFile: { name: string; mimeType: string; buffer: Buffer }) {
  await page.getByRole("button", { name: /Agregar institución/i }).click();
  await page.getByLabel("Nombre *").fill(`Entidad Marco ${suffix}`);
  await page.getByLabel("Tipo").fill("EMPRESA");
  await page.getByLabel("CUIT").fill("30712345678");
  await page.getByLabel("Ciudad").fill("Resistencia");
  await page.getByLabel("Domicilio").fill("Calle Marco 123");
  await page.getByLabel("Representante", { exact: true }).fill("Representante Marco");
  await page.getByLabel("Cargo").fill("Director");
  await page.getByLabel("DNI Representante").fill("40123456");
  await page.getByRole("button", { name: /^Guardar$/ }).click();
  await expect(page.getByText(`Entidad Marco ${suffix}`)).toBeVisible();
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.locator("#mes").selectOption({ label: "Abril" });
  await page.locator("#dia").selectOption("4");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.locator("#marco-anexos-upload").setInputFiles(uploadFile);
  await expect(page.getByText(uploadFile.name).first()).toBeVisible();
  await page.getByRole("button", { name: /^Siguiente$/ }).click();
}

export async function expectMockedSuccess(page: Page, successTitle: string, timeout = 15_000) {
  await expect(page.getByText(successTitle)).toBeVisible({ timeout });
}

export function expectScopedPayload(
  payload: Record<string, unknown> | null,
  secretariatValue: string,
  careerValue?: string | null,
  orgUnitValue?: string | null
) {
  expect(payload).not.toBeNull();
  expect(payload?.secretariat_id).toBe(secretariatValue);
  if (careerValue !== undefined) {
    expect(payload?.career_id).toBe(careerValue);
  }
  if (orgUnitValue !== undefined) {
    expect(payload?.org_unit_id).toBe(orgUnitValue);
  }
  expect(payload?.status).toBe("enviado");
  expect(payload?.agreement_year).toBe(new Date().getFullYear());
}

export function expectAnexosCount(payload: Record<string, unknown> | null, expectedCount: number) {
  expect(payload).not.toBeNull();
  const anexos = payload?.anexos as unknown[] | undefined;
  expect(Array.isArray(anexos)).toBe(true);
  expect(anexos?.length).toBe(expectedCount);
}
