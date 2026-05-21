import { describe, expect, it } from "vitest";

import {
  buildPpsSubmissionRequest,
  hydratePpsAttachmentRefs,
} from "@/app/components/forms/convenio-particular/pps-attachments";

describe("PPS attachment helpers", () => {
  it("builds a PPS request without attachments when none were selected", () => {
    const request = buildPpsSubmissionRequest({
      convenioData: {
        empresa_nombre: "Empresa Test",
        alumno_nombre: "Alumno Test",
        empresa_representante_nombre: "Ana",
        empresa_representante_caracter: "Gerente",
        empresa_direccion_calle: "Calle 123",
        empresa_direccion_ciudad: "Resistencia",
        empresa_tutor_nombre: "Tutor",
        alumno_carrera: "ISI",
        alumno_dni: "40123456",
        alumno_legajo: "1234",
        fecha_inicio: "2026-04-05",
        fecha_fin: "2026-08-05",
        practica_duracion: "4 meses",
        practica_tematica: "Práctica de desarrollo supervisado.",
        facultad_docente_tutor_nombre: "Docente Tutor",
        fecha_firma: "2026-04-04",
      },
      secretariatId: "sec-1",
      careerId: "career-1",
      orgUnitId: null,
      agreementYear: 2026,
      attachmentRefs: [],
    });

    expect(request.convenio_type_id).toBe(1);
    expect(request.anexos).toEqual([]);
    expect(request.content_data.anexos).toEqual([]);
  });

  it("hydrates saved refs and preserves them through subsequent edits", () => {
    const savedRefs = [
      {
        name: "pps-anexo.pdf",
        driveFileId: "drive-1",
        mimeType: "application/pdf",
        webViewLink: "https://drive.google.com/file/d/drive-1/view",
      },
    ];

    const hydrated = hydratePpsAttachmentRefs(savedRefs);
    expect(hydrated).toEqual([
      expect.objectContaining({
        name: "pps-anexo.pdf",
        driveFileId: "drive-1",
        existing: true,
        uploadStatus: "uploaded",
      }),
    ]);

    const request = buildPpsSubmissionRequest({
      convenioData: {
        empresa_nombre: "Empresa Test",
        alumno_nombre: "Alumno Test",
        fecha_firma: "2026-04-04",
      },
      secretariatId: "sec-1",
      careerId: "career-1",
      orgUnitId: null,
      agreementYear: 2026,
      attachmentRefs: hydrated,
    });

    expect(request.anexos).toEqual(savedRefs);
    expect(request.content_data.anexos).toEqual(savedRefs);
  });
});
