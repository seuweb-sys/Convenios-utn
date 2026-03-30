/** Grupos de investigación (CyT): mostrar código (tag) y nombre completo. */
const CYT_GROUP = "cyt_group";

export type OrgUnitLike = {
  name: string;
  code?: string | null;
  unit_type?: string | null;
};

export function formatOrgUnitLabel(unit: OrgUnitLike): string {
  const code = unit.code?.trim();
  if (unit.unit_type === CYT_GROUP && code) {
    return `${code} - ${unit.name}`;
  }
  return unit.name;
}
