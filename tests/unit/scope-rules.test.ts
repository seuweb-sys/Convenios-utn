import { describe, expect, it } from "vitest";
import {
  canUserToggleHiddenFromArea,
  isPracticeType,
  normalizeAgreementYear,
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

  it("enforces non-historical rule only for practice", () => {
    expect(validatePracticeHistoricalRule(1, 2025, 2026).valid).toBe(false);
    expect(validatePracticeHistoricalRule(2, 2025, 2026).valid).toBe(true);
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
