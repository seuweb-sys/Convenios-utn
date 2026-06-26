/**
 * Single canonical map for convenio type display names, raw aliases, and
 * type-id lookup. Consumed by API routes and UI surfaces so raw accented vs
 * unaccented spellings (e.g. "Convenio Marco Práctica Supervisada" vs the
 * unaccented DB storage variant) collapse to one canonical key and to the
 * same `convenio_type_id`.
 */

export interface ConvenioTypeRecord {
  id: number;
  /** Canonical accented display name used across UI/API responses. */
  canonicalName: string;
  /** Raw/alternative spellings that must collapse to this type id. */
  aliases: string[];
}

/* Canonical id -> type record order mirrors the existing fallback map in
 * `app/api/convenios/route.ts` and `app/lib/dashboard/get-convenio-types.ts`
 * so consumers preserve previously-rendered titles. */
export const CONVENIO_TYPE_CATALOG: ReadonlyArray<ConvenioTypeRecord> = [
  {
    id: 2,
    canonicalName: "Convenio Marco",
    aliases: ["convenio marco"],
  },
  {
    id: 5,
    canonicalName: "Convenio Marco Práctica Supervisada",
    aliases: [
      "convenio marco práctica supervisada",
      "convenio marco practica supervisada",
    ],
  },
  {
    id: 4,
    canonicalName: "Convenio Específico",
    aliases: [
      "convenio específico",
      "convenio especifico",
    ],
  },
  {
    id: 1,
    canonicalName: "Convenio Particular de Práctica Supervisada",
    aliases: [
      "convenio particular de práctica supervisada",
      "convenio particular de practica supervisada",
    ],
  },
  {
    id: 3,
    canonicalName: "Acuerdo de Colaboración",
    aliases: [
      "acuerdo de colaboración",
      "acuerdo de colaboracion",
    ],
  },
  {
    id: 6,
    canonicalName: "Adenda",
    aliases: ["adenda", "addenda"],
  },
];

/** Build a normalized lowercase + accent-stripped key for alias matching. */
function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

const aliasLookup: Map<string, number> = new Map();
const idLookup: Map<number, ConvenioTypeRecord> = new Map();

for (const record of CONVENIO_TYPE_CATALOG) {
  idLookup.set(record.id, record);
  // Canonical name also maps to the id.
  aliasLookup.set(normalizeKey(record.canonicalName), record.id);
  for (const alias of record.aliases) {
    aliasLookup.set(normalizeKey(alias), record.id);
  }
}

/**
 * Resolves a raw display/DB name (accented or unaccented) to its canonical
 * `convenio_type_id`. Returns null when the name does not match any known
 * alias, so callers can keep raw-name behaviour for truly unknown types.
 */
export function resolveConvenioTypeIdByAlias(rawName: string): number | null {
  if (!rawName) return null;
  const key = normalizeKey(rawName);
  return aliasLookup.get(key) ?? null;
}

/**
 * Returns the canonical accented display name for a given type id. When the id
 * is unknown but a `fallbackDbName` is supplied, the DB name is preserved so
 * non-canonical rows are not silently re-labeled.
 */
export function canonicalConvenioTypeName(
  typeId: number | null | undefined,
  fallbackDbName?: string
): string {
  if (typeId != null && idLookup.has(typeId)) {
    return idLookup.get(typeId)!.canonicalName;
  }
  return fallbackDbName || "Sin tipo";
}