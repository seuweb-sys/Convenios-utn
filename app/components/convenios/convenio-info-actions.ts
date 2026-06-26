/**
 * Uploader-facing action availability for the read-only convenio detail view.
 *
 * The unsupported uploader-initiated "Solicitar Modificación" path that moved
 * approved convenios into the orphan `revision_modificacion` status was removed.
 * Correction requests are admin-initiated only (admin actions -> observaciones
 * -> notify -> correction link -> PATCH /api/convenios/[id]). Keep the decision
 * in a pure function so the detail UI and tests share a single source of truth.
 */

export interface ConvenioActions {
  /** Continue editing a draft convenio. */
  canEdit: boolean;
  /** Uploader self-service modification trigger. ALWAYS false now (removed). */
  canRequestModification: boolean;
}

export function resolveConvenioActions(status: string): ConvenioActions {
  if (status === "borrador") {
    return { canEdit: true, canRequestModification: false };
  }

  return { canEdit: false, canRequestModification: false };
}