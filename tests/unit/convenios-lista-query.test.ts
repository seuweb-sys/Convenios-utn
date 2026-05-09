import { describe, expect, it } from "vitest";

import {
  buildConveniosListaQueryParams,
  buildConveniosSearchFilter,
  CONVENIOS_LISTA_PAGE_SIZE,
} from "@/app/protected/convenios-lista/query-params";

describe("convenios lista URL query helpers", () => {
  it("normalizes empty search with a bounded range", () => {
    const params = buildConveniosListaQueryParams({ q: "", page: "3" });

    expect(params).toEqual({
      q: "",
      page: 3,
      pageSize: CONVENIOS_LISTA_PAGE_SIZE,
      from: 20,
      to: 29,
      status: null,
      type: null,
      career: null,
      secretariat: null,
    });
  });

  it("clamps invalid pages and computes the server-side range", () => {
    expect(buildConveniosListaQueryParams({ page: "abc" }).from).toBe(0);
    expect(buildConveniosListaQueryParams({ page: "0" }).page).toBe(1);
    expect(buildConveniosListaQueryParams({ page: "2" })).toMatchObject({
      page: 2,
      from: 10,
      to: 19,
    });
  });

  it("builds an admin-like OR search filter for convenio fields", () => {
    expect(buildConveniosSearchFilter("  UTN SA  ")).toBe(
      "title.ilike.%UTN SA%,serial_number.ilike.%UTN SA%,status.ilike.%UTN SA%"
    );
    expect(buildConveniosSearchFilter("   ")).toBeNull();
  });
});
