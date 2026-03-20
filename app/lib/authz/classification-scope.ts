/**
 * Alcance de clasificación al crear convenios: solo admin/decano eligen secretaría;
 * secretario SA ve todas las carreras; director SA carrera fija; profesor SA solo sus carreras.
 */

export type MembershipRow = {
  membership_role: "secretario" | "director" | "profesor" | "miembro";
  secretariat_id: string | null;
  career_id: string | null;
  org_unit_id: string | null;
  is_active?: boolean;
};

/** Resultado para usuarios no admin/decano; admin usa kind "full". */
export type ConstrainedClassification =
  | {
      kind: "constrained";
      canChooseSecretariat: false;
      lockedSecretariatId: string | null;
      /** secretario SA: todas las carreras; director/profesor: subconjunto o una fija */
      careerScope: "all_sa" | "fixed" | "subset";
      lockedCareerId: string | null;
      allowedCareerIds: string[] | null;
      /** secretario no-SA: todas las subáreas de esa secretaría */
      orgUnitsForSecretariat: "all_active" | "membership_only";
      effectiveRole: "secretario" | "director" | "profesor" | "miembro";
    }
  | { kind: "full" };

const ACTIVE = (m: MembershipRow) => (m.is_active ?? true) !== false;

/** Prioridad: secretario > director > profesor > miembro */
export function computeConstrainedClassification(
  profileRole: string,
  memberships: MembershipRow[],
  saSecretariatId: string | null
): ConstrainedClassification {
  if (profileRole === "admin" || profileRole === "decano") {
    return { kind: "full" };
  }

  const m = memberships.filter(ACTIVE);

  const secretarios = m.filter((x) => x.membership_role === "secretario");
  if (secretarios.length > 0) {
    const preferSa = saSecretariatId
      ? secretarios.find((s) => s.secretariat_id === saSecretariatId)
      : undefined;
    const locked = preferSa?.secretariat_id ?? secretarios[0].secretariat_id;
    if (!locked) {
      return fallbackMiembro(m, saSecretariatId);
    }
    const isSa = saSecretariatId && locked === saSecretariatId;
    return {
      kind: "constrained",
      canChooseSecretariat: false,
      lockedSecretariatId: locked,
      careerScope: isSa ? "all_sa" : "fixed",
      lockedCareerId: null,
      allowedCareerIds: null,
      orgUnitsForSecretariat: isSa ? "membership_only" : "all_active",
      effectiveRole: "secretario",
    };
  }

  const directors = m.filter((x) => x.membership_role === "director");
  if (directors.length > 0) {
    const d = saSecretariatId
      ? directors.find((x) => x.secretariat_id === saSecretariatId) ?? directors[0]
      : directors[0];
    if (!d.secretariat_id || !d.career_id) {
      return fallbackMiembro(m, saSecretariatId);
    }
    return {
      kind: "constrained",
      canChooseSecretariat: false,
      lockedSecretariatId: d.secretariat_id,
      careerScope: "fixed",
      lockedCareerId: d.career_id,
      allowedCareerIds: [d.career_id],
      orgUnitsForSecretariat: "membership_only",
      effectiveRole: "director",
    };
  }

  const profesores = m.filter((x) => x.membership_role === "profesor");
  if (profesores.length > 0) {
    const inSa = saSecretariatId
      ? profesores.filter((p) => p.secretariat_id === saSecretariatId)
      : profesores;
    const careerIds = Array.from(
      new Set(
        inSa.map((p) => p.career_id).filter((id): id is string => !!id)
      )
    );
    const lockedSec =
      saSecretariatId && inSa.some((p) => p.secretariat_id === saSecretariatId)
        ? saSecretariatId
        : profesores[0].secretariat_id;
    if (!lockedSec) {
      return fallbackMiembro(m, saSecretariatId);
    }
    if (careerIds.length === 0) {
      return fallbackMiembro(m, saSecretariatId);
    }
    const scope = careerIds.length === 1 ? "fixed" : "subset";
    return {
      kind: "constrained",
      canChooseSecretariat: false,
      lockedSecretariatId: lockedSec,
      careerScope: scope,
      lockedCareerId: careerIds.length === 1 ? careerIds[0] : null,
      allowedCareerIds: careerIds,
      orgUnitsForSecretariat: "membership_only",
      effectiveRole: "profesor",
    };
  }

  return fallbackMiembro(m, saSecretariatId);
}

function fallbackMiembro(
  m: MembershipRow[],
  saSecretariatId: string | null
): ConstrainedClassification {
  const miembros = m.filter((x) => x.membership_role === "miembro");
  const withSec = miembros.find((x) => x.secretariat_id)?.secretariat_id;
  const locked =
    withSec ||
    m.find((x) => x.secretariat_id)?.secretariat_id ||
    null;
  if (!locked) {
    return {
      kind: "constrained",
      canChooseSecretariat: false,
      lockedSecretariatId: saSecretariatId,
      careerScope: "fixed",
      lockedCareerId: null,
      allowedCareerIds: null,
      orgUnitsForSecretariat: "membership_only",
      effectiveRole: "miembro",
    };
  }
  return {
    kind: "constrained",
    canChooseSecretariat: false,
    lockedSecretariatId: locked,
    careerScope: "fixed",
    lockedCareerId: null,
    allowedCareerIds: null,
    orgUnitsForSecretariat: "membership_only",
    effectiveRole: "miembro",
  };
}

export function validateCreateClassification(
  constrained: ConstrainedClassification,
  secretariatId: string,
  careerId: string | null,
  convenioTypeId: number
): { ok: true } | { ok: false; error: string } {
  const practice = convenioTypeId === 1 || convenioTypeId === 5;
  if (constrained.kind === "full") {
    if (practice && !careerId) {
      return {
        ok: false,
        error: "Para convenios de práctica, la carrera es obligatoria",
      };
    }
    return { ok: true };
  }

  if (constrained.lockedSecretariatId == null) {
    return { ok: false, error: "No se pudo determinar la secretaría del usuario" };
  }
  if (secretariatId !== constrained.lockedSecretariatId) {
    return {
      ok: false,
      error: "No puedes asignar el convenio a otra secretaría",
    };
  }

  if (practice) {
    if (constrained.careerScope === "all_sa") {
      /* Secretario académico: carrera opcional en práctica */
      return { ok: true };
    }
    if (constrained.careerScope === "fixed") {
      if (!constrained.lockedCareerId) {
        return { ok: false, error: "Carrera no definida para tu rol" };
      }
      if (!careerId) {
        return {
          ok: false,
          error: "Para convenios de práctica, debes seleccionar una carrera",
        };
      }
      if (careerId !== constrained.lockedCareerId) {
        return { ok: false, error: "No puedes asignar otra carrera" };
      }
      return { ok: true };
    }
    if (constrained.careerScope === "subset") {
      if (!careerId || !constrained.allowedCareerIds?.includes(careerId)) {
        return {
          ok: false,
          error: "Debes elegir una carrera de tu ámbito",
        };
      }
      return { ok: true };
    }
  }

  return { ok: true };
}
