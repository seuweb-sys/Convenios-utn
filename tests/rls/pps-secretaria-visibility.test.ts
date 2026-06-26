import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Glob discovery: this test targets the PPS Secretaría visibility migration,
// which is created in Phase 2.3 of this change. The migration file MUST exist
// and follow the timestamp guard convention below.
function resolveMigrationPath(): string | null {
  const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
  if (!fs.existsSync(migrationsDir)) return null;
  const candidates = fs
    .readdirSync(migrationsDir)
    .filter((name) => /_pps_secretaria_visibility\.sql$/i.test(name));
  return candidates.length > 0
    ? path.join(migrationsDir, candidates[candidates.length - 1])
    : null;
}

function resolveCreateScopeFixMigrationPath(): string | null {
  const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
  if (!fs.existsSync(migrationsDir)) return null;
  const candidates = fs
    .readdirSync(migrationsDir)
    .filter((name) => /_pps_secretaria_visibility_create_scope_fix\.sql$/i.test(name))
    .sort();
  return candidates.length > 0
    ? path.join(migrationsDir, candidates[candidates.length - 1])
    : null;
}

describe("PPS Secretaría visibility migration (RLS text coverage)", () => {
  const migrationPath = resolveMigrationPath();
  const createScopeFixMigrationPath = resolveCreateScopeFixMigrationPath();

  it("is present under supabase/migrations", () => {
    expect(migrationPath).not.toBeNull();
    expect(fs.existsSync(migrationPath as string)).toBe(true);
  });

  it("defines has_membership_exact_scope helper", () => {
    const sql = fs.readFileSync(migrationPath as string, "utf-8");
    expect(sql).toContain(
      "CREATE OR REPLACE FUNCTION public.has_membership_exact_scope"
    );
    // NULL argument MUST mean membership column IS NULL (exact, not wildcard).
    expect(sql).toContain("(p_secretariat_id IS NULL AND pm.secretariat_id IS NULL)");
    expect(sql).toContain("(p_career_id IS NULL AND pm.career_id IS NULL)");
    expect(sql).toContain("(p_org_unit_id IS NULL AND pm.org_unit_id IS NULL)");
    // Non-NULL argument MUST match exactly.
    expect(sql).toContain("(p_secretariat_id IS NOT NULL AND pm.secretariat_id = p_secretariat_id)");
    expect(sql).toContain("(p_career_id IS NOT NULL AND pm.career_id = p_career_id)");
  });

  it("preserves owner-first access in can_view_convenio before any membership check", () => {
    const sql = fs.readFileSync(migrationPath as string, "utf-8");
    // Owner check MUST come before the práctica branch.
    const ownerIdx = sql.indexOf("IF cv.user_id = uid THEN");
    expect(ownerIdx).toBeGreaterThan(-1);
    const practiceIdx = sql.indexOf("IF cv.convenio_type_id IN (1, 5) THEN");
    expect(practiceIdx).toBeGreaterThan(-1);
    expect(practiceIdx).toBeGreaterThan(ownerIdx);
  });

  it("uses exact helper in can_view_convenio práctica branch with SA-wide allow + career-scoped path", () => {
    const sql = fs.readFileSync(migrationPath as string, "utf-8");
    const practiceIdx = sql.indexOf("IF cv.convenio_type_id IN (1, 5) THEN");
    expect(practiceIdx).toBeGreaterThan(-1);
    const practiceBlock = sql.slice(practiceIdx, practiceIdx + 900);

    // SA-wide secretario (career_id IS NULL) allow.
    expect(practiceBlock).toContain(
      "has_membership_exact_scope(uid,'secretario',cv.secretariat_id,NULL,NULL)"
    );
    // Career-scoped secretario path plus director/profesor.
    expect(practiceBlock).toContain(
      "has_membership_exact_scope(uid,'secretario',cv.secretariat_id,cv.career_id,NULL)"
    );
    expect(practiceBlock).toContain(
      "has_membership_exact_scope(uid,'director',cv.secretariat_id,cv.career_id,NULL)"
    );
    expect(practiceBlock).toContain(
      "has_membership_exact_scope(uid,'profesor',cv.secretariat_id,cv.career_id,NULL)"
    );
  });

  it("denies career-scoped secretario non-owned null-career practice (exact semantics only)", () => {
    const sql = fs.readFileSync(migrationPath as string, "utf-8");
    // The null-career (secretariat-wide) branch MUST call exact helper with
    // career_id NULL — a career-scoped secretario (career_id set) must NOT match.
    const practiceIdx = sql.indexOf("IF cv.convenio_type_id IN (1, 5) THEN");
    const practiceBlock = sql.slice(practiceIdx, practiceIdx + 400);
    expect(practiceBlock).toMatch(/IF cv\.career_id IS NULL THEN[\s\S]*?has_membership_exact_scope\(uid,'secretario',cv\.secretariat_id,NULL,NULL\)/);
  });

  it("uses exact helper in can_create_in_scope práctica branch", () => {
    const sql = fs.readFileSync(migrationPath as string, "utf-8");
    const createIdx = sql.indexOf("IF p_convenio_type_id IN (1, 5) THEN");
    expect(createIdx).toBeGreaterThan(-1);
    const block = sql.slice(createIdx, createIdx + 900);
    expect(block).toContain(
      "has_membership_exact_scope(uid,'secretario',p_secretariat_id,NULL,NULL)"
    );
    expect(block).toContain(
      "has_membership_exact_scope(uid,'secretario',p_secretariat_id,p_career_id,NULL)"
    );
    expect(block).toContain(
      "has_membership_exact_scope(uid,'director',p_secretariat_id,p_career_id,NULL)"
    );
    expect(block).toContain(
      "has_membership_exact_scope(uid,'profesor',p_secretariat_id,p_career_id,NULL)"
    );
  });

  it("preserves sec_code <> 'SA' guard for practice creation", () => {
    const sql = fs.readFileSync(migrationPath as string, "utf-8");
    expect(sql).toContain("sec_code <> 'SA'");
  });

  it("creates dedicated membership correction audit table before any Seba update", () => {
    const sql = fs.readFileSync(migrationPath as string, "utf-8");
    const auditIdx = sql.indexOf("profile_membership_correction_audit");
    expect(auditIdx).toBeGreaterThan(-1);
    // Snapshot before flipping Seba's rows.
    expect(sql).toContain(
      "last_state"
    );
    // Correction MUST validate the one-active-career-scoped +
    // one-inactive-null-career precondition.
    expect(sql).toContain("seba_bisson");
    expect(sql).toContain("is_active = false");
  });

  it("does not duplicate active secretario SA memberships after correction", () => {
    const sql = fs.readFileSync(migrationPath as string, "utf-8");
    // Single-active-SA-secretario invariant verification block.
    expect(sql).toContain("no duplicate active secretario SA memberships");
  });

  // Corrective batch: gatekeeper re-review found two CRITICAL regressions and
  // these tests must fail on the buggy migration text so the gate cannot slip.
  it("enables RLS on the membership correction audit table itself (policy alone is inert)", () => {
    const sql = fs.readFileSync(migrationPath as string, "utf-8");
    // The audit POLICY is attached to profile_membership_correction_audit, so
    // RLS MUST be ENABLE ROW LEVEL SECURITY'd on that exact table — enabling RLS
    // only on profile_memberships leaves the policy inert.
    expect(sql).toMatch(
      /ALTER TABLE public\.profile_membership_correction_audit\s+ENABLE ROW LEVEL SECURITY\s*;/,
    );
  });

  it("uses replay-safe DROP POLICY + CREATE POLICY syntax for the audit policy", () => {
    const sql = fs.readFileSync(migrationPath as string, "utf-8");

    expect(sql).not.toContain("CREATE POLICY IF NOT EXISTS");
    expect(sql).toContain(
      'DROP POLICY IF EXISTS "profile_memberships_correction_audit_admin" ON public.profile_membership_correction_audit;',
    );
    expect(sql).toContain(
      'CREATE POLICY "profile_memberships_correction_audit_admin"',
    );
  });

  it("can_create_in_scope: null-career practice creation allowed for SA-wide secretario (sec_code <> 'SA' guard preserved,career-null short-circuit removed)", () => {
    const sql = fs.readFileSync(migrationPath as string, "utf-8");
    const createIdx = sql.indexOf("IF p_convenio_type_id IN (1, 5) THEN");
    expect(createIdx).toBeGreaterThan(-1);
    const block = sql.slice(createIdx, createIdx + 1200);

    // The guard MUST scope only to sec_code <> 'SA'. The buggy form
    // `sec_code <> 'SA' OR p_career_id IS NULL` short-circuits every null-career
    // practice creation to RETURN false, which destroys the SA-wide secretario
    // null-career creation path required by the design contract.
    expect(block).not.toMatch(/sec_code\s*<>\s*'SA'\s+OR\s+p_career_id IS NULL/);

    // The práctica branch MUST contain an explicit null-career branch returning
    // the exact SA-wide secretario allow before the wider scoped return.
    expect(block).toMatch(
      /IF p_career_id IS NULL THEN[\s\S]{0,200}RETURN has_membership_exact_scope\(uid,'secretario',p_secretariat_id,NULL,NULL\)/,
    );

    // sec_code <> 'SA' guard itself MUST still be present (reject non-SA practice creation).
    expect(block).toMatch(/sec_code\s*<>\s*'SA'/);
  });

  it("adds a follow-up migration for the production create-scope correction", () => {
    expect(createScopeFixMigrationPath).not.toBeNull();
    expect(fs.existsSync(createScopeFixMigrationPath as string)).toBe(true);
    expect(path.basename(createScopeFixMigrationPath as string) > "20260624010000_pps_secretaria_visibility.sql").toBe(true);
  });

  it("follow-up migration patches only can_create_in_scope with the SA-wide secretario shortcut for career-scoped practice creation", () => {
    const sql = fs.readFileSync(createScopeFixMigrationPath as string, "utf-8");

    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.can_create_in_scope");
    expect(sql).not.toContain("CREATE OR REPLACE FUNCTION public.can_view_convenio");
    expect(sql).not.toContain("CREATE OR REPLACE FUNCTION public.validate_convenio_scope");

    const practiceIdx = sql.indexOf("IF p_convenio_type_id IN (1, 5) THEN");
    expect(practiceIdx).toBeGreaterThan(-1);
    const block = sql.slice(practiceIdx, practiceIdx + 900);

    expect(block).toMatch(/IF sec_code <> 'SA' THEN[\s\S]{0,80}RETURN false;/);
    expect(block).toMatch(
      /IF has_membership_exact_scope\(uid,'secretario',p_secretariat_id,NULL,NULL\) THEN[\s\S]{0,80}RETURN true;/,
    );
    expect(block).toMatch(/IF p_career_id IS NULL THEN[\s\S]{0,80}RETURN false;/);
    expect(block).toContain(
      "has_membership_exact_scope(uid,'secretario',p_secretariat_id,p_career_id,NULL)",
    );
    expect(block).toContain(
      "has_membership_exact_scope(uid,'director',p_secretariat_id,p_career_id,NULL)",
    );
    expect(block).toContain(
      "has_membership_exact_scope(uid,'profesor',p_secretariat_id,p_career_id,NULL)",
    );
  });
});
