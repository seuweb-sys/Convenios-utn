import { describe, expect, it } from "vitest";

import {
  getSecretariatIdsForSecretario,
  hasActiveMembershipRole,
} from "@/app/lib/authz/membership-scope";

/**
 * Secretary-persona empirical proof for task 4.3.
 *
 * `/api/convenios?scope=secretario` (consumed by `/protected/secretario` via
 * `ScopedConveniosPanel` and by `/protected/convenios-lista`) delegates its
 * secretary-scope authorization and secretariat narrowing to two helpers in
 * `app/lib/authz/membership-scope.ts`:
 *
 *   - `hasActiveMembershipRole(supabase, uid, 'secretario')` -> 403 gate
 *   - `getSecretariatIdsForSecretario(supabase, uid)`         -> query.in('secretariat_id', ids)
 *
 * These helpers are the closest available seam to the route that can be
 * exercised without a live Supabase DB. This test runs the REAL helper logic
 * against a secretary-persona fixture through an in-memory Supabase double
 * (mocked query path). No production DB is touched.
 *
 * Boundary: row-level visibility (owner-first, career-scoped deny, SA-wide
 * allow) is enforced by RLS `has_membership_exact_scope` and is covered by
 * migration text-assertion tests in `tests/rls/pps-secretaria-visibility.test.ts`.
 * The app-layer narrowing here does NOT distinguish career scope on purpose;
 * the career-scoped deny is the RLS layer's job.
 */

const SA = "sa-secretariat-id";

const membershipRows = [
  // Seba after correction: active SA-wide secretario (career_id NULL).
  {
    id: "m1",
    profile_id: "seba-sa-wide",
    membership_role: "secretario",
    secretariat_id: SA,
    career_id: null,
    org_unit_id: null,
    is_active: true,
  },
  // Career-scoped SA secretary (career_id set) — the overexposure bug shape.
  {
    id: "m2",
    profile_id: "sec-career-a",
    membership_role: "secretario",
    secretariat_id: SA,
    career_id: "c1",
    org_unit_id: null,
    is_active: true,
  },
  // Director-only user: no secretario membership -> must be denied secretario scope.
  {
    id: "m3",
    profile_id: "dir-only",
    membership_role: "director",
    secretariat_id: SA,
    career_id: "c1",
    org_unit_id: null,
    is_active: true,
  },
  // Inactive secretary: must be filtered out by is_active.
  {
    id: "m4",
    profile_id: "inactive-sec",
    membership_role: "secretario",
    secretariat_id: SA,
    career_id: null,
    org_unit_id: null,
    is_active: false,
  },
  // Secretary with null secretariat_id: authorized by role but yields no
  // secretariat ids (route sets emptyResult -> empty list, not 403).
  {
    id: "m5",
    profile_id: "null-sec-secretary",
    membership_role: "secretario",
    secretariat_id: null,
    career_id: null,
    org_unit_id: null,
    is_active: true,
  },
];

/**
 * Minimal in-memory Supabase double that executes the
 * `.from().select().eq().not().limit()` chain against `membershipRows`.
 * Real helper logic + in-memory filter = mocked query path, no DB mutation.
 */
function createFakeSupabase(rows: Array<Record<string, unknown>>): any {
  function builder(): any {
    const eqs: Array<{ col: string; val: unknown }> = [];
    const nots: Array<{ col: string; val: unknown }> = [];
    let selected = "*";
    let limitN: number | null = null;

    const chain = {
      select(cols: string) {
        selected = cols;
        return chain;
      },
      eq(col: string, val: unknown) {
        eqs.push({ col, val });
        return chain;
      },
      not(col: string, _op: string, val: unknown) {
        nots.push({ col, val });
        return chain;
      },
      limit(n: number) {
        limitN = n;
        return chain;
      },
      then(onFulfilled?: (v: any) => any, onRejected?: (e: any) => any) {
        let result: Array<Record<string, unknown>> = rows.filter(
          (row) =>
            eqs.every((f) => row[f.col] === f.val) &&
            nots.every((n) => row[n.col] !== n.val)
        );
        if (selected !== "*") {
          const cols = selected.split(",").map((c) => c.trim());
          result = result.map((row) => {
            const picked: Record<string, unknown> = {};
            for (const c of cols) picked[c] = row[c];
            return picked;
          });
        }
        if (limitN != null) result = result.slice(0, limitN);
        return Promise.resolve({ data: result, error: null }).then(
          onFulfilled,
          onRejected
        );
      },
    };
    return chain;
  }

  return {
    from(_table: string) {
      return builder();
    },
  };
}

describe("secretary scope authorization (/api/convenios?scope=secretario seam)", () => {
  it("authorizes an active SA-wide secretary and narrows to her secretariat", async () => {
    const supabase = createFakeSupabase(membershipRows);

    expect(await hasActiveMembershipRole(supabase, "seba-sa-wide", "secretario")).toBe(true);
    expect(await getSecretariatIdsForSecretario(supabase, "seba-sa-wide")).toEqual([SA]);
  });

  it("authorizes an active career-scoped secretary and returns the same secretariat id", async () => {
    // App-layer narrowing intentionally does NOT split career-scoped vs
    // SA-wide secretaries: both resolve to the SA secretariat id. The
    // career-scoped deny of non-owned null-career práctica is enforced by RLS
    // `has_membership_exact_scope` (text-asserted in the RLS test file).
    const supabase = createFakeSupabase(membershipRows);

    expect(await hasActiveMembershipRole(supabase, "sec-career-a", "secretario")).toBe(true);
    expect(await getSecretariatIdsForSecretario(supabase, "sec-career-a")).toEqual([SA]);
  });

  it("denies a director-only user the secretario scope", async () => {
    const supabase = createFakeSupabase(membershipRows);

    expect(await hasActiveMembershipRole(supabase, "dir-only", "secretario")).toBe(false);
    expect(await getSecretariatIdsForSecretario(supabase, "dir-only")).toEqual([]);
  });

  it("ignores inactive secretary memberships", async () => {
    const supabase = createFakeSupabase(membershipRows);

    expect(await hasActiveMembershipRole(supabase, "inactive-sec", "secretario")).toBe(false);
    expect(await getSecretariatIdsForSecretario(supabase, "inactive-sec")).toEqual([]);
  });

  it("excludes secretary memberships with null secretariat_id from narrowing", async () => {
    const supabase = createFakeSupabase(membershipRows);

    // Role+active check still passes (so the route does not 403), but the
    // secretariat narrowing yields nothing -> route returns an empty list.
    expect(await hasActiveMembershipRole(supabase, "null-sec-secretary", "secretario")).toBe(true);
    expect(await getSecretariatIdsForSecretario(supabase, "null-sec-secretary")).toEqual([]);
  });

  it("returns no secretariats and denies scope for a user without memberships", async () => {
    const supabase = createFakeSupabase(membershipRows);

    expect(await hasActiveMembershipRole(supabase, "no-such-profile", "secretario")).toBe(false);
    expect(await getSecretariatIdsForSecretario(supabase, "no-such-profile")).toEqual([]);
  });
});
