import { describe, expect, it } from "vitest";

import {
  buildConveniosApiPagination,
  shouldUseLegacyFullResponse,
} from "@/app/api/convenios/query-params";
import {
  canonicalConvenioTypeName,
  resolveConvenioTypeIdByAlias,
} from "@/app/lib/convenios/type-normalization";

describe("convenios API query params", () => {
  it("defaults to bounded first-page results for q searches", () => {
    const params = new URLSearchParams("q=empresa&page=1");

    expect(buildConveniosApiPagination(params)).toEqual({
      q: "empresa",
      limit: 10,
      offset: 0,
      from: 0,
      to: 9,
    });
  });

  it("keeps explicit limit/offset support without allowing unbounded requests", () => {
    const params = new URLSearchParams("limit=5&offset=15");

    expect(buildConveniosApiPagination(params)).toMatchObject({
      limit: 5,
      offset: 15,
      from: 15,
      to: 19,
    });
  });

  it("preserves full=true compatibility", () => {
    expect(shouldUseLegacyFullResponse(new URLSearchParams("full=true"))).toBe(true);
    expect(shouldUseLegacyFullResponse(new URLSearchParams("full=false"))).toBe(false);
  });
});

describe("convenios API Marco PPS alias-to-id filtering", () => {
  it("resolves accented Marco PPS display name to type 5", () => {
    expect(resolveConvenioTypeIdByAlias("Convenio Marco Práctica Supervisada")).toBe(5);
  });

  it("resolves raw unaccented DB name 'Convenio Marco Practica Supervisada' to type 5", () => {
    // Reproduces the bug: DB stores the unaccented spelling, so exact-name
    // filters must collapse to convenio_type_id = 5 instead of being dropped.
    expect(resolveConvenioTypeIdByAlias("Convenio Marco Practica Supervisada")).toBe(5);
  });

  it("returns the canonical accented display name for type 5 regardless of raw spelling", () => {
    expect(canonicalConvenioTypeName(5, "Convenio Marco Practica Supervisada")).toBe(
      "Convenio Marco Práctica Supervisada"
    );
    expect(canonicalConvenioTypeName(5, "Convenio Marco Práctica Supervisada")).toBe(
      "Convenio Marco Práctica Supervisada"
    );
    expect(canonicalConvenioTypeName(5)).toBe("Convenio Marco Práctica Supervisada");
  });

  it("resolves Particular de Práctica Supervisada aliases to type 1", () => {
    expect(resolveConvenioTypeIdByAlias("Convenio Particular de Práctica Supervisada")).toBe(1);
    expect(resolveConvenioTypeIdByAlias("Convenio Particular de Practica Supervisada")).toBe(1);
  });

  it("falls back to null for an unknown alias", () => {
    expect(resolveConvenioTypeIdByAlias("Tipo Inexistente")).toBeNull();
  });
});
