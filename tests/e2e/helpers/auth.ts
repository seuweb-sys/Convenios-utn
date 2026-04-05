import { expect, type Page } from "@playwright/test";

export type RoleKey = "profesor" | "admin" | "director" | "miembro" | "decano";

export type RoleCredentials = {
  email: string;
  password: string;
};

export function getRoleCredentials(role: RoleKey): RoleCredentials | null {
  if (role === "profesor") {
    const email = process.env.E2E_PROFESOR_EMAIL || process.env.E2E_EMAIL;
    const password = process.env.E2E_PROFESOR_PASSWORD || process.env.E2E_PASSWORD;
    return email && password ? { email, password } : null;
  }

  if (role === "admin") {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    return email && password ? { email, password } : null;
  }

  if (role === "director") {
    const email = process.env.E2E_DIRECTOR_EMAIL;
    const password = process.env.E2E_DIRECTOR_PASSWORD;
    return email && password ? { email, password } : null;
  }

  if (role === "miembro") {
    const email = process.env.E2E_MIEMBRO_EMAIL;
    const password = process.env.E2E_MIEMBRO_PASSWORD;
    return email && password ? { email, password } : null;
  }

  if (role === "decano") {
    const email = process.env.E2E_DECANO_EMAIL;
    const password = process.env.E2E_DECANO_PASSWORD;
    return email && password ? { email, password } : null;
  }

  return null;
}

export function hasRoleFixtures(role: RoleKey) {
  return !!getRoleCredentials(role);
}

export async function login(page: Page, credentials: RoleCredentials) {
  await page.goto("/sign-in");
  await page.getByLabel("Correo electrónico").fill(credentials.email);
  await page.getByLabel("Contraseña").fill(credentials.password);
  await page.getByRole("button", { name: /iniciar sesión|iniciar sesion/i }).click();
  await page.waitForURL(/\/protected(\/|$)/, {
    timeout: 60_000,
  });
}

export async function openConvenioForm(page: Page, type: string) {
  await page.goto(`/protected/convenio-detalle/nuevo?type=${type}`);
  await expect(page.getByText("Clasificación del convenio")).toBeVisible();
  await page.waitForFunction(() => {
    const secretariatSelect = document.querySelector("select");
    return secretariatSelect instanceof HTMLSelectElement && secretariatSelect.value !== "";
  });
}
