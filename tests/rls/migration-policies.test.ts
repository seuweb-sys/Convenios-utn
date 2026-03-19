import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/20260319193000_refactor_convenios_org_architecture.sql"
);

describe("RLS migration coverage", () => {
  it("contains helper authz SQL functions", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");

    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.is_admin");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.is_decano");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.can_view_convenio");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.can_create_in_scope");
  });

  it("contains convenios policies aligned with scope", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");

    expect(sql).toContain("CREATE POLICY \"convenios_select_by_scope\"");
    expect(sql).toContain("CREATE POLICY \"convenios_insert_by_scope\"");
    expect(sql).toContain("CREATE POLICY \"convenios_update_owner_admin_secretary_decano\"");
    expect(sql).toContain("CREATE POLICY \"convenios_delete_owner_admin\"");
  });

  it("contains legacy and hidden-area controls", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");

    expect(sql).toContain("legacy_unclassified");
    expect(sql).toContain("is_hidden_from_area");
    expect(sql).toContain("hidden_set_by");
  });
});
