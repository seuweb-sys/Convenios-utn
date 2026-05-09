export type ConveniosListaHrefInput = {
  pathname: string;
  currentSearch: string;
  updates: Record<string, string | null>;
  resetPage?: boolean;
};

export function buildConveniosListaHref({
  pathname,
  currentSearch,
  updates,
  resetPage = true,
}: ConveniosListaHrefInput) {
  const params = new URLSearchParams(currentSearch);

  for (const [key, value] of Object.entries(updates)) {
    const normalizedValue = value?.trim() ?? "";
    if (!normalizedValue || normalizedValue === "all") params.delete(key);
    else params.set(key, normalizedValue);
  }

  if (resetPage) params.set("page", "1");

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
