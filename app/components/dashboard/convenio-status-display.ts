/**
 * Dashboard convenio status display descriptor.
 *
 * Pure data/helper module shared by `ConvenioItem` and the unit regression
 * suite so the supported status set has a single source of truth.
 *
 * The legacy `revision_modificacion` status (written only by the removed
 * uploader-initiated "Solicitar Modificación" path) is intentionally NOT part
 * of the supported set: the admin correction flow keeps supported convenios in
 * `revision`, so the dashboard never needs a `revision_modificacion` badge.
 */

export type ConvenioStatus =
  | "enviado"
  | "aprobado"
  | "rechazado"
  | "pendiente"
  | "borrador";

export type ConvenioStatusIconKind =
  | "clock"
  | "check"
  | "alert"
  | "file";

export interface ConvenioStatusDisplay {
  /** Tailwind color/border classes for the status badge. */
  color: string;
  /** Neutral Spanish label shown to users. */
  label: string;
  /** Stable icon kind the component maps to a lucide-react icon. */
  icon: ConvenioStatusIconKind;
}

const CONVENIO_STATUS_DISPLAY: Record<ConvenioStatus, ConvenioStatusDisplay> = {
  enviado: {
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    label: "Enviado",
    icon: "clock",
  },
  pendiente: {
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    label: "Pendiente",
    icon: "clock",
  },
  aprobado: {
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    label: "Aprobado",
    icon: "check",
  },
  rechazado: {
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    label: "Rechazado",
    icon: "alert",
  },
  borrador: {
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    label: "Borrador",
    icon: "file",
  },
};

export function resolveConvenioStatusDisplay(
  status: ConvenioStatus,
): ConvenioStatusDisplay {
  return CONVENIO_STATUS_DISPLAY[status];
}

export const CONVENIO_STATUSES = Object.keys(
  CONVENIO_STATUS_DISPLAY,
) as ConvenioStatus[];