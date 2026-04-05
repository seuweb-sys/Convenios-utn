import fs from "fs";
import path from "path";
import { chromium } from "@playwright/test";

const baseURL = process.env.MANUAL_UI_BASE_URL || "http://127.0.0.1:3000";
const email = "e2e-profesor-convenios@example.com";
const password = "E2EConvenios123!";
const outputDir = path.join(process.cwd(), "test-results", "manual-ui");

fs.mkdirSync(outputDir, { recursive: true });

async function login(page) {
  await page.goto(`${baseURL}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await page.waitForFunction(() => window.location.pathname.startsWith("/protected"), null, {
    timeout: 30000,
  });
}

async function fillConvenioParticular(page, suffix) {
  await page.goto(`${baseURL}/protected/convenio-detalle/nuevo?type=particular`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByText("Clasificación del convenio", { exact: false }).waitFor({ timeout: 30000 });
  await page.waitForFunction(() => {
    const firstSelect = document.querySelector("select");
    return firstSelect instanceof HTMLSelectElement && firstSelect.value !== "";
  }, null, { timeout: 30000 });

  await page.getByLabel("Nombre de la Empresa *").fill(`Empresa Test ${suffix}`);
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
  await page.getByLabel("Temática de Desarrollo *").fill("Desarrollo de una práctica supervisada de prueba para validación end-to-end.");
  await page.locator("#mes").selectOption("Abril");
  await page.locator("#dia").selectOption("5");
  await page.getByRole("button", { name: /^Siguiente$/ }).click();

  await page.getByLabel(/Confirmo que toda la información es correcta/i).check();
  await page.getByRole("button", { name: /^Finalizar$/ }).click();
  await page.getByRole("button", { name: /Enviar convenio/i }).click();
}

async function runScenario({ simulateMissingSecretariat, screenshotName, expectedText, logPayload = false }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();

  page.on("response", async (response) => {
    if (!response.url().includes("/api/convenios") || response.request().method() !== "POST") {
      return;
    }

    try {
      const bodyText = await response.text();
      console.log(`[response:${screenshotName}] ${response.status()} ${bodyText}`);
    } catch (error) {
      console.log(`[response:${screenshotName}] ${response.status()} <body unavailable>`);
    }
  });

  if (simulateMissingSecretariat || logPayload) {
    await page.route("**/api/convenios", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.continue();
        return;
      }

      const postData = request.postDataJSON();
      if (logPayload) {
        console.log(`[payload:${screenshotName}]`, JSON.stringify(postData, null, 2));
      }
      if (simulateMissingSecretariat) {
        delete postData.secretariat_id;
      }
      await route.continue({ postData: JSON.stringify(postData) });
    });
  }

  try {
    await login(page);
    await fillConvenioParticular(page, screenshotName);

    if (expectedText) {
      await page.getByText(expectedText, { exact: false }).waitFor({ timeout: 120000 });
    }

    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(outputDir, screenshotName),
      fullPage: true,
    });
  } catch (error) {
    await page.screenshot({
      path: path.join(outputDir, `failed-${screenshotName}`),
      fullPage: true,
    });
    throw error;
  } finally {
    await browser.close();
  }
}

async function main() {
  await runScenario({
    simulateMissingSecretariat: true,
    screenshotName: "before-bug.png",
    expectedText: "Debe seleccionar la secretaría",
  });

  await runScenario({
    simulateMissingSecretariat: false,
    screenshotName: "after-fix.png",
    expectedText: "Convenio Particular Enviado",
    logPayload: true,
  });

  console.log(JSON.stringify({ outputDir }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
