import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function resolveMigrationPath(): string | null {
  const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
  if (!fs.existsSync(migrationsDir)) return null;

  const candidates = fs
    .readdirSync(migrationsDir)
    .filter((name) => /_membership_scope_rules\.sql$/i.test(name))
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

describe("membership scope rules migration (RLS text coverage)", () => {
  it("is present under supabase/migrations", () => {
    const migrationPath = resolveMigrationPath();
    expect(migrationPath).not.toBeNull();
    expect(fs.existsSync(migrationPath as string)).toBe(true);
  });

  it("reconciles profile_membership_correction_audit to the live previous_rows schema", () => {
    const sql = readMigration();

    expect(sql).toContain("CREATE TABLE public.profile_membership_correction_audit (");
    expect(sql).toContain("correction_key TEXT NOT NULL");
    expect(sql).toContain("profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE");
    expect(sql).toContain("previous_rows JSONB NOT NULL");
    expect(sql).toContain("applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())");
    expect(sql).toContain("applied_by TEXT NOT NULL DEFAULT CURRENT_USER");

    expect(sql).toContain("jsonb_agg(to_jsonb(pm) ORDER BY pm.id)");
    expect(sql).not.toContain("membership_id UUID NOT NULL REFERENCES public.profile_memberships(id)");
    expect(sql).not.toContain("last_state JSONB NOT NULL");
  });

  it("uses stable-code/name lookups with exact-match assertions and aborts preflight on unexpected rows", () => {
    const sql = readMigration();

    expect(sql).toContain("WHERE s.code = 'SA'");
    expect(sql).toContain("WHERE c.code = 'ISI'");
    expect(sql).toContain("WHERE p.full_name = 'E2E Director'");
    expect(sql).toContain("WHERE p.full_name = 'Sebastián Bisson'");
    expect(sql).toContain("COUNT(*) INTO sa_count");
    expect(sql).toContain("COUNT(*) INTO isi_count");
    expect(sql).toContain("COUNT(*) INTO e2e_director_count");
    expect(sql).toContain("COUNT(*) INTO seba_profile_count");
    expect(sql).toContain("IF sa_count <> 1 THEN");
    expect(sql).toContain("IF isi_count <> 1 THEN");
    expect(sql).toContain("IF e2e_director_count <> 1 THEN");
    expect(sql).toContain("IF seba_profile_count <> 1 THEN");
    expect(sql).toContain("Preflight aborted: unexpected membership scope violations detected");
  });

  it("adds secretary/director-profesor CHECK constraints plus an SA-only trigger", () => {
    const sql = readMigration();

    expect(sql).toContain("profile_memberships_secretario_null_career_chk");
    expect(sql).toContain("membership_role <> 'secretario' OR (secretariat_id IS NOT NULL AND career_id IS NULL)");
    expect(sql).toContain("profile_memberships_director_profesor_require_career_chk");
    expect(sql).toContain("membership_role NOT IN ('director', 'profesor') OR career_id IS NOT NULL");

    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.enforce_membership_scope_rules()");
    expect(sql).toContain("IF NEW.membership_role IN ('director', 'profesor') THEN");
    expect(sql).toContain("secretariat_code IS DISTINCT FROM 'SA'");
    expect(sql).toContain("director/profesor memberships must belong to SA");
    expect(sql).toContain("DROP TRIGGER IF EXISTS trg_enforce_membership_scope_rules ON public.profile_memberships;");
    expect(sql).toContain("CREATE TRIGGER trg_enforce_membership_scope_rules");
  });

  it("audits the E2E director update and Seba delete, then documents collision-safe rollback and post-checks", () => {
    const sql = readMigration();

    expect(sql).toContain("'membership_scope_rules_2026_06_26'");
    expect(sql).toContain("UPDATE public.profile_memberships");
    expect(sql).toContain("SET secretariat_id = sa_id,");
    expect(sql).toContain("career_id = isi_id,");
    expect(sql).toContain("DELETE FROM public.profile_memberships");
    expect(sql).toContain("AND seba_valid_secretario_active_id IS NOT NULL");
    expect(sql).toContain("Rollback note:");
    expect(sql).toContain("restore the deleted Sebastián Bisson row as inactive");
    expect(sql).toContain("avoid uq_profile_memberships_active_scope collisions");
    expect(sql).toContain("Post-check failed: active membership scope violations remain");
  });

  it("ensures a unique correction_key/profile_id conflict target before using ON CONFLICT so live audit rows remain safe", () => {
    const sql = readMigration();

    expect(sql).toContain("ADD CONSTRAINT profile_membership_correction_audit_correction_key_profile_id_key");
    expect(sql).toContain("UNIQUE (correction_key, profile_id)");
    expect(sql).toContain("ON CONFLICT (correction_key, profile_id) DO UPDATE");
  });

  it("does not treat the live id+previous_rows audit shape as legacy just because id exists", () => {
    const sql = readMigration();

    expect(sql).toContain("c.column_name IN ('membership_id', 'last_state')");
    expect(sql).not.toContain("c.column_name IN ('membership_id', 'membership_role', 'secretariat_id', 'career_id', 'org_unit_id', 'is_active', 'last_state', 'id')");
    expect(sql).toContain("jsonb_agg(last_state ORDER BY membership_id) AS previous_rows");
  });

  it("uses an unambiguous correction key variable in the audit upsert instead of selecting a bare correction_key identifier", () => {
    const sql = readMigration();

    expect(sql).toContain("v_correction_key CONSTANT TEXT := 'membership_scope_rules_2026_06_26';");
    expect(sql).toMatch(/SELECT\s+v_correction_key,\s+pm\.profile_id,\s+jsonb_agg\(to_jsonb\(pm\) ORDER BY pm\.id\)/);
    expect(sql).not.toMatch(/SELECT\s+correction_key,\s+pm\.profile_id,\s+jsonb_agg\(to_jsonb\(pm\) ORDER BY pm\.id\)/);
  });

  it("omits applied_by from corrective audit writes so production keeps its text default/current_user shape", () => {
    const sql = readMigration();
    const correctiveInsertStart = sql.indexOf("INSERT INTO public.profile_membership_correction_audit (\n    correction_key,");
    const correctiveInsertEnd = sql.indexOf("UPDATE public.profile_memberships", correctiveInsertStart);
    const correctiveInsertBlock = sql.slice(correctiveInsertStart, correctiveInsertEnd);

    expect(sql).not.toContain("NULL::UUID AS applied_by");
    expect(sql).not.toContain("ADD COLUMN IF NOT EXISTS applied_by UUID REFERENCES public.profiles(id)");
    expect(correctiveInsertStart).toBeGreaterThan(-1);
    expect(correctiveInsertBlock).toContain("SELECT\n    v_correction_key,");
    expect(correctiveInsertBlock).toContain("applied_at");
    expect(correctiveInsertBlock).not.toContain("applied_by");
    expect(sql).not.toContain("applied_by = EXCLUDED.applied_by");
  });
});
