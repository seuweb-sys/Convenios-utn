import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/20260515170000_fix_historical_practice_reclassification_trigger.sql"
);

describe("historical practice reclassification trigger migration", () => {
  it("allows privileged historical practice reclassification on updates", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");

    expect(sql).toContain("actor_is_admin_or_decano BOOLEAN := false");
    expect(sql).toContain("TG_OP = 'UPDATE'");
    expect(sql).toContain("OLD.agreement_year IS NOT DISTINCT FROM NEW.agreement_year");
    expect(sql).toContain("actor_is_admin_or_decano OR historical_year_unchanged_update");
  });

  it("keeps non-privileged historical practice creation blocked", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");

    expect(sql).toContain("Convenios de práctica no permiten carga histórica");
    expect(sql).toContain("año actual requerido salvo actualización histórica autorizada");
  });
});
