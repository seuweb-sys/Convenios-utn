export type AdminDirectEditContext = {
  source: "admin_direct";
  approved_reset_confirmed?: boolean;
};

export function isApprovedConvenioStatus(status?: string | null) {
  return status === "aprobado" || status === "aceptado";
}

export function buildAdminEditHref(convenioId: string) {
  return `/protected/convenio-detalle/${convenioId}?mode=correccion&origin=admin-edit`;
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
