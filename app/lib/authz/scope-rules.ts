export type MembershipRole = "secretario" | "director" | "profesor" | "miembro";

export interface MembershipScope {
  membership_role: MembershipRole;
  secretariat_id: string | null;
  career_id: string | null;
  org_unit_id: string | null;
  is_active?: boolean;
}

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
      hasMembership(memberships, "director", secretariatId) ||
      hasMembership(memberships, "profesor", secretariatId, careerId)
    );
  }

  if (secretariatCode === "SA") {
    return (
      hasMembership(memberships, "secretario", secretariatId) ||
      hasMembership(memberships, "director", secretariatId)
    );
  }

  if (secretariatCode === "CYT") {
    return (
      hasMembership(memberships, "secretario", secretariatId) ||
      hasMembership(memberships, "director", secretariatId) ||
      (!!orgUnitId && hasMembership(memberships, "miembro", secretariatId, null, orgUnitId))
    );
  }

  if (secretariatCode === "SEU") {
    return (
      hasMembership(memberships, "secretario", secretariatId) ||
      hasMembership(memberships, "director", secretariatId) ||
      (orgUnitId
        ? hasMembership(memberships, "miembro", secretariatId, null, orgUnitId)
        : hasMembership(memberships, "miembro", secretariatId))
    );
  }

  if (secretariatCode === "SAU") {
    return (
      hasMembership(memberships, "secretario", secretariatId) ||
      hasMembership(memberships, "director", secretariatId) ||
      hasMembership(memberships, "miembro", secretariatId)
    );
  }

  return false;
}
