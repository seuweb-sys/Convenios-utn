import { describe, expect, it } from "vitest";

import {
  buildAdminEditHref,
  getAdminActionItems,
} from "@/app/protected/admin/convenio-action-helpers";
import { buildAdminDirectEditContext } from "@/app/components/convenios/admin-edit-payload";
import { requiresAdminEditConfirmation } from "@/app/protected/convenio-detalle/edit-mode-helpers";
import { getConvenioFormSlugByTypeId } from "@/app/lib/convenio-editing";

describe("admin convenio edit actions", () => {
  it("keeps correction requests for non-approved convenios while adding direct edit", () => {
    const actions = getAdminActionItems({
      id: "conv-1",
      status: "revision",
      convenioTypeId: 5,
      documentPath: null,
      signedPdfPath: null,
    });

    expect(actions.map((action) => action.label)).toEqual(
      expect.arrayContaining(["Editar convenio", "Solicitar corrección", "Aprobar", "Rechazar"]),
    );
    expect(buildAdminEditHref("conv-1", 5)).toBe(
      "/protected/convenio-detalle/conv-1?mode=correccion&origin=admin-edit&type=practica-marco",
    );
  });

  it("maps convenio type ids to correction form slugs for admin direct edit", () => {
    expect(getConvenioFormSlugByTypeId(1)).toBe("particular");
    expect(getConvenioFormSlugByTypeId(2)).toBe("marco");
    expect(getConvenioFormSlugByTypeId(3)).toBe("acuerdo");
    expect(getConvenioFormSlugByTypeId(4)).toBe("especifico");
    expect(getConvenioFormSlugByTypeId(5)).toBe("practica-marco");
    expect(getConvenioFormSlugByTypeId(6)).toBe("adenda");
    expect(getConvenioFormSlugByTypeId(null)).toBeNull();
  });

  it("keeps direct edit available for approved convenios and marks destructive confirmation payload", () => {
    const actions = getAdminActionItems({
      id: "conv-2",
      status: "aprobado",
      convenioTypeId: 2,
      documentPath: "https://drive.google.com/file/d/original/view",
      signedPdfPath: "https://drive.google.com/file/d/signed/view",
    });

    expect(actions.map((action) => action.label)).toEqual(
      expect.arrayContaining([
        "Editar convenio",
        "Reemplazar PDF firmado",
        "Ver PDF firmado",
        "Ver documento original",
      ]),
    );
    expect(actions.map((action) => action.label)).not.toContain("Solicitar corrección");
    expect(requiresAdminEditConfirmation("admin-edit", "aprobado")).toBe(true);
    expect(buildAdminDirectEditContext("admin-edit", "aprobado")).toEqual({
      source: "admin_direct",
      approved_reset_confirmed: true,
    });
  });
});
