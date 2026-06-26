import { describe, expect, it } from "vitest";
import {
  canonicalConvenioTypeName,
  resolveConvenioTypeIdByAlias,
  CONVENIO_TYPE_CATALOG,
} from "@/app/lib/convenios/type-normalization";

describe("convenio type normalization", () => {
  it("covers every type id in the catalog", () => {
    expect(CONVENIO_TYPE_CATALOG.map((r) => r.id).sort((a, b) => a - b)).toEqual(
      [1, 2, 3, 4, 5, 6]
    );
  });

  it("canonicalConvenioTypeName returns accented display name for known ids", () => {
    expect(canonicalConvenioTypeName(5)).toBe("Convenio Marco Práctica Supervisada");
    expect(canonicalConvenioTypeName(1)).toBe("Convenio Particular de Práctica Supervisada");
    expect(canonicalConvenioTypeName(2)).toBe("Convenio Marco");
  });

  it("canonicalConvenioTypeName preserves fallback DB name for unknown id", () => {
    expect(canonicalConvenioTypeName(99, "Tipo Custom")).toBe("Tipo Custom");
    expect(canonicalConvenioTypeName(null, "Algo")).toBe("Algo");
    expect(canonicalConvenioTypeName(undefined)).toBe("Sin tipo");
  });

  it("resolveConvenioTypeIdByAlias treats lowercase and trailing whitespace as equivalent", () => {
    expect(
      resolveConvenioTypeIdByAlias("  CONVENIO MARCO PRÁCTICA SUPERVISADA  ")
    ).toBe(5);
  });

  it("resolveConvenioTypeIdByAlias returns null for empty/unknown input", () => {
    expect(resolveConvenioTypeIdByAlias("")).toBeNull();
    expect(resolveConvenioTypeIdByAlias("Desconocido Total")).toBeNull();
  });

  it("collapses accented and unaccented Marco PPS aliases to type 5", () => {
    expect(resolveConvenioTypeIdByAlias("Convenio Marco Práctica Supervisada")).toBe(5);
    expect(resolveConvenioTypeIdByAlias("Convenio Marco Practica Supervisada")).toBe(5);
  });

  it("collapses accented and unaccented Particular PPS aliases to type 1", () => {
    expect(resolveConvenioTypeIdByAlias("Convenio Particular de Práctica Supervisada")).toBe(1);
    expect(resolveConvenioTypeIdByAlias("Convenio Particular de Practica Supervisada")).toBe(1);
  });

  it("resolves Acuerdo de Colaboración alternative spellings to type 3", () => {
    expect(resolveConvenioTypeIdByAlias("Acuerdo de Colaboracion")).toBe(3);
    expect(resolveConvenioTypeIdByAlias("Acuerdo de Colaboración")).toBe(3);
  });

  it("resolves Adenda / addenda alias to type 6", () => {
    expect(resolveConvenioTypeIdByAlias("Adenda")).toBe(6);
    expect(resolveConvenioTypeIdByAlias("addenda")).toBe(6);
  });
});