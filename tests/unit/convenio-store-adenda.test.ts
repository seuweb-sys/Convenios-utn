import { describe, expect, it } from "vitest";

import { isAdendaConvenioData } from "@/stores/convenioMarcoStore";

describe("isAdendaConvenioData", () => {
  it("detects adenda by type id even for partial drafts", () => {
    expect(
      isAdendaConvenioData(
        { convenio_type_id: 6, convenio_types: { name: "Adenda" } },
        { entidad_nombre: "Entidad parcial" },
      ),
    ).toBe(true);
  });

  it("detects adenda by type name or slug without requiring adenda-specific fields", () => {
    expect(
      isAdendaConvenioData(
        { convenio_type_id: null, convenio_types: { name: "Adenda" } },
        {},
      ),
    ).toBe(true);

    expect(
      isAdendaConvenioData(
        { convenio_type_id: null, template_slug: "nuevo-adenda" },
        {},
      ),
    ).toBe(true);
  });

  it("does not misclassify other convenio types as adenda", () => {
    expect(
      isAdendaConvenioData(
        { convenio_type_id: 3, convenio_types: { name: "Acuerdo de Colaboración" } },
        { entidad_nombre: "Entidad" },
      ),
    ).toBe(false);
  });
});
