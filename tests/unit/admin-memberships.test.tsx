import { describe, expect, it } from "vitest";

import {
  MEMBERSHIP_HELPER_TEXT,
  resolveCareerAfterRoleChange,
  resolveEnforcedSecretariat,
  resolveMembershipRuleMessage,
  resolveRoleControls,
  resolveSubmitValidation,
} from "@/app/protected/admin/memberships/membership-form-rules";
import type { MembershipRole } from "@/app/lib/authz/scope-rules";

const saId = "sa-1";
const cytId = "cyt-1";

describe("membership form rule controls", () => {
  it("disables and clears the career field for secretario while keeping secretariat required", () => {
    const controls = resolveRoleControls("secretario");

    expect(controls.careerDisabled).toBe(true);
    expect(controls.careerRequired).toBe(false);
    expect(controls.secretariatRequired).toBe(true);
    expect(controls.secretariatLockedToSA).toBe(false);
    expect(controls.helperText).toContain("secretario");
  });

  it("forces secretariat to SA and marks career required for director/profesor", () => {
    const director = resolveRoleControls("director");
    const profesor = resolveRoleControls("profesor");

    for (const controls of [director, profesor]) {
      expect(controls.careerDisabled).toBe(false);
      expect(controls.careerRequired).toBe(true);
      expect(controls.secretariatRequired).toBe(true);
      expect(controls.secretariatLockedToSA).toBe(true);
    }

    expect(director.helperText).toBe(MEMBERSHIP_HELPER_TEXT);
  });

  it("preserves legacy miembro semantics with no forced scope", () => {
    const controls = resolveRoleControls("miembro");

    expect(controls.secretariatLockedToSA).toBe(false);
    expect(controls.careerRequired).toBe(false);
    expect(controls.helperText).toBe("");
  });
});

describe("membership form enforced secretariat", () => {
  it("overrides a non-SA secretariat with SA when role is director/profesor", () => {
    expect(
      resolveEnforcedSecretariat({ role: "director", saSecretariatId: saId, currentSecretariatId: cytId }),
    ).toBe(saId);
    expect(
      resolveEnforcedSecretariat({ role: "profesor", saSecretariatId: saId, currentSecretariatId: cytId }),
    ).toBe(saId);
  });

  it("keeps the current secretariat for secretario and miembro", () => {
    expect(
      resolveEnforcedSecretariat({ role: "secretario", saSecretariatId: saId, currentSecretariatId: cytId }),
    ).toBe(cytId);
    expect(
      resolveEnforcedSecretariat({ role: "miembro", saSecretariatId: saId, currentSecretariatId: cytId }),
    ).toBe(cytId);
  });

  it("falls back to current secretariat when SA id is unavailable for director", () => {
    expect(
      resolveEnforcedSecretariat({ role: "director", saSecretariatId: null, currentSecretariatId: cytId }),
    ).toBe(cytId);
  });
});

describe("membership career reset on role change", () => {
  it("clears the career when switching to secretario", () => {
    expect(resolveCareerAfterRoleChange({ role: "secretario", currentCareerId: "isi" })).toBe("");
  });

  it("keeps the existing career for director/profesor so admins can confirm it", () => {
    expect(resolveCareerAfterRoleChange({ role: "director", currentCareerId: "isi" })).toBe("isi");
    expect(resolveCareerAfterRoleChange({ role: "profesor", currentCareerId: "isi" })).toBe("isi");
  });

  it("keeps the existing career for miembro", () => {
    expect(resolveCareerAfterRoleChange({ role: "miembro", currentCareerId: "isi" })).toBe("isi");
  });
});

describe("membership submit validation", () => {
  it("blocks secretario when secretariat is missing", () => {
    const result = resolveSubmitValidation({
      role: "secretario",
      secretariatId: "",
      secretariatCode: null,
      careerId: null,
    });

    expect(result.canSubmit).toBe(false);
    expect(result.code).toBe("MEMBERSHIP_SECRETARIAT_REQUIRED");
  });

  it("blocks secretario that reached the API with a career (422 mirror)", () => {
    const result = resolveSubmitValidation({
      role: "secretario",
      secretariatId: saId,
      secretariatCode: "SA",
      careerId: "isi",
    });

    expect(result.canSubmit).toBe(false);
    expect(result.code).toBe("SECRETARIO_REQUIRES_NULL_CAREER");
  });

  it("blocks director/profesor when secretariat is missing", () => {
    const result = resolveSubmitValidation({
      role: "director",
      secretariatId: "",
      secretariatCode: null,
      careerId: "isi",
    });

    expect(result.canSubmit).toBe(false);
    expect(result.code).toBe("MEMBERSHIP_SECRETARIAT_REQUIRED");
  });

  it("blocks director/profesor without a career even when SA", () => {
    const result = resolveSubmitValidation({
      role: "profesor",
      secretariatId: saId,
      secretariatCode: "SA",
      careerId: null,
    });

    expect(result.canSubmit).toBe(false);
    expect(result.code).toBe("DIRECTOR_PROFESOR_REQUIRE_CAREER");
  });

  it("blocks director/profesor outside SA", () => {
    const result = resolveSubmitValidation({
      role: "director",
      secretariatId: cytId,
      secretariatCode: "CYT",
      careerId: "isi",
    });

    expect(result.canSubmit).toBe(false);
    expect(result.code).toBe("DIRECTOR_PROFESOR_REQUIRE_SA");
  });

  it("allows a valid secretario (SA, null career) and SA director with career", () => {
    expect(
      resolveSubmitValidation({
        role: "secretario",
        secretariatId: saId,
        secretariatCode: "SA",
        careerId: null,
      }).canSubmit,
    ).toBe(true);
    expect(
      resolveSubmitValidation({
        role: "director",
        secretariatId: saId,
        secretariatCode: "SA",
        careerId: "isi",
      }).canSubmit,
    ).toBe(true);
  });

  it("allows miembro without extra rule restrictions", () => {
    expect(
      resolveSubmitValidation({
        role: "miembro",
        secretariatId: cytId,
        secretariatCode: "CYT",
        careerId: null,
      }).canSubmit,
    ).toBe(true);
  });
});

describe("membership rule message resolution", () => {
  it("maps backend MembershipRuleCode messages for 422 create rejections", () => {
    expect(resolveMembershipRuleMessage("SECRETARIO_REQUIRES_NULL_CAREER")).toContain("secretario");
    expect(resolveMembershipRuleMessage("DIRECTOR_PROFESOR_REQUIRE_SA")).toContain("SA");
    expect(resolveMembershipRuleMessage("DIRECTOR_PROFESOR_REQUIRE_CAREER")).toContain("carrera");
  });

  it("maps the delete last-active-admin guard and UI required-field codes", () => {
    expect(resolveMembershipRuleMessage("LAST_ACTIVE_ADMIN_MEMBERSHIP")).toContain("administrador");
    expect(resolveMembershipRuleMessage("MEMBERSHIP_SECRETARIAT_REQUIRED")).toContain("secretaría");
  });

  it("returns null for an unknown code so the caller can fall back to the server message", () => {
    expect(resolveMembershipRuleMessage("UNKNOWN_CODE")).toBeNull();
  });
});

// Keep the type import meaningful even when no JSX rendering is needed
// (vitest runs in the node environment; no DOM layer is available).
export type _Unused = MembershipRole;