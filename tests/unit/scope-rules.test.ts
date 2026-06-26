import { describe, expect, it } from "vitest";
import {
  canCreateByMembershipMatrix,
  canUserToggleHiddenFromArea,
  hasMembership,
  hasMembershipExact,
  isPracticeType,
  normalizeAgreementYear,
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
