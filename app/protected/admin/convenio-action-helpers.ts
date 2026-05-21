import { buildAdminEditHref, isApprovedConvenioStatus } from "@/app/lib/convenio-editing";

type AdminActionSource = {
  id: string;
  status: string;
  convenioTypeId?: number | null;
  documentPath?: string | null;
  signedPdfPath?: string | null;
};

export type AdminActionItem = {
  key: string;
  label: string;
  href?: string;
};

export { buildAdminEditHref };

export function getAdminActionItems(convenio: AdminActionSource): AdminActionItem[] {
  const isApproved = isApprovedConvenioStatus(convenio.status);
  const items: AdminActionItem[] = [
    {
      key: "edit",
      label: "Editar convenio",
      href: buildAdminEditHref(convenio.id, convenio.convenioTypeId),
    },
  ];

  if (!isApproved) {
    items.push(
      { key: "approve", label: "Aprobar" },
      { key: "reject", label: "Rechazar" },
      { key: "correct", label: "Solicitar corrección" },
    );

    return items;
  }

  items.push({
    key: "signed-pdf",
    label: convenio.signedPdfPath ? "Reemplazar PDF firmado" : "Subir PDF firmado",
  });

  if (convenio.signedPdfPath) {
    items.push({ key: "view-signed-pdf", label: "Ver PDF firmado" });
  }

  if (convenio.documentPath) {
    items.push({ key: "view-original", label: "Ver documento original" });
  }

  return items;
}
