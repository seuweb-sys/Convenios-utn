import { describe, expect, it } from "vitest";

import {
  buildConveniosApiPagination,
  shouldUseLegacyFullResponse,
} from "@/app/api/convenios/query-params";

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
