export const CONVENIOS_LISTA_PAGE_SIZE = 10;

export type ConveniosListaQueryParamsInput = {
  q?: string | string[];
  page?: string | string[];
  status?: string | string[];
  type?: string | string[];
  career?: string | string[];
  secretariat?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizedFilter(value: string | string[] | undefined) {
  const param = firstParam(value)?.trim();
  if (!param || param === "all") return null;
  return param;
}

export function buildConveniosSearchFilter(query: string) {
  const q = query.trim();
  if (!q) return null;

  return ["title", "serial_number", "status"]
    .map((column) => `${column}.ilike.%${q}%`)
    .join(",");
}

export function buildConveniosListaQueryParams(input: ConveniosListaQueryParamsInput) {
  const q = firstParam(input.q)?.trim() ?? "";
  const parsedPage = Number.parseInt(firstParam(input.page) ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const from = (page - 1) * CONVENIOS_LISTA_PAGE_SIZE;

  return {
    q,
    page,
    pageSize: CONVENIOS_LISTA_PAGE_SIZE,
    from,
    to: from + CONVENIOS_LISTA_PAGE_SIZE - 1,
    status: normalizedFilter(input.status),
    type: normalizedFilter(input.type),
    career: normalizedFilter(input.career),
    secretariat: normalizedFilter(input.secretariat),
  };
}
