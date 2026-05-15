export type ApiActivityType = "info" | "success" | "warning" | "error";

export interface ActivityApiData {
  title: string;
  description: string;
  time: string;
  type: ApiActivityType;
  iconName: string;
}

type ActivityLogLike = {
  action: string;
  status_from: string | null;
  status_to: string | null;
  created_at: string;
};

type ConvenioLike = {
  title?: string | null;
  serial_number?: string | null;
};

type ProfileLike = {
  full_name?: string | null;
};

export function formatActivityEntry(
  activity: ActivityLogLike,
  convenio?: ConvenioLike | null,
  profile?: ProfileLike | null,
): ActivityApiData {
  let type: ApiActivityType = "info";
  let iconName = "file";
  let title = "Actividad en convenio";
  let description = "";

  const convenioTitle = convenio?.title || "Convenio";
  const convenioSerial = convenio?.serial_number || "Sin número";
  const userName = profile?.full_name || "Usuario";

  switch (activity.action) {
    case "create":
      title = "Nuevo convenio creado";
      description = `Se ha creado el convenio "${convenioTitle}" (N° ${convenioSerial})`;
      iconName = "file-plus";
      break;
    case "update":
      title = "Convenio actualizado";
      description = `Se han realizado cambios en "${convenioTitle}" (N° ${convenioSerial})`;
      iconName = "edit";
      break;
    case "status_change":
      if (activity.status_to === "aprobado") {
        type = "success";
        iconName = "check";
        title = "Convenio aprobado";
        description = `El convenio "${convenioTitle}" ha sido aprobado`;
      } else if (activity.status_to === "rechazado") {
        type = "error";
        iconName = "alert-circle";
        title = "Convenio rechazado";
        description = `El convenio "${convenioTitle}" ha sido rechazado`;
      } else if (activity.status_to === "revision") {
        title = "Convenio enviado a revisión";
        description = `El convenio "${convenioTitle}" está siendo revisado`;
        iconName = "clock";
      } else if (activity.status_to === "finalizado") {
        type = "success";
        iconName = "check";
        title = "Convenio finalizado";
        description = `El convenio "${convenioTitle}" ha sido finalizado`;
      }
      break;
    case "resubmit_convenio":
      title = "Convenio reenviado";
      description = `Se reenviaron las correcciones de "${convenioTitle}" (N° ${convenioSerial})`;
      iconName = "refresh-ccw";
      break;
    case "update_status":
      title = "Estado actualizado";
      description = `El convenio "${convenioTitle}" cambió de ${activity.status_from || "-"} a ${activity.status_to}`;
      iconName = "arrow-right-left";
      break;
    case "admin_direct_edit_regenerated":
      title = "Convenio regenerado por edición administrativa";
      description = `${userName} editó "${convenioTitle}" (N° ${convenioSerial}), regeneró el documento y lo devolvió a ${activity.status_to || "enviado"}`;
      iconName = "file-pen-line";
      type = "warning";
      break;
    default:
      description = `Ha ocurrido una actividad en "${convenioTitle}" (N° ${convenioSerial})`;
      iconName = "info";
      break;
  }

  return {
    title,
    description,
    time: formatRelativeTime(activity.created_at),
    type,
    iconName,
  };
}

function formatRelativeTime(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return "Ahora";
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (diffMinutes < 1) return "Ahora";
  if (diffMinutes === 1) return "Hace 1 minuto";
  if (diffMinutes < 60) return `Hace ${diffMinutes} minutos`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours === 1) return "Hace 1 hora";
  if (diffHours < 24) return `Hace ${diffHours} horas`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "Hace 1 día";
  return `Hace ${diffDays} días`;
}
