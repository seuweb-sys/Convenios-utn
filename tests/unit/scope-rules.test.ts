import { describe, expect, it } from "vitest";
import {
  canCreateByMembershipMatrix,
  canUserToggleHiddenFromArea,
  hasMembership,
  hasMembershipExact,
  isPracticeType,
  normalizeAgreementYear,
  validateMembershipScopeRule,
  validatePracticeHistoricalUpdateRule,
  validatePracticeHistoricalRule,
} from "@/app/lib/authz/scope-rules";

describe("scope-rules (unit)", () => {
  it("detects practice convenio types", () => {
    expect(isPracticeType(1)).toBe(true);
    expect(isPracticeType(5)).toBe(true);
    expect(isPracticeType(2)).toBe(false);
  });

  it("normalizes agreement year and validates range", () => {
    const valid = normalizeAgreementYear("2024", 2026);
    expect(valid.valid).toBe(true);
    expect(valid.year).toBe(2024);

    const invalid = normalizeAgreementYear("1890", 2026);
    expect(invalid.valid).toBe(false);
  });

  it("enforces non-historical rule only for practice (admin exception is applied in convenios API routes)", () => {
    expect(validatePracticeHistoricalRule(1, 2025, 2026).valid).toBe(false);
    expect(validatePracticeHistoricalRule(5, 2025, 2026).valid).toBe(false);
    expect(validatePracticeHistoricalRule(2, 2025, 2026).valid).toBe(true);
  });

  it("allows non-admin updates on historical practice convenios only when the year stays unchanged", () => {
    expect(
      validatePracticeHistoricalUpdateRule({
        convenioTypeId: 1,
        requestedYear: 2025,
        currentYear: 2026,
        existingYear: 2025,
        canOverrideHistorical: false,
      }).valid
    ).toBe(true);

    expect(
      validatePracticeHistoricalUpdateRule({
        convenioTypeId: 1,
        requestedYear: 2024,
        currentYear: 2026,
        existingYear: 2025,
        canOverrideHistorical: false,
      }).valid
    ).toBe(false);
  });

  it("allows privileged users to intentionally keep or set historical practice years", () => {
    expect(
      validatePracticeHistoricalUpdateRule({
        convenioTypeId: 5,
        requestedYear: 2024,
        currentYear: 2026,
        existingYear: 2025,
        canOverrideHistorical: true,
      }).valid
    ).toBe(true);
  });

  it("allows hidden toggle for admin/decano/secretario", () => {
    const memberships = [
      {
        membership_role: "secretario" as const,
        secretariat_id: "sa",
        career_id: null,
        org_unit_id: null,
        is_active: true,
      },
    ];

    expect(canUserToggleHiddenFromArea("admin", [], "sa")).toBe(true);
    expect(canUserToggleHiddenFromArea("decano", [], "sa")).toBe(true);
    expect(canUserToggleHiddenFromArea("profesor", memberships, "sa")).toBe(true);
    expect(canUserToggleHiddenFromArea("profesor", memberships, "cyt")).toBe(false);
  });

  it("keeps loose matching for legacy callers while exact matching requires the full membership scope", () => {
    const memberships = [
      {
        membership_role: "director" as const,
        secretariat_id: "sa",
        career_id: "isi",
        org_unit_id: null,
        is_active: true,
      },
    ];

    expect(hasMembership(memberships, "director", "sa")).toBe(true);
    expect(hasMembershipExact(memberships, "director", "sa", "isi", null)).toBe(true);
    expect(hasMembershipExact(memberships, "director", "sa", null, null)).toBe(false);
  });

  it("preserves CYT/SEU/SAU non-practice semantics while rejecting invalid director memberships", () => {
    const cytMember = [
      {
        membership_role: "miembro" as const,
        secretariat_id: "cyt",
        career_id: null,
        org_unit_id: "grp-1",
        is_active: true,
      },
    ];
    const seuMember = [
      {
        membership_role: "miembro" as const,
        secretariat_id: "seu",
        career_id: null,
        org_unit_id: null,
        is_active: true,
      },
    ];
    const sauMember = [
      {
        membership_role: "miembro" as const,
        secretariat_id: "sau",
        career_id: null,
        org_unit_id: null,
        is_active: true,
      },
    ];
    const invalidDirector = [
      {
        membership_role: "director" as const,
        secretariat_id: "cyt",
        career_id: null,
        org_unit_id: null,
        is_active: true,
      },
    ];

    expect(
      hasMembershipExact(
        [
          {
            membership_role: "director",
            secretariat_id: "sa",
            career_id: "isi",
            org_unit_id: null,
            is_active: true,
          },
        ],
        "director",
        "sa",
        "isi",
        null,
      ),
    ).toBe(true);

    expect(
      canCreateByMembershipMatrix({
        role: "user",
        secretariatCode: "CYT",
        secretariatId: "cyt",
        careerId: null,
        orgUnitId: "grp-1",
        convenioTypeId: 2,
        memberships: cytMember,
      }),
    ).toBe(true);
    expect(
      canCreateByMembershipMatrix({
        role: "user",
        secretariatCode: "SEU",
        secretariatId: "seu",
        careerId: null,
        orgUnitId: null,
        convenioTypeId: 2,
        memberships: seuMember,
      }),
    ).toBe(true);
    expect(
      canCreateByMembershipMatrix({
        role: "user",
        secretariatCode: "SAU",
        secretariatId: "sau",
        careerId: null,
        orgUnitId: null,
        convenioTypeId: 2,
        memberships: sauMember,
      }),
    ).toBe(true);
    expect(
      canCreateByMembershipMatrix({
        role: "user",
        secretariatCode: "CYT",
        secretariatId: "cyt",
        careerId: null,
        orgUnitId: null,
        convenioTypeId: 2,
        memberships: invalidDirector,
      }),
    ).toBe(false);
expect(
      canCreateByMembershipMatrix({
        role: "user",
        secretariatCode: "SA",
        secretariatId: "sa",
        careerId: "isi",
        orgUnitId: null,
        convenioTypeId: 2,
        memberships: invalidDirector,
      }),
    ).toBe(false);
  });
});

describe("validateMembershipScopeRule (PR1: secretary secretariat scope codes)", () => {
  it("rejects secretario with org_unit_id set using SECRETARIO_REQUIRES_NULL_ORG_UNIT", () => {
    const result = validateMembershipScopeRule({
      membership_role: "secretario",
      secretariatCode: "CYT",
      career_id: null,
      org_unit_id: "grp-1",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("SECRETARIO_REQUIRES_NULL_ORG_UNIT");
    }
  });

  it("rejects SA secretario with org_unit_id set using SECRETARIO_REQUIRES_NULL_ORG_UNIT regardless of secretariat", () => {
    const result = validateMembershipScopeRule({
      membership_role: "secretario",
      secretariatCode: "SA",
      career_id: null,
      org_unit_id: "grp-1",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("SECRETARIO_REQUIRES_NULL_ORG_UNIT");
    }
  });

  it("rejects CYT miembro with career_id set using CYT_SEU_REQUIRE_NULL_CAREER", () => {
    const result = validateMembershipScopeRule({
      membership_role: "miembro",
      secretariatCode: "CYT",
      career_id: "isi",
      org_unit_id: null,
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("CYT_SEU_REQUIRE_NULL_CAREER");
    }
  });

  it("rejects SEU miembro with career_id set using CYT_SEU_REQUIRE_NULL_CAREER", () => {
    const result = validateMembershipScopeRule({
      membership_role: "miembro",
      secretariatCode: "SEU",
      career_id: "isi",
      org_unit_id: "grp-1",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("CYT_SEU_REQUIRE_NULL_CAREER");
    }
  });

  it("accepts CYT/SEU miembro with career_id NULL (with or without org_unit_id)", () => {
    expect(
      validateMembershipScopeRule({
        membership_role: "miembro",
        secretariatCode: "CYT",
        career_id: null,
        org_unit_id: "grp-1",
      }).valid,
    ).toBe(true);

    expect(
      validateMembershipScopeRule({
        membership_role: "miembro",
        secretariatCode: "SEU",
        career_id: null,
        org_unit_id: null,
      }).valid,
    ).toBe(true);
  });

  it("does not apply CYT_SEU_REQUIRE_NULL_CAREER to SA miembro (SA miembro may keep career)", () => {
    const result = validateMembershipScopeRule({
      membership_role: "miembro",
      secretariatCode: "SA",
      career_id: "isi",
      org_unit_id: null,
    });

    expect(result.valid).toBe(true);
  });

  it("prioritizes SECRETARIO_REQUIRES_NULL_ORG_UNIT before CYT_SEU_REQUIRE_NULL_CAREER for secretario + CYT/SEU + both violations", () => {
    // secretario + org_unit_id set + CYT secretariat + career_id set:
    // both codes could apply, but the secretario org_unit failure must win,
    // and we MUST NOT surface CYT_SEU_REQUIRE_NULL_CAREER first.
    const result = validateMembershipScopeRule({
      membership_role: "secretario",
      secretariatCode: "CYT",
      career_id: "isi",
      org_unit_id: "grp-1",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("SECRETARIO_REQUIRES_NULL_ORG_UNIT");
      expect(result.code).not.toBe("CYT_SEU_REQUIRE_NULL_CAREER");
    }
  });

  it("still returns SECRETARIO_REQUIRES_NULL_CAREER when secretario has career_id but no org_unit_id", () => {
    // Backward-compatible path: callers without org_unit_id keep the existing
    // secretario-null-career contract.
    const result = validateMembershipScopeRule({
      membership_role: "secretario",
      secretariatCode: "SA",
      career_id: "isi",
      // org_unit_id omitted intentionally
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("SECRETARIO_REQUIRES_NULL_CAREER");
    }
  });
});

describe("canCreateByMembershipMatrix (PR1: CYT/SEU miembro exact-scope parity)", () => {
  it("does not widen access when a CYT miembro row has stale career_id and the requested org_unit matches (stale row must NOT match)", () => {
    const staleCytMiembro = [
      {
        // Legacy invalid row that should be defensively ignored after the DB
        // invariant rolls out: CYT miembro with a stale career_id.
        membership_role: "miembro" as const,
        secretariat_id: "cyt",
        career_id: "isi",
        org_unit_id: "grp-1",
        is_active: true,
      },
    ];

    expect(
      canCreateByMembershipMatrix({
        role: "user",
        secretariatCode: "CYT",
        secretariatId: "cyt",
        careerId: null,
        orgUnitId: "grp-1",
        convenioTypeId: 2,
        memberships: staleCytMiembro,
      }),
    ).toBe(false);
  });

  it("still matches a valid CYT miembro row (career_id NULL) with the requested org_unit", () => {
    const validCytMiembro = [
      {
        membership_role: "miembro" as const,
        secretariat_id: "cyt",
        career_id: null,
        org_unit_id: "grp-1",
        is_active: true,
      },
    ];

    expect(
      canCreateByMembershipMatrix({
        role: "user",
        secretariatCode: "CYT",
        secretariatId: "cyt",
        careerId: null,
        orgUnitId: "grp-1",
        convenioTypeId: 2,
        memberships: validCytMiembro,
      }),
    ).toBe(true);
  });

  it("ignores stale SEU miembro rows in the secretariat-wide (no org_unit) path while still matching valid SEU miembros", () => {
    const mixedSeuMiembros = [
      {
        // Stale invalid row: SEU miembro with career_id set.
        membership_role: "miembro" as const,
        secretariat_id: "seu",
        career_id: "isi",
        org_unit_id: null,
        is_active: true,
      },
      {
        // Valid row: SEU miembro with career_id NULL.
        membership_role: "miembro" as const,
        secretariat_id: "seu",
        career_id: null,
        org_unit_id: null,
        is_active: true,
      },
    ];

    expect(
      canCreateByMembershipMatrix({
        role: "user",
        secretariatCode: "SEU",
        secretariatId: "seu",
        careerId: null,
        orgUnitId: null,
        convenioTypeId: 2,
        memberships: mixedSeuMiembros,
      }),
    ).toBe(true);

    // And the stale-only path must NOT match.
    const staleOnlySeuMiembro = [mixedSeuMiembros[0]];
    expect(
      canCreateByMembershipMatrix({
        role: "user",
        secretariatCode: "SEU",
        secretariatId: "seu",
        careerId: null,
        orgUnitId: null,
        convenioTypeId: 2,
        memberships: staleOnlySeuMiembro,
      }),
    ).toBe(false);
  });
});
