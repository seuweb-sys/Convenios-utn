-- Membership secretary secretariat scope: PR1 DB invariants.
--
-- This migration is the PR1 DB slice for the membership-secretary-secretariat-scope
-- change. It enforces:
--   - secretario rows MUST keep org_unit_id NULL (local CHECK, no cross-table lookup).
--   - CYT/SEU memberships MUST keep career_id NULL (trigger extension, joins secretariats).
--
-- The migration starts with a preflight that emits RAISE NOTICE row details for
-- any offenders and aborts before DDL with RAISE EXCEPTION carrying the violator
-- counts. After DDL, a post-check asserts zero remaining violators.
--
-- Rollout: direct Supabase only (no production mutation performed as part of PR1
-- code review). The preflight must report zero violators; the post-check must
-- keep zero violators after the DDL applies.

-- 1) Preflight: emit row-level notices for offenders, then abort with counts
--    before any DDL runs.
DO $$
DECLARE
  v_secretario_org_unit_count INTEGER;
  v_cyt_seu_career_count INTEGER;
  r RECORD;
BEGIN
  SELECT COUNT(*) INTO v_secretario_org_unit_count
  FROM public.profile_memberships pm
  WHERE pm.membership_role = 'secretario'
    AND pm.org_unit_id IS NOT NULL;

  SELECT COUNT(*) INTO v_cyt_seu_career_count
  FROM public.profile_memberships pm
  JOIN public.secretariats s ON s.id = pm.secretariat_id
  WHERE s.code IN ('CYT', 'SEU')
    AND pm.career_id IS NOT NULL;

  IF v_secretario_org_unit_count > 0 OR v_cyt_seu_career_count > 0 THEN
    FOR r IN
      SELECT
        pm.id,
        pm.profile_id,
        pm.membership_role,
        pm.secretariat_id,
        pm.career_id,
        pm.org_unit_id
      FROM public.profile_memberships pm
      WHERE
        (
          pm.membership_role = 'secretario'
          AND pm.org_unit_id IS NOT NULL
        )
        OR (
          EXISTS (
            SELECT 1
            FROM public.secretariats s
            WHERE s.id = pm.secretariat_id AND s.code IN ('CYT','SEU')
          )
          AND pm.career_id IS NOT NULL
        )
    LOOP
      RAISE NOTICE 'Preflight violator: id=% profile_id=% role=% secretariat_id=% career_id=% org_unit_id=%',
        r.id, r.profile_id, r.membership_role, r.secretariat_id, r.career_id, r.org_unit_id;
    END LOOP;

    RAISE EXCEPTION 'membership_secretary_secretariat_scope preflight aborted: % secretario org_unit violators, % CYT/SEU career violators',
      v_secretario_org_unit_count, v_cyt_seu_career_count;
  END IF;
END $$;

-- 2) Local CHECK: secretario MUST keep org_unit_id NULL.
--    Local (no secretariats join) because only the row role is needed.
ALTER TABLE public.profile_memberships
  DROP CONSTRAINT IF EXISTS profile_memberships_secretario_null_org_unit_chk;

ALTER TABLE public.profile_memberships
  ADD CONSTRAINT profile_memberships_secretario_null_org_unit_chk
  CHECK (membership_role <> 'secretario' OR org_unit_id IS NULL);

-- 3) Extend the membership scope rules trigger to reject CYT/SEU writes that
--    set career_id. Preserve the existing director/profesor SA-only branch.
--    Re-drop and recreate the trigger so the new function body is bound.
CREATE OR REPLACE FUNCTION public.enforce_membership_scope_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secretariat_code TEXT;
BEGIN
  IF NEW.membership_role IN ('director', 'profesor') THEN
    SELECT s.code INTO secretariat_code
    FROM public.secretariats s
    WHERE s.id = NEW.secretariat_id;

    IF secretariat_code IS DISTINCT FROM 'SA' THEN
      RAISE EXCEPTION 'director/profesor memberships must belong to SA';
    END IF;
  END IF;

  IF NEW.career_id IS NOT NULL THEN
    SELECT s.code INTO secretariat_code
    FROM public.secretariats s
    WHERE s.id = NEW.secretariat_id;

    IF secretariat_code IN ('CYT','SEU') THEN
      RAISE EXCEPTION 'CYT/SEU memberships must not set career_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_membership_scope_rules ON public.profile_memberships;

CREATE TRIGGER trg_enforce_membership_scope_rules
BEFORE INSERT OR UPDATE ON public.profile_memberships
FOR EACH ROW
EXECUTE FUNCTION public.enforce_membership_scope_rules();

-- 4) Post-check: assert zero remaining violators after the DDL applies.
DO $$
DECLARE
  remaining_secretario_org_unit_count INTEGER;
  remaining_cyt_seu_career_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_secretario_org_unit_count
  FROM public.profile_memberships pm
  WHERE pm.membership_role = 'secretario'
    AND pm.org_unit_id IS NOT NULL;

  SELECT COUNT(*) INTO remaining_cyt_seu_career_count
  FROM public.profile_memberships pm
  JOIN public.secretariats s ON s.id = pm.secretariat_id
  WHERE s.code IN ('CYT','SEU')
    AND pm.career_id IS NOT NULL;

  IF remaining_secretario_org_unit_count <> 0 OR remaining_cyt_seu_career_count <> 0 THEN
    RAISE EXCEPTION 'membership_secretary_secretariat_scope post-check failed: % secretario org_unit violators, % CYT/SEU career violators',
      remaining_secretario_org_unit_count, remaining_cyt_seu_career_count;
  END IF;
END $$;

-- Rollback note:
-- 1. DROP TRIGGER trg_enforce_membership_scope_rules ON public.profile_memberships.
-- 2. DROP CONSTRAINT profile_memberships_secretario_null_org_unit_chk.
-- 3. Recreate enforce_membership_scope_rules() without the CYT/SEU career_id branch.
--    See prior migration 20260626010000_membership_scope_rules.sql for the original function body.
-- 4. Recreate the trigger afterwards so the restored function is bound.
-- 5. No corrective data rows are required because the preflight guarantees zero
--    violators before DDL and the post-check guarantees zero after.