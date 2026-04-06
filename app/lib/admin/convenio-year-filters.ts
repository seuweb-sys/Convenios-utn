/** Año calendario local de `created_at` (alta en el sistema). */
export function getUploadYearLocal(c: { created_at?: string | null }): number | null {
  if (!c?.created_at) return null;
  const y = new Date(c.created_at).getFullYear();
  return Number.isNaN(y) ? null : y;
}

/** null en el filtro = sin filtrar; "none" = solo `agreement_year` ausente. */
export type AgreementYearFilterValue = number | null | "none";

export function passesConvenioYearFilters(
  c: { created_at?: string | null; agreement_year?: number | null },
  uploadYearFilter: number | null,
  agreementYearFilter: AgreementYearFilterValue
): boolean {
  if (uploadYearFilter !== null) {
    const uy = getUploadYearLocal(c);
    if (uy !== uploadYearFilter) return false;
  }
  if (agreementYearFilter === null) return true;
  if (agreementYearFilter === "none") return c.agreement_year == null;
  return c.agreement_year === agreementYearFilter;
}
