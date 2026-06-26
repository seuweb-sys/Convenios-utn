import { describe, expect, it } from "vitest";

import { resolveFacultadResponsible } from "@/app/lib/forms/pps-display";
import { resolveConvenioActions } from "@/app/components/convenios/convenio-info-actions";

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

describe("convenio uploader-facing actions (admin correction flow regression)", () => {
  it("exposes no uploader modification trigger for approved convenios", () => {
    const actions = resolveConvenioActions("aprobado");

    expect(actions.canRequestModification).toBe(false);
    expect(actions.canEdit).toBe(false);
  });

  it("only allows continuing edits on draft convenios and never offers self-service modification", () => {
    expect(resolveConvenioActions("borrador")).toEqual({
      canEdit: true,
      canRequestModification: false,
    });
  });

  it("offers no uploader actions for pending/sent/rejected/legacy modification statuses", () => {
    for (const status of [
      "enviado",
      "pendiente",
      "rechazado",
      "revision",
      "revision_modificacion",
    ] as const) {
      expect(resolveConvenioActions(status)).toEqual({
        canEdit: false,
        canRequestModification: false,
      });
    }
  });
});
