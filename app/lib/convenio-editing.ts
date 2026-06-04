export type AdminDirectEditContext = {
  source: "admin_direct";
  approved_reset_confirmed?: boolean;
};

export type ConvenioFormSlug =
  | "particular"
  | "marco"
  | "acuerdo"
  | "especifico"
  | "practica-marco"
  | "adenda";

const CONVENIO_TYPE_SLUGS: Record<number, ConvenioFormSlug> = {
  1: "particular",
  2: "marco",
  3: "acuerdo",
  4: "especifico",
  5: "practica-marco",
  6: "adenda",
};

export function getConvenioFormSlugByTypeId(typeId?: number | string | null) {
  if (typeId == null || typeId === "") return null;
  const numericTypeId = typeof typeId === "number" ? typeId : Number.parseInt(String(typeId), 10);
  if (Number.isNaN(numericTypeId)) return null;
  return CONVENIO_TYPE_SLUGS[numericTypeId] ?? null;
}

export function isApprovedConvenioStatus(status?: string | null) {
  return status === "aprobado" || status === "aceptado";
}

export function buildAdminEditHref(convenioId: string, convenioTypeId?: number | string | null) {
  const params = new URLSearchParams({ mode: "correccion", origin: "admin-edit" });
  const slug = getConvenioFormSlugByTypeId(convenioTypeId);
  if (slug) params.set("type", slug);
  return `/protected/convenio-detalle/${convenioId}?${params.toString()}`;
}

export function requiresAdminEditConfirmation(origin: string | null | undefined, status?: string | null) {
  return origin === "admin-edit" && isApprovedConvenioStatus(status);
}

export function buildAdminDirectEditContext(
  origin: string | null | undefined,
  status?: string | null,
): AdminDirectEditContext | undefined {
  if (origin !== "admin-edit") {
    return undefined;
  }

  return {
    source: "admin_direct",
    ...(isApprovedConvenioStatus(status) ? { approved_reset_confirmed: true } : {}),
  };
}

export function isAdminDirectEditRequest(
  userRole: string,
  currentStatus: string | null | undefined,
  requestedStatus: string | null | undefined,
  editContext: AdminDirectEditContext | null | undefined,
) {
  return userRole === "admin" && requestedStatus === "enviado" && editContext?.source === "admin_direct";
}
