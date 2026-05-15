import { describe, expect, it } from "vitest";
import {
  canUserToggleHiddenFromArea,
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
});
