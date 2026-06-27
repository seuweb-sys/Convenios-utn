import fs from "node:fs";
import path from "node:path";

import PizZip from "pizzip";
import { describe, expect, it } from "vitest";

import { renderDocx } from "@/app/lib/utils/docx-templater";

describe("Adenda DOCX rendering", () => {
  it("renders the real Addenda template without undefined placeholders", async () => {
    const templatePath = path.join(process.cwd(), "templates", "addenda.docx");
    const templateBuffer = fs.readFileSync(templatePath);

    const output = await renderDocx(templateBuffer, {
      ciudad: "Resistencia",
      provincia: "Chaco",
      dia: "4",
      mes: "Abril",
      anio: "2026",
      entidad_nombre: "Entidad Adenda Test",
      entidad_tipo: "Empresa",
      entidad_domicilio: "Calle Adenda 123",
      entidad_ciudad: "Resistencia",
      entidad_provincia: "Chaco",
      entidad_cuit: "30712345678",
      entidad_representante: "Ana Representante",
      entidad_dni: "40123456",
      entidad_cargo: "Gerenta General",
      convenios_previos: [
        {
          tipo: "Convenio Marco",
          fecha: "2026-04-01",
          objeto: "Cooperación institucional",
        },
      ],
      exponen_adicional: "Texto adicional de exponen.",
      acuerdan: [
        {
          ordinal: "PRIMERA",
          texto: "Cláusula de prueba renderizada.",
        },
      ],
    });

    const zip = new PizZip(output);
    const documentXml = zip.file("word/document.xml")?.asText() || "";

    expect(documentXml).toContain("Entidad Adenda Test");
    expect(documentXml).toContain("Cooperación institucional");
    expect(documentXml).toContain("Cláusula de prueba renderizada.");
    expect(documentXml).not.toContain("undefined");
    expect(documentXml).not.toContain("{entidad_nombre}");
    expect(documentXml).not.toContain("{#convenios_previos}");
    expect(documentXml).not.toContain("{#acuerdan}");
  });
});
