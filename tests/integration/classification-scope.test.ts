import { describe, expect, it } from "vitest";
import {
  computeConstrainedClassification,
  validateCreateClassification,
} from "@/app/lib/authz/classification-scope";

const SA = "sa-uuid";

describe("classification scope", () => {
  it("admin is full scope", () => {
    expect(computeConstrainedClassification("admin", [], SA).kind).toBe("full");
  });

  it("decano is full scope and still requires career for practice", () => {
    const r = computeConstrainedClassification("decano", [], SA);
    expect(r.kind).toBe("full");
    expect(validateCreateClassification(r, SA, null, 1).ok).toBe(false);
    expect(validateCreateClassification(r, SA, "c1", 1).ok).toBe(true);
  });

  it("SA secretario gets all_sa careers and locked SA", () => {
    const r = computeConstrainedClassification(
      "user",
      [
        {
          membership_role: "secretario",
          secretariat_id: SA,
          career_id: null,
          org_unit_id: null,
          is_active: true,
        },
      ],
      SA
    );
    expect(r.kind).toBe("constrained");
    if (r.kind !== "constrained") return;
    expect(r.lockedSecretariatId).toBe(SA);
    expect(r.careerScope).toBe("all_sa");
    expect(r.canChooseSecretariat).toBe(false);
  });

  it("director in SA can choose any SA career for practice", () => {
    const r = computeConstrainedClassification(
      "user",
      [
        {
          membership_role: "director",
          secretariat_id: SA,
          career_id: "c1",
          org_unit_id: null,
          is_active: true,
        },
      ],
      SA
    );
    expect(r.kind).toBe("constrained");
    if (r.kind !== "constrained") return;
    expect(r.careerScope).toBe("all_sa");
    expect(r.lockedCareerId).toBeNull();
    expect(validateCreateClassification(r, SA, "c1", 1).ok).toBe(true);
    expect(validateCreateClassification(r, SA, "c2", 1).ok).toBe(true);
    expect(validateCreateClassification(r, SA, null, 1).ok).toBe(false);
  });

  it("profesor with two careers gets subset", () => {
    const r = computeConstrainedClassification(
      "user",
      [
        {
          membership_role: "profesor",
          secretariat_id: SA,
          career_id: "c1",
          org_unit_id: null,
          is_active: true,
        },
        {
          membership_role: "profesor",
          secretariat_id: SA,
          career_id: "c2",
          org_unit_id: null,
          is_active: true,
        },
      ],
      SA
    );
    expect(r.kind).toBe("constrained");
    if (r.kind !== "constrained") return;
    expect(r.careerScope).toBe("subset");
    expect(r.allowedCareerIds?.sort()).toEqual(["c1", "c2"].sort());
    expect(validateCreateClassification(r, SA, "c1", 1).ok).toBe(true);
    expect(validateCreateClassification(r, SA, "c3", 1).ok).toBe(false);
  });

  it("secretario may omit career on practice (validate)", () => {
    const r = computeConstrainedClassification(
      "user",
      [
        {
          membership_role: "secretario",
          secretariat_id: SA,
          career_id: null,
          org_unit_id: null,
          is_active: true,
        },
      ],
      SA
    );
    expect(r.kind).toBe("constrained");
    if (r.kind !== "constrained") return;
    expect(validateCreateClassification(r, SA, null, 1).ok).toBe(true);
  });

  it("secretario wins over director membership", () => {
    const r = computeConstrainedClassification(
      "user",
      [
        {
          membership_role: "secretario",
          secretariat_id: SA,
          career_id: null,
          org_unit_id: null,
          is_active: true,
        },
        {
          membership_role: "director",
          secretariat_id: SA,
          career_id: "c1",
          org_unit_id: null,
          is_active: true,
        },
      ],
      SA
    );
    expect(r.kind).toBe("constrained");
    if (r.kind !== "constrained") return;
    expect(r.careerScope).toBe("all_sa");
  });

  it("director outside SA does not use career input", () => {
    const r = computeConstrainedClassification(
      "user",
      [
        {
          membership_role: "director",
          secretariat_id: "cyt-id",
          career_id: null,
          org_unit_id: null,
          is_active: true,
        },
      ],
      SA
    );
    expect(r.kind).toBe("constrained");
    if (r.kind !== "constrained") return;
    expect(r.lockedSecretariatId).toBe("cyt-id");
    expect(r.lockedCareerId).toBeNull();
    expect(r.orgUnitsForSecretariat).toBe("all_active");
    expect(validateCreateClassification(r, "cyt-id", null, 2).ok).toBe(true);
  });
});
