import { describe, expect, it } from "vitest";

import { prepareDocxTemplateData } from "@/app/lib/utils/docx-templater";

describe("DOCX template data preparation", () => {
  it("preserves an explicit empty CUIT string for PPS no-CUIT documents", () => {
    const data = prepareDocxTemplateData({
      empresa_nombre: "Empresa PPS",
      empresa_cuit: "",
      template_slug: "nuevo-convenio-particular-de-practica-supervisada",
    });

    expect(data).toMatchObject({
      empresa_nombre: "Empresa PPS",
      empresa_cuit: "",
      template_slug: "nuevo-convenio-particular-de-practica-supervisada",
    });
  });

  it("normalizes nullish nested and array CUIT values to safe empty strings", () => {
    const data = prepareDocxTemplateData({
      entidad: { cuit: null },
      partes: [{ nombre: "Sin CUIT", cuit: undefined }],
    });

    expect(data).toEqual({
      entidad: { cuit: "" },
      partes: [{ nombre: "Sin CUIT", cuit: "" }],
    });
  });

  it("preserves Adenda repeatable arrays for docxtemplater loops", () => {
    const data = prepareDocxTemplateData({
      entidad_tipo: "Empresa",
      convenios_previos: [
        { tipo: "Convenio Marco", fecha: "2026-05-01", objeto: "Cooperación" },
      ],
      acuerdan: [
        { ordinal: "PRIMERA", texto: "Texto de prueba" },
      ],
    });

    expect(data).toEqual({
      entidad_tipo: "Empresa",
      convenios_previos: [
        { tipo: "Convenio Marco", fecha: "2026-05-01", objeto: "Cooperación" },
      ],
      acuerdan: [
        { ordinal: "PRIMERA", texto: "Texto de prueba" },
      ],
    });
  });
});
