import { describe, expect, it } from "vitest";

import { normalizeConveniosPreviosForSubmit } from "@/app/components/forms/adenda/adenda-utils";

describe("normalizeConveniosPreviosForSubmit", () => {
  it("keeps the first convenio previo and removes fully empty optional rows", () => {
    expect(
      normalizeConveniosPreviosForSubmit([
        { tipo: "Convenio Marco", fecha: "2026-05-01", objeto: "Cooperación institucional" },
        { tipo: "", fecha: "", objeto: "" },
      ]),
    ).toEqual([
      { tipo: "Convenio Marco", fecha: "2026-05-01", objeto: "Cooperación institucional" },
    ]);
  });

  it("preserves partially filled optional rows so validation can flag them", () => {
    expect(
      normalizeConveniosPreviosForSubmit([
        { tipo: "Convenio Marco", fecha: "2026-05-01", objeto: "Cooperación institucional" },
        { tipo: "Acta", fecha: "", objeto: "" },
      ]),
    ).toEqual([
      { tipo: "Convenio Marco", fecha: "2026-05-01", objeto: "Cooperación institucional" },
      { tipo: "Acta", fecha: "", objeto: "" },
    ]);
  });
});
