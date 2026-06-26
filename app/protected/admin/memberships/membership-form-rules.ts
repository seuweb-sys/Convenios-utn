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
  /** Whether the secretariat select must be filled before submitting. */
  secretariatRequired: boolean;
  /** Whether the secretariat is locked to SA for this role. */
  secretariatLockedToSA: boolean;
  /** Contextual helper text for the active role. */
  helperText: string;
}

/**
 * Returns the rule-aware control state for a membership role. Pure function:
 * input role -> immutable controls, easy to unit test and reuse from the React
 * component without DOM coupling.
 */
export function resolveRoleControls(role: MembershipRole): MembershipRoleControls {
  if (role === "secretario") {
    return {
      careerDisabled: true,
      careerRequired: false,
      secretariatRequired: true,
      secretariatLockedToSA: false,
      helperText: "El secretario es de secretaría y no admite carrera.",
    };
  }

  if (role === "director" || role === "profesor") {
    return {
      careerDisabled: false,
      careerRequired: true,
      secretariatRequired: true,
      secretariatLockedToSA: true,
      helperText: MEMBERSHIP_HELPER_TEXT,
    };
  }

  // miembro (and any future default) preserves the legacy non-SA/org-unit flow.
  return {
    careerDisabled: false,
    careerRequired: false,
    secretariatRequired: false,
    secretariatLockedToSA: false,
    helperText: "",
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
 * Returns the career value to keep after the role changes. Switching to
 * secretario clears the career (secretario is secretariat-scoped, no career);
 * director/profesor and miembro keep the current value so the admin can confirm
 * or adjust it.
 */
export function resolveCareerAfterRoleChange(input: {
  role: MembershipRole;
  currentCareerId: string;
}): string {
  if (input.role === "secretario") return "";
  return input.currentCareerId;
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
  // SECRETARIO_REQUIRES_NULL_CAREER) so the UI mirrors the server contract.
  const result = validateMembershipScopeRule({
    membership_role: input.role,
    secretariatCode: input.secretariatCode,
    career_id: input.careerId,
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