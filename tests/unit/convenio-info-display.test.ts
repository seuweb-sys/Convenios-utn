import { describe, expect, it } from "vitest";

import { resolveFacultadResponsible } from "@/app/lib/forms/pps-display";

describe("convenio info display helpers", () => {
  it("prefers the Facultad tutor key for PPS responsible display", () => {
    expect(
      resolveFacultadResponsible({
        facultad_docente_tutor_nombre: "Ing. Ana Facultad",
        practica_tutor_docente: "Ing. Tutor Legacy",
      })
    ).toBe("Ing. Ana Facultad");
  });

  it("falls back to practica_tutor_docente and then a safe empty state", () => {
    expect(resolveFacultadResponsible({ practica_tutor_docente: "Ing. Tutor Legacy" })).toBe(
      "Ing. Tutor Legacy"
    );
    expect(resolveFacultadResponsible({})).toBe("");
  });
});
