export const CONVENIOS_API_DEFAULT_LIMIT = 10;

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function shouldUseLegacyFullResponse(searchParams: URLSearchParams) {
  return searchParams.get("full") === "true";
}

export function buildConveniosApiPagination(searchParams: URLSearchParams) {
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = parsePositiveInt(searchParams.get("limit"), CONVENIOS_API_DEFAULT_LIMIT);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const explicitOffset = searchParams.get("offset");
  const offset = parseNonNegativeInt(explicitOffset, (page - 1) * limit);

  return {
    q,
    limit,
    offset,
    from: offset,
    to: offset + limit - 1,
  };
}

export function buildConveniosApiSearchFilter(query: string) {
  const q = query.trim();
  if (!q) return null;

  return ["title", "serial_number", "status"]
    .map((column) => `${column}.ilike.%${q}%`)
    .join(",");
}
