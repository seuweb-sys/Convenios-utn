import {
  validateMembershipScopeRule,
  type MembershipRole,
} from "@/app/lib/authz/scope-rules";

/**
 * Helper text shown in the membership form. Explains that cumulative roles
 * (e.g. secretario AND director/profesor) must be created as separate rows so
 * the role/scope invariants stay unambiguous for RLS and server validation.
 */
export const MEMBERSHIP_HELPER_TEXT =
  "Si una persona es secretario y también director o profesor, creá membresías separadas, una por cada rol.";

export interface MembershipRoleControls {
  /** Whether the career select should be disabled for this role. */
  careerDisabled: boolean;
  /** Whether the career select must be filled before submitting. */
  careerRequired: boolean;
  /** Whether the org unit (subárea) select should be disabled for this role. */
  orgUnitDisabled: boolean;
  /** Whether the secretariat select must be filled before submitting. */
  secretariatRequired: boolean;
  /** Whether the secretariat is locked to SA for this role. */
  secretariatLockedToSA: boolean;
  /** Contextual helper text for the active role. */
  helperText: string;
}

/**
 * Returns the rule-aware control state for a membership role, optionally aware
 * of the selected secretariat code. Pure function: (role, secretariat) ->
 * immutable controls, easy to unit test and reuse from the React component
 * without DOM coupling.
 *
 * Secretariat awareness mirrors the DB/server invariants:
 * - `director`/`profesor` are SA-only, require a career, and never carry an
 *   org unit -> `orgUnitDisabled` is true.
 * - `secretario` is secretariat-wide: no career, no org unit -> both disabled.
 * - `miembro` under CYT/SEU never carries a career -> career disabled; the org
 *   unit stays enabled (CYT/SEU miembro is org-unit-scoped). SA miembro keeps
 *   the legacy optional career/org-unit flow.
 */
export function resolveRoleControls(
  role: MembershipRole,
  secretariatCode?: string | null,
): MembershipRoleControls {
  if (role === "secretario") {
    return {
      careerDisabled: true,
      careerRequired: false,
      orgUnitDisabled: true,
      secretariatRequired: true,
      secretariatLockedToSA: false,
      helperText: "El secretario es de secretaría y no admite carrera ni subárea.",
    };
  }

  if (role === "director" || role === "profesor") {
    return {
      careerDisabled: false,
      careerRequired: true,
      // Director/profesor are always career-scoped (SA); they never use org units.
      orgUnitDisabled: true,
      secretariatRequired: true,
      secretariatLockedToSA: true,
      helperText: MEMBERSHIP_HELPER_TEXT,
    };
  }

  // miembro (and any future default). Career is rejected for CYT/SEU by the
  // DB invariant; the form disables it so the admin cannot select one. SA
  // miembro keeps the legacy optional career flow. Org unit stays enabled for
  // every miembro path (CYT/SEU miembro is org-unit-scoped; SA miembro optional).
  const cytSeuMiembroCareerDisabled =
    secretariatCode === "CYT" || secretariatCode === "SEU";

  return {
    careerDisabled: cytSeuMiembroCareerDisabled,
    careerRequired: false,
    orgUnitDisabled: false,
    secretariatRequired: false,
    secretariatLockedToSA: false,
    helperText: cytSeuMiembroCareerDisabled
      ? "Las membresías CYT/SEU no admiten carrera."
      : "",
  };
}

/**
 * Returns the secretariat value the form should display. For director/profesor
 * the secretariat is locked to SA: any other selected secretariat is overridden
 * to SA, and when SA is not yet available the current selection is preserved so
 * the admin keeps a usable form while catalog data loads.
 */
export function resolveEnforcedSecretariat(input: {
  role: MembershipRole;
  saSecretariatId: string | null;
  currentSecretariatId: string;
}): string {
  if (input.role === "director" || input.role === "profesor") {
    if (input.saSecretariatId) return input.saSecretariatId;
  }
  return input.currentSecretariatId;
}

/**
 * Returns the career value to keep after the role/secretariat changes.
 * Deterministic clearing rules mirror the DB/server invariants:
 * - secretario never carries a career -> cleared.
 * - CYT/SEU miembro never carries a career -> cleared.
 * - director/profesor and SA miembro keep the current value so the admin can
 *   confirm or adjust it.
 *
 * `secretariatCode` is optional so existing role-only callers keep working.
 */
export function resolveCareerAfterRoleChange(input: {
  role: MembershipRole;
  currentCareerId: string;
  secretariatCode?: string | null;
}): string {
  if (input.role === "secretario") return "";
  if (
    input.role === "miembro" &&
    (input.secretariatCode === "CYT" || input.secretariatCode === "SEU")
  ) {
    return "";
  }
  return input.currentCareerId;
}

/**
 * Returns the org unit value to keep after the role changes. Secretario,
 * director, and profesor never carry an org unit -> cleared. miembro keeps it
 * (CYT/SEU miembro is org-unit-scoped; SA miembro optional).
 */
export function resolveOrgUnitAfterRoleChange(input: {
  role: MembershipRole;
  currentOrgUnitId: string;
}): string {
  if (input.role === "secretario" || input.role === "director" || input.role === "profesor") {
    return "";
  }
  return input.currentOrgUnitId;
}

/** UI-only client-side guard code emitted when the shared validator cannot run
 * because the required secretariat has not been selected yet. */
export type MembershipUiRuleCode = "MEMBERSHIP_SECRETARIAT_REQUIRED";

export interface MembershipSubmitValidation {
  canSubmit: boolean;
  code: string | null;
  error: string | null;
}

/**
 * Mirror of the server MembershipRuleCode validation, run client-side so the
 * submit button can be disabled and a friendly message shown before the request
 * is sent. Delegates to the shared authz validator for the backend-known codes.
 */
export function resolveSubmitValidation(input: {
  role: MembershipRole;
  secretariatId: string;
  secretariatCode: string | null;
  careerId: string | null;
  orgUnitId?: string | null;
}): MembershipSubmitValidation {
  if (input.role === "secretario" && !input.secretariatId) {
    return {
      canSubmit: false,
      code: "MEMBERSHIP_SECRETARIAT_REQUIRED",
      error: "La membresía secretario requiere secretaría",
    };
  }

  if (input.role === "director" || input.role === "profesor") {
    if (!input.secretariatId) {
      return {
        canSubmit: false,
        code: "MEMBERSHIP_SECRETARIAT_REQUIRED",
        error: "La membresía director/profesor requiere secretaría SA",
      };
    }
    }

  // Delegates to the shared authz validator: it returns the backend-known rule
  // codes (DIRECTOR_PROFESOR_REQUIRE_SA / DIRECTOR_PROFESOR_REQUIRE_CAREER /
  // SECRETARIO_REQUIRES_NULL_CAREER / SECRETARIO_REQUIRES_NULL_ORG_UNIT /
  // CYT_SEU_REQUIRE_NULL_CAREER) so the UI mirrors the server contract, with
  // the same deterministic priority as the API route.
  const result = validateMembershipScopeRule({
    membership_role: input.role,
    secretariatCode: input.secretariatCode,
    career_id: input.careerId,
    org_unit_id: input.orgUnitId ?? null,
  });

  if (!result.valid) {
    return { canSubmit: false, code: result.code, error: result.error };
  }

  return { canSubmit: true, code: null, error: null };
}

/**
 * Maps a backend rule code (or the delete last-active-admin guard code) to a
 * user-facing Spanish message. Returns null for unknown codes so the caller can
 * fall back to the raw server error text.
 */
export function resolveMembershipRuleMessage(code: string | null | undefined): string | null {
  switch (code) {
    case "SECRETARIO_REQUIRES_NULL_CAREER":
      return "La membresía secretario no admite carrera.";
    case "SECRETARIO_REQUIRES_NULL_ORG_UNIT":
      return "La membresía secretario no admite subárea.";
    case "CYT_SEU_REQUIRE_NULL_CAREER":
      return "Las membresías CYT/SEU no admiten carrera.";
    case "DIRECTOR_PROFESOR_REQUIRE_SA":
      return "Las membresías director/profesor solo pueden pertenecer a SA.";
    case "DIRECTOR_PROFESOR_REQUIRE_CAREER":
      return "Las membresías director/profesor requieren carrera.";
    case "LAST_ACTIVE_ADMIN_MEMBERSHIP":
      return "No se puede eliminar la última membresía activa de un administrador.";
    case "MEMBERSHIP_SECRETARIAT_REQUIRED":
      return "La membresía requiere secretaría.";
    default:
      return null;
  }
}