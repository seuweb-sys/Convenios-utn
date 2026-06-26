export type MembershipRole = "secretario" | "director" | "profesor" | "miembro";

export interface MembershipScope {
  membership_role: MembershipRole;
  secretariat_id: string | null;
  career_id: string | null;
  org_unit_id: string | null;
  is_active?: boolean;
}

export type MembershipRuleCode =
  | "SECRETARIO_REQUIRES_NULL_CAREER"
  | "SECRETARIO_REQUIRES_NULL_ORG_UNIT"
  | "DIRECTOR_PROFESOR_REQUIRE_SA"
  | "DIRECTOR_PROFESOR_REQUIRE_CAREER"
  | "CYT_SEU_REQUIRE_NULL_CAREER";

export const PRACTICE_TYPE_IDS = new Set([1, 5]);

export function isPracticeType(convenioTypeId: number) {
  return PRACTICE_TYPE_IDS.has(convenioTypeId);
}

export function normalizeAgreementYear(input: unknown, fallbackYear: number) {
  const year = input == null ? fallbackYear : parseInt(String(input), 10);
  if (Number.isNaN(year)) return { valid: false as const, year: fallbackYear, error: "agreement_year inválido" };
  if (year < 2000 || year > 2100) {
    return { valid: false as const, year, error: "agreement_year fuera de rango" };
  }
  return { valid: true as const, year, error: null };
}

export function validatePracticeHistoricalRule(convenioTypeId: number, agreementYear: number, currentYear: number) {
  if (!isPracticeType(convenioTypeId)) return { valid: true as const, error: null };
  if (agreementYear !== currentYear) {
    return { valid: false as const, error: "Los convenios de práctica no permiten carga histórica" };
  }
  return { valid: true as const, error: null };
}

interface PracticeHistoricalUpdateRuleInput {
  convenioTypeId: number;
  requestedYear: number;
  currentYear: number;
  existingYear: number | null | undefined;
  canOverrideHistorical: boolean;
}

export function validatePracticeHistoricalUpdateRule({
  convenioTypeId,
  requestedYear,
  currentYear,
  existingYear,
  canOverrideHistorical,
}: PracticeHistoricalUpdateRuleInput) {
  if (!isPracticeType(convenioTypeId)) return { valid: true as const, error: null };
  if (requestedYear === currentYear) return { valid: true as const, error: null };
  if (canOverrideHistorical) return { valid: true as const, error: null };
  if (existingYear != null && existingYear === requestedYear) {
    return { valid: true as const, error: null };
  }

  return { valid: false as const, error: "Los convenios de práctica no permiten carga histórica" };
}

export function canUserToggleHiddenFromArea(
  role: string,
  memberships: MembershipScope[],
  secretariatId: string | null
) {
  if (!secretariatId) return false;
  if (role === "admin" || role === "decano") return true;

  return memberships.some(
    (membership) =>
      membership.membership_role === "secretario" &&
      membership.secretariat_id === secretariatId &&
      (membership.is_active ?? true)
  );
}

export function hasMembership(
  memberships: MembershipScope[],
  role: MembershipRole,
  secretariatId: string | null,
  careerId?: string | null,
  orgUnitId?: string | null
) {
  return memberships.some((membership) => {
    if ((membership.is_active ?? true) === false) return false;
    if (membership.membership_role !== role) return false;
    if (secretariatId && membership.secretariat_id !== secretariatId) return false;
    if (careerId && membership.career_id !== careerId) return false;
    if (orgUnitId && membership.org_unit_id !== orgUnitId) return false;
    return true;
  });
}

export function hasMembershipExact(
  memberships: MembershipScope[],
  role: MembershipRole,
  secretariatId: string | null,
  careerId: string | null = null,
  orgUnitId: string | null = null,
) {
  return memberships.some((membership) => {
    if ((membership.is_active ?? true) === false) return false;
    return (
      membership.membership_role === role &&
      membership.secretariat_id === secretariatId &&
      membership.career_id === careerId &&
      membership.org_unit_id === orgUnitId
    );
  });
}

function hasValidSaScopedMembership(
  memberships: MembershipScope[],
  role: Extract<MembershipRole, "director" | "profesor">,
  secretariatId: string,
  careerId?: string | null,
) {
  if (careerId) {
    return hasMembershipExact(memberships, role, secretariatId, careerId, null);
  }

  return memberships.some((membership) => {
    if ((membership.is_active ?? true) === false) return false;
    return (
      membership.membership_role === role &&
      membership.secretariat_id === secretariatId &&
      membership.career_id !== null &&
      membership.org_unit_id === null
    );
  });
}

export function validateMembershipScopeRule(input: {
  membership_role: MembershipRole;
  secretariatCode: string | null;
  career_id: string | null;
  /**
   * Optional today so existing PR1 callers (which don't wire org_unit_id
   * through the API route yet) keep working. PR2 passes org_unit_id through.
   * Deterministic priority: secretario org_unit failure is reported BEFORE
   * secretario career and BEFORE CYT/SEU career failures.
   */
  org_unit_id?: string | null;
}) {
  // Deterministic priority: secretario -> org_unit_id IS NULL first.
  // A secretario never carries an org_unit scope; surfacing this before the
  // career rule keeps 422 outputs unambiguous for UI messaging.
  if (input.membership_role === "secretario" && input.org_unit_id) {
    return {
      valid: false as const,
      code: "SECRETARIO_REQUIRES_NULL_ORG_UNIT" as const,
      error: "La membresía secretario no admite subárea",
    };
  }

  if (input.membership_role === "secretario" && input.career_id !== null) {
    return {
      valid: false as const,
      code: "SECRETARIO_REQUIRES_NULL_CAREER" as const,
      error: "La membresía secretario no admite carrera",
    };
  }

  if (input.membership_role === "director" || input.membership_role === "profesor") {
    if (input.secretariatCode !== "SA") {
      return {
        valid: false as const,
        code: "DIRECTOR_PROFESOR_REQUIRE_SA" as const,
        error: "Las membresías director/profesor solo pueden pertenecer a SA",
      };
    }

    if (input.career_id === null) {
      return {
        valid: false as const,
        code: "DIRECTOR_PROFESOR_REQUIRE_CAREER" as const,
        error: "Las membresías director/profesor requieren carrera",
      };
    }
  }

  // CYT/SEU non-secretary memberships reject career_id. The secretary branch is
  // excluded because secretario already requires career_id NULL above and the
  // secretary-specific code must win whenever both could apply.
  if (
    input.membership_role !== "secretario" &&
    (input.secretariatCode === "CYT" || input.secretariatCode === "SEU") &&
    input.career_id !== null
  ) {
    return {
      valid: false as const,
      code: "CYT_SEU_REQUIRE_NULL_CAREER" as const,
      error: "Las membresías CYT/SEU no admiten carrera",
    };
  }

  return { valid: true as const };
}

import { selectValidCytSeuMiembros } from "./classification-scope";

export interface CreateScopeInput {
  role: string;
  secretariatCode: string;
  secretariatId: string;
  careerId: string | null;
  orgUnitId: string | null;
  convenioTypeId: number;
  memberships: MembershipScope[];
}

export function canCreateByMembershipMatrix(input: CreateScopeInput) {
  const {
    role,
    secretariatCode,
    secretariatId,
    careerId,
    orgUnitId,
    convenioTypeId,
    memberships,
  } = input;

  if (role === "admin" || role === "decano") return true;

  if (isPracticeType(convenioTypeId)) {
    if (secretariatCode !== "SA") return false;
    if (!careerId) {
      return hasMembership(memberships, "secretario", secretariatId);
    }
    return (
      hasMembership(memberships, "secretario", secretariatId) ||
      hasValidSaScopedMembership(memberships, "director", secretariatId, careerId) ||
      hasValidSaScopedMembership(memberships, "profesor", secretariatId, careerId)
    );
  }

  if (secretariatCode === "SA") {
    return (
      hasMembership(memberships, "secretario", secretariatId) ||
      hasValidSaScopedMembership(memberships, "director", secretariatId, careerId)
    );
  }

  if (secretariatCode === "CYT") {
    // Defensive: ignore stale CYT miembro rows carrying career_id; they must
    // not widen access beyond the org_unit match.
    const hasValidCytMiembro =
      !!orgUnitId &&
      selectValidCytSeuMiembros(memberships, secretariatId, orgUnitId).length > 0;
    return (
      hasMembership(memberships, "secretario", secretariatId) || hasValidCytMiembro
    );
  }

  if (secretariatCode === "SEU") {
    // Defensive: ignore stale SEU miembro rows carrying career_id in both the
    // exact org_unit path and the secretariat-wide (no org_unit) miembro path.
    const validSeuMiembros = selectValidCytSeuMiembros(
      memberships,
      secretariatId,
      orgUnitId,
    );
    return (
      hasMembership(memberships, "secretario", secretariatId) ||
      validSeuMiembros.length > 0
    );
  }

  if (secretariatCode === "SAU") {
    return (
      hasMembership(memberships, "secretario", secretariatId) ||
      hasMembership(memberships, "miembro", secretariatId)
    );
  }

  return false;
}
