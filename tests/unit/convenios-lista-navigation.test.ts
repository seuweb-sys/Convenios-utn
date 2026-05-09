import { describe, expect, it } from "vitest";

import { buildConveniosListaHref } from "@/app/protected/convenios-lista/navigation";

describe("convenios lista navigation helpers", () => {
  it("resets to the first page when a search query is submitted", () => {
    const href = buildConveniosListaHref({
      pathname: "/protected/convenios-lista",
      currentSearch: "page=4&status=approved",
      updates: { q: " UTN " },
    });

    expect(href).toBe("/protected/convenios-lista?page=1&status=approved&q=UTN");
  });

  it("keeps existing filters while moving between bounded result pages", () => {
    const href = buildConveniosListaHref({
      pathname: "/protected/convenios-lista",
      currentSearch: "q=UTN&status=pending&page=1",
      updates: { page: "2" },
      resetPage: false,
    });

    expect(href).toBe("/protected/convenios-lista?q=UTN&status=pending&page=2");
  });

  it("removes empty search values and all-filters instead of serializing them", () => {
    const href = buildConveniosListaHref({
      pathname: "/protected/convenios-lista",
      currentSearch: "q=UTN&page=3&type=all",
      updates: { q: "   ", type: "all" },
    });

    expect(href).toBe("/protected/convenios-lista?page=1");
  });
});
