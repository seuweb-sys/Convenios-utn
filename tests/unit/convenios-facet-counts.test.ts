import { describe, expect, it } from "vitest";

import {
  buildConvenioFacetCounts,
  canonicalConvenioTypeOfRow,
  resolveConvenioCareerId,
} from "@/app/lib/convenios/facet-counts";

describe("buildConvenioFacetCounts", () => {
  it("returns empty maps for null/undefined/empty input without throwing", () => {
    expect(buildConvenioFacetCounts(null)).toEqual({
      byStatus: {},
      byType: {},
      bySecretariat: {},
      byCareer: {},
    });
    expect(buildConvenioFacetCounts(undefined)).toEqual({
      byStatus: {},
      byType: {},
      bySecretariat: {},
      byCareer: {},
    });
    expect(buildConvenioFacetCounts([])).toEqual({
      byStatus: {},
      byType: {},
      bySecretariat: {},
      byCareer: {},
    });
  });

  it("counts more than 10 rows per status when the full filtered set is passed", () => {
    const rows = Array.from({ length: 15 }, () => ({ status: "enviado" }));
    const counts = buildConvenioFacetCounts(rows);
    expect(counts.byStatus.enviado).toBe(15);
  });

  it("preserves raw aprobado and aceptado buckets so the summary can sum them", () => {
    const rows = [
      { status: "aprobado" },
      { status: "aprobado" },
      { status: "aceptado" },
      { status: "rechazado" },
    ];
    const counts = buildConvenioFacetCounts(rows);
    expect(counts.byStatus.aprobado).toBe(2);
    expect(counts.byStatus.aceptado).toBe(1);
    expect(counts.byStatus.rechazado).toBe(1);
    // Summary tile sums aprobado + aceptado.
    expect((counts.byStatus.aprobado ?? 0) + (counts.byStatus.aceptado ?? 0)).toBe(3);
  });

  it("skips empty/null status strings", () => {
    const rows = [{ status: "" }, { status: null }, { status: "enviado" }];
    const counts = buildConvenioFacetCounts(rows);
    expect(counts.byStatus).toEqual({ enviado: 1 });
  });

  it("canonicalizes accented and unaccented type names to the same key", () => {
    const accented = {
      convenio_types: { name: "Convenio Marco Práctica Supervisada" },
    };
    const unaccented = {
      convenio_types: { name: "Convenio Marco Practica Supervisada" },
    };
    const counts = buildConvenioFacetCounts([accented, unaccented]);
    expect(Object.keys(counts.byType)).toEqual(["Convenio Marco Práctica Supervisada"]);
    expect(counts.byType["Convenio Marco Práctica Supervisada"]).toBe(2);
  });

  it("resolves type by convenio_type_id when the joined name is missing", () => {
    const rows = [{ convenio_type_id: 5 }, { convenio_type_id: 2 }];
    const counts = buildConvenioFacetCounts(rows);
    expect(counts.byType["Convenio Marco Práctica Supervisada"]).toBe(1);
    expect(counts.byType["Convenio Marco"]).toBe(1);
  });

  it("excludes only Sin tipo rows from byType but preserves unknown raw names", () => {
    // Legacy AdminFilters behavior: rows with a raw type name keep that name as
    // the canonical key (even if unknown), only rows without any type name and
    // without a resolvable convenio_type_id collapse to "Sin tipo" and are
    // excluded from byType.
    const rows = [
      { convenio_types: { name: "Convenio Marco" } },
      { convenio_types: { name: "Tipo Desconocido" } },
      { convenio_types: { name: null } },
      {},
    ];
    const counts = buildConvenioFacetCounts(rows);
    expect(Object.keys(counts.byType).sort()).toEqual(
      ["Convenio Marco", "Tipo Desconocido"].sort()
    );
    expect(counts.byType["Convenio Marco"]).toBe(1);
    expect(counts.byType["Tipo Desconocido"]).toBe(1);
    expect(counts.byType["Sin tipo"]).toBeUndefined();
  });

  it("counts secretariat ids and skips null/empty ids", () => {
    const rows = [
      { secretariat_id: "sec-1" },
      { secretariat_id: "sec-1" },
      { secretariat_id: "sec-2" },
      { secretariat_id: null },
      { secretariat_id: "" },
    ];
    const counts = buildConvenioFacetCounts(rows);
    expect(counts.bySecretariat).toEqual({ "sec-1": 2, "sec-2": 1 });
  });

  it("prefers row career_id and falls back to joined profile career_id", () => {
    const rows = [
      { career_id: "c-1" },
      { career_id: null, profiles: { career_id: "c-2" } },
      { career_id: "", profiles: { career_id: "c-2" } },
      { career_id: null, profiles: { career_id: null } },
    ];
    const counts = buildConvenioFacetCounts(rows);
    expect(counts.byCareer).toEqual({ "c-1": 1, "c-2": 2 });
  });

  it("exposes resolveConvenioCareerId and canonicalConvenioTypeOfRow helpers", () => {
    expect(resolveConvenioCareerId({ career_id: "c-1" })).toBe("c-1");
    expect(resolveConvenioCareerId({ profiles: { career_id: "c-2" } })).toBe("c-2");
    expect(resolveConvenioCareerId({})).toBeNull();

    expect(canonicalConvenioTypeOfRow({ convenio_types: { name: "Adenda" } })).toBe("Adenda");
    expect(canonicalConvenioTypeOfRow({ convenio_type_id: 6 })).toBe("Adenda");
    expect(canonicalConvenioTypeOfRow({})).toBe("Sin tipo");
  });
});