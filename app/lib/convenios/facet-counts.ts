/**
 * Pure facet-count helpers for the convenios sidebar filters.
 *
 * The list route paginates rows (`.range()`) but the sidebar counters must
 * reflect the full filtered set the current user can see, not just the
 * current page slice. The server runs a second, unpaginated query and builds
 * these counts with `buildConvenioFacetCounts`; `AdminFilters` prefers the
 * precomputed counts when supplied and falls back to deriving them from the
 * (page-sliced) `data` for legacy call sites.
 *
 * Type canonicalization mirrors `AdminFilters.canonicalTypeOf` so accented /
 * unaccented DB spellings collapse to a single canonical key, and rows whose
 * type cannot be resolved are excluded from `byType` (matching the legacy UI,
 * which filters `Sin tipo` out of `availableTypes`).
 */

import {
  canonicalConvenioTypeName,
  resolveConvenioTypeIdByAlias,
} from "./type-normalization";

export interface ConvenioFacetCounts {
  /** Raw `status` -> count. */
  byStatus: Record<string, number>;
  /** Canonical type display name -> count. `Sin tipo` rows are excluded. */
  byType: Record<string, number>;
  /** `secretariat_id` -> count. Null/empty ids are skipped. */
  bySecretariat: Record<string, number>;
  /** `career_id` (row's or joined profile's) -> count. Null/empty ids are skipped. */
  byCareer: Record<string, number>;
}

const UNKNOWN_TYPE_KEY = "Sin tipo";

/**
 * Resolve a convenio row to its canonical type display name. Mirrors
 * `AdminFilters.canonicalTypeOf` (name-based resolution through aliases) and
 * additionally falls back to `convenio_type_id` when the joined name is
 * unavailable, so the helper works with the minimal counts query.
 */
export function canonicalConvenioTypeOfRow(row: any): string {
  const rawName = row?.convenio_types?.name;
  if (typeof rawName === "string") {
    const typeId = resolveConvenioTypeIdByAlias(rawName);
    return canonicalConvenioTypeName(typeId, rawName);
  }
  const typeId = row?.convenio_type_id;
  if (typeof typeId === "number" && Number.isFinite(typeId)) {
    return canonicalConvenioTypeName(typeId);
  }
  return UNKNOWN_TYPE_KEY;
}

/**
 * Resolve the effective `career_id` for a row, matching `AdminFilters`
 * `getCareerCount`: prefer the row's own `career_id`, fall back to the joined
 * profile's `career_id`.
 */
export function resolveConvenioCareerId(row: any): string | null {
  const own = row?.career_id;
  if (typeof own === "string" && own.length > 0) return own;
  const fromProfile = row?.profiles?.career_id;
  if (typeof fromProfile === "string" && fromProfile.length > 0) return fromProfile;
  return null;
}

function bump(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

export function buildConvenioFacetCounts(rows: any[] | null | undefined): ConvenioFacetCounts {
  const counts: ConvenioFacetCounts = {
    byStatus: {},
    byType: {},
    bySecretariat: {},
    byCareer: {},
  };

  if (!Array.isArray(rows)) return counts;

  for (const item of rows) {
    const row = item as any;

    if (typeof row?.status === "string" && row.status.length > 0) {
      bump(counts.byStatus, row.status);
    }

    const typeKey = canonicalConvenioTypeOfRow(row);
    if (typeKey !== UNKNOWN_TYPE_KEY) {
      bump(counts.byType, typeKey);
    }

    const secretariatId = row?.secretariat_id;
    if (typeof secretariatId === "string" && secretariatId.length > 0) {
      bump(counts.bySecretariat, secretariatId);
    }

    const careerId = resolveConvenioCareerId(row);
    if (careerId) {
      bump(counts.byCareer, careerId);
    }
  }

  return counts;
}