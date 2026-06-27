import { describe, expect, it } from "vitest";

import { mapConvenioDataToFields } from "@/app/components/convenios/convenio-form-payload";
import { buildAdendaSubmissionSnapshot } from "@/app/components/forms/adenda/adenda-submit";

describe("Adenda submission payload helpers", () => {
  it("builds a normalized snapshot for final submit using the current form values", () => {
    const snapshot = buildAdendaSubmissionSnapshot({
      convenioData: {
        id: "conv-1",
        user_id: "user-1",
        status: "borrador",
        convenio_type_id: 6,
      },
      values: {
        ciudad: "Resistencia",
        provincia: "Chaco",
        dia: "4",
        mes: "Abril",
        anio: "2026",
        entidad_nombre: "Entidad Adenda",
        entidad_tipo: "Empresa",
        entidad_domicilio: "Calle 123",
        entidad_ciudad: "Resistencia",
        entidad_provincia: "Chaco",
        entidad_cuit: " 30712345678 ",
        entidad_representante: "Ana Representante",
        entidad_dni: "40123456",
        entidad_cargo: "Gerenta",
        convenios_previos: [
          { tipo: "Convenio Marco", fecha: "2026-05-01", objeto: "Cooperación" },
          { tipo: "", fecha: "", objeto: "" },
        ],
        exponen_adicional: "Texto adicional",
        acuerdan: [{ ordinal: "", texto: "Cláusula de prueba" }],
      },
      uploadedAnexos: [
        {
          id: "anexo-1",
          name: "adenda-anexo.pdf",
          mimeType: "application/pdf",
          progress: 100,
          uploadStatus: "uploaded",
          driveFileId: "drive-1",
          webViewLink: "https://drive.google.com/file/d/drive-1/view",
          size: 1024,
        },
      ],
    });

    expect(snapshot).toMatchObject({
      id: "conv-1",
      user_id: "user-1",
      status: "borrador",
      convenio_type_id: 6,
      convenio_type: "adenda",
      template_slug: "nuevo-adenda",
      entidad_cuit: "30712345678",
      ciudad: "Resistencia",
      entidad_nombre: "Entidad Adenda",
      exponen_adicional: "Texto adicional",
    });
    expect(snapshot.convenios_previos).toEqual([
      { tipo: "Convenio Marco", fecha: "2026-05-01", objeto: "Cooperación" },
    ]);
    expect(snapshot.acuerdan).toEqual([{ ordinal: "PRIMERA", texto: "Cláusula de prueba" }]);
    expect(snapshot.anexos).toHaveLength(1);
    expect(snapshot.anexosMarco).toEqual(snapshot.anexos);
  });

  it("maps Adenda snapshot fields without losing current form values", () => {
    const mapped = mapConvenioDataToFields({
      convenio_type_id: 6,
      ciudad: "Resistencia",
      provincia: "Chaco",
      dia: "4",
      mes: "Abril",
      anio: "2026",
      entidad_nombre: "Entidad Adenda",
      entidad_tipo: "Empresa",
      entidad_domicilio: "Calle 123",
      entidad_ciudad: "Resistencia",
      entidad_provincia: "Chaco",
      entidad_cuit: "30712345678",
      entidad_representante: "Ana Representante",
      entidad_dni: "40123456",
      entidad_cargo: "Gerenta",
      convenios_previos: [
        { tipo: "Convenio Marco", fecha: "2026-05-01", objeto: "Cooperación" },
      ],
      exponen_adicional: "Texto adicional",
      acuerdan: [{ ordinal: "PRIMERA", texto: "Cláusula de prueba" }],
    });

    expect(mapped).toMatchObject({
      ciudad: "Resistencia",
      entidad_nombre: "Entidad Adenda",
      convenios_previos: [
        { tipo: "Convenio Marco", fecha: "2026-05-01", objeto: "Cooperación" },
      ],
      acuerdan: [{ ordinal: "PRIMERA", texto: "Cláusula de prueba" }],
    });
  });

  it("detects adenda payloads even when new drafts do not yet carry type metadata", () => {
    const mapped = mapConvenioDataToFields({
      ciudad: "Resistencia",
      provincia: "Chaco",
      dia: "4",
      mes: "Abril",
      anio: "2026",
      entidad_nombre: "Entidad Adenda",
      entidad_tipo: "Empresa",
      entidad_domicilio: "Calle 123",
      entidad_ciudad: "Resistencia",
      entidad_provincia: "Chaco",
      entidad_cuit: "30712345678",
      entidad_representante: "Ana Representante",
      entidad_dni: "40123456",
      entidad_cargo: "Gerenta",
      convenios_previos: [
        { tipo: "Convenio Marco", fecha: "2026-05-01", objeto: "Cooperación" },
      ],
      exponen_adicional: "Texto adicional",
      acuerdan: [{ ordinal: "PRIMERA", texto: "Cláusula de prueba" }],
      anexos: [{ name: "adenda-anexo.pdf", driveFileId: "drive-1" }],
    });

    expect(mapped).toMatchObject({
      provincia: "Chaco",
      anio: "2026",
      entidad_provincia: "Chaco",
      convenios_previos: [
        { tipo: "Convenio Marco", fecha: "2026-05-01", objeto: "Cooperación" },
      ],
      acuerdan: [{ ordinal: "PRIMERA", texto: "Cláusula de prueba" }],
    });
  });
});
