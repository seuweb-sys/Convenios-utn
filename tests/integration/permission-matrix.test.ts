import { describe, expect, it } from "vitest";
import { canCreateByMembershipMatrix, type MembershipScope } from "@/app/lib/authz/scope-rules";

describe("permission matrix (integration)", () => {
  it("allows SA secretary to create non-practice in SA", () => {
    const memberships: MembershipScope[] = [
      {
        membership_role: "secretario",
        secretariat_id: "sa-id",
        career_id: null,
        org_unit_id: null,
      },
    ];

    const result = canCreateByMembershipMatrix({
      role: "user",
      secretariatCode: "SA",
      secretariatId: "sa-id",
      careerId: null,
      orgUnitId: null,
      convenioTypeId: 2,
      memberships,
    });

    expect(result).toBe(true);
  });

  it("allows SA director to create non-practice in own secretariat", () => {
    const memberships: MembershipScope[] = [
      {
        membership_role: "director",
        secretariat_id: "sa-id",
        career_id: null,
        org_unit_id: null,
      },
    ];

    const result = canCreateByMembershipMatrix({
      role: "user",
      secretariatCode: "SA",
      secretariatId: "sa-id",
      careerId: "career-a",
      orgUnitId: null,
      convenioTypeId: 2,
      memberships,
    });

    expect(result).toBe(true);
  });

  it("allows SA secretary to create practice without career", () => {
    const memberships: MembershipScope[] = [
      {
        membership_role: "secretario",
        secretariat_id: "sa-id",
        career_id: null,
        org_unit_id: null,
      },
    ];

    const result = canCreateByMembershipMatrix({
      role: "user",
      secretariatCode: "SA",
      secretariatId: "sa-id",
      careerId: null,
      orgUnitId: null,
      convenioTypeId: 1,
      memberships,
    });

    expect(result).toBe(true);
  });

  it("allows SA director to create practice when a career is chosen", () => {
    const memberships: MembershipScope[] = [
      {
        membership_role: "director",
        secretariat_id: "sa-id",
        career_id: null,
        org_unit_id: null,
      },
    ];

    const result = canCreateByMembershipMatrix({
      role: "user",
      secretariatCode: "SA",
      secretariatId: "sa-id",
      careerId: "career-a",
      orgUnitId: null,
      convenioTypeId: 1,
      memberships,
    });

    expect(result).toBe(true);
  });

  it("allows CYT director to create non-practice without career", () => {
    const memberships: MembershipScope[] = [
      {
        membership_role: "director",
        secretariat_id: "cyt-id",
        career_id: null,
        org_unit_id: null,
      },
    ];

    const result = canCreateByMembershipMatrix({
      role: "user",
      secretariatCode: "CYT",
      secretariatId: "cyt-id",
      careerId: null,
      orgUnitId: null,
      convenioTypeId: 2,
      memberships,
    });

    expect(result).toBe(true);
  });

  it("requires CyT group for member creation", () => {
    const memberships: MembershipScope[] = [
      {
        membership_role: "miembro",
        secretariat_id: "cyt-id",
        career_id: null,
        org_unit_id: "grp-1",
      },
    ];

    const withoutGroup = canCreateByMembershipMatrix({
      role: "user",
      secretariatCode: "CYT",
      secretariatId: "cyt-id",
      careerId: null,
      orgUnitId: null,
      convenioTypeId: 2,
      memberships,
    });

    const withGroup = canCreateByMembershipMatrix({
      role: "user",
      secretariatCode: "CYT",
      secretariatId: "cyt-id",
      careerId: null,
      orgUnitId: "grp-1",
      convenioTypeId: 2,
      memberships,
    });

    expect(withoutGroup).toBe(false);
    expect(withGroup).toBe(true);
  });

  it("allows decano globally", () => {
    const result = canCreateByMembershipMatrix({
      role: "decano",
      secretariatCode: "CYT",
      secretariatId: "cyt-id",
      careerId: null,
      orgUnitId: null,
      convenioTypeId: 3,
      memberships: [],
    });
    expect(result).toBe(true);
  });
});
