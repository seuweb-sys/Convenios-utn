import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Text assertions for the membership-secretary-secretariat-scope migration.
 *
 * The RLS/Vitest SQL-text pattern is the safest way to assert DDL contracts
 * without mutating any Supabase project. Each scenario from the spec maps to a
 * text-level guarantee so the migration rollback is reviewable in CI.
 */

const MIGRATION_REGEX = /_membership_secretary_secretariat_scope\.sql$/i;

function resolveMigrationPath(): string | null {
  const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
  if (!fs.existsSync(migrationsDir)) return null;

  const candidates = fs
    .readdirSync(migrationsDir)
    .filter((name) => MIGRATION_REGEX.test(name))
    .sort();

  return candidates.length > 0
    ? path.join(migrationsDir, candidates[candidates.length - 1])
    : null;
}

function readMigration(): string {
  const migrationPath = resolveMigrationPath();
  expect(migrationPath).not.toBeNull();
  expect(fs.existsSync(migrationPath as string)).toBe(true);
  return fs.readFileSync(migrationPath as string, "utf-8");
}

describe("membership-secretary-secretariat-scope migration (RLS text coverage)", () => {
  it("is present under supabase/migrations with a *_membership_secretary_secretariat_scope.sql name", () => {
    const migrationPath = resolveMigrationPath();
    expect(migrationPath).not.toBeNull();
    expect(fs.existsSync(migrationPath as string)).toBe(true);
  });

  it("runs a preflight that counts secretario org_unit violators and CYT/SEU career violators", () => {
    const sql = readMigration();

    // Both violator classes are counted before any DDL.
    expect(sql).toContain("membership_role = 'secretario'");
    expect(sql).toContain("pm.org_unit_id IS NOT NULL");
    expect(sql).toContain("s.code IN ('CYT', 'SEU')");
    expect(sql).toContain("pm.career_id IS NOT NULL");

    // Counts flow into plpgsql variables used by the abort decision.
    expect(sql).toMatch(/v_secretario_org_unit_count\s+INTEGER/i);
    expect(sql).toMatch(/v_cyt_seu_career_count\s+INTEGER/i);
    expect(sql).toMatch(/INTO\s+v_secretario_org_unit_count/i);
    expect(sql).toMatch(/INTO\s+v_cyt_seu_career_count/i);
  });

  it("emits RAISE NOTICE row details for offenders before aborting (dirty preflight scenario)", () => {
    const sql = readMigration();

    // Row-level notices: the migration SHOULD report offender rows.
    expect(sql).toContain("RAISE NOTICE");
    expect(sql).toContain("Preflight violator");
    // Each row notice surfaces the columns needed to triage the violation.
    expect(sql).toContain("r.id");
    expect(sql).toContain("r.profile_id");
    expect(sql).toContain("r.membership_role");
    expect(sql).toContain("r.secretariat_id");
    expect(sql).toContain("r.career_id");
    expect(sql).toContain("r.org_unit_id");
  });

  it("aborts before DDL with RAISE EXCEPTION carrying both violator counts", () => {
    const sql = readMigration();

    expect(sql).toContain("RAISE EXCEPTION");
    expect(sql).toContain("membership_secretary_secretariat_scope preflight aborted");
    // Counts appear in the exception text so CI/review get a deterministic message.
    expect(sql).toMatch(/% secretario org_unit violators/);
    expect(sql).toMatch(/% CYT\/SEU career violators/);
    expect(sql).toContain("v_secretario_org_unit_count");
    expect(sql).toContain("v_cyt_seu_career_count");
  });

  it("extends enforce_membership_scope_rules() to reject CYT/SEU writes that set career_id", () => {
    const sql = readMigration();

    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.enforce_membership_scope_rules()");
    expect(sql).toContain("IF NEW.career_id IS NOT NULL THEN");
    expect(sql).toContain("s.id = NEW.secretariat_id");
    expect(sql).toContain("IF secretariat_code IN ('CYT','SEU') THEN");
    expect(sql).toContain("CYT/SEU memberships must not set career_id");
    // Preserve the prior director/profesor SA-only branch.
    expect(sql).toContain("IF NEW.membership_role IN ('director', 'profesor') THEN");
    expect(sql).toContain("director/profesor memberships must belong to SA");
    // The trigger is restored against the in-place function.
    expect(sql).toContain("DROP TRIGGER IF EXISTS trg_enforce_membership_scope_rules ON public.profile_memberships;");
    expect(sql).toContain("CREATE TRIGGER trg_enforce_membership_scope_rules");
    expect(sql).toContain("BEFORE INSERT OR UPDATE ON public.profile_memberships");
  });

  it("adds a local secretario null org_unit CHECK constraint (no cross-table lookup needed)", () => {
    const sql = readMigration();

    expect(sql).toContain(
      "profile_memberships_secretario_null_org_unit_chk",
    );
    expect(sql).toContain(
      "CHECK (membership_role <> 'secretario' OR org_unit_id IS NULL)",
    );
    // Drop idempotency before re-adding.
    expect(sql).toContain(
      "DROP CONSTRAINT IF EXISTS profile_memberships_secretario_null_org_unit_chk",
    );
  });

  it("runs a post-check that asserts zero remaining violators after DDL", () => {
    const sql = readMigration();

    expect(sql).toContain("remaining_secretario_org_unit_count");
    expect(sql).toContain("remaining_cyt_seu_career_count");
    expect(sql).toContain("membership_secretary_secretariat_scope post-check failed");
    expect(sql).toMatch(/% secretario org_unit violators/);
    expect(sql).toMatch(/% CYT\/SEU career violators/);
  });

  it("documents a direct-Supabase rollback note that restores the prior trigger and drops the CHECK", () => {
    const sql = readMigration();

    expect(sql).toContain("Rollback note:");
    expect(sql).toContain("DROP TRIGGER trg_enforce_membership_scope_rules");
    expect(sql).toContain("DROP CONSTRAINT profile_memberships_secretario_null_org_unit_chk");
    expect(sql).toContain("20260626010000_membership_scope_rules.sql");
  });
});