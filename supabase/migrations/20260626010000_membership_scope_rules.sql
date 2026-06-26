-- Membership scope rules: audited data correction + DB invariants.
--
-- This migration intentionally targets the PR1 DB/audit slice only:
-- - Reconcile local/CI profile_membership_correction_audit to the live shape.
-- - Abort when preflight finds unexpected violators.
-- - Audit and correct the known E2E Director / Sebastián Bisson rows.
-- - Enforce secretario/director/profesor scope invariants at the DB layer.

-- 1) Reconcile local/CI audit table to the live rollback shape used in production.
DO $$
DECLARE
  audit_table_exists BOOLEAN;
  has_legacy_shape BOOLEAN;
BEGIN
  SELECT to_regclass('public.profile_membership_correction_audit') IS NOT NULL
  INTO audit_table_exists;

  IF NOT audit_table_exists THEN
    EXECUTE $create_table$
      CREATE TABLE public.profile_membership_correction_audit (
        correction_key TEXT NOT NULL,
        profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        previous_rows JSONB NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        applied_by TEXT NOT NULL DEFAULT CURRENT_USER,
        PRIMARY KEY (correction_key, profile_id)
      );
    $create_table$;
  ELSE
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = 'profile_membership_correction_audit'
        AND c.column_name IN ('membership_id', 'last_state')
    ) INTO has_legacy_shape;

    IF has_legacy_shape THEN
      CREATE TEMP TABLE membership_scope_rules_audit_backup ON COMMIT DROP AS
      SELECT
        correction_key,
        profile_id,
        jsonb_agg(last_state ORDER BY membership_id) AS previous_rows,
        min(applied_at) AS applied_at
      FROM public.profile_membership_correction_audit
      GROUP BY correction_key, profile_id;

      DROP TABLE public.profile_membership_correction_audit;

      EXECUTE $create_table$
        CREATE TABLE public.profile_membership_correction_audit (
          correction_key TEXT NOT NULL,
          profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
          previous_rows JSONB NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
          applied_by TEXT NOT NULL DEFAULT CURRENT_USER,
          PRIMARY KEY (correction_key, profile_id)
        );
      $create_table$;

      INSERT INTO public.profile_membership_correction_audit (
        correction_key,
        profile_id,
        previous_rows,
        applied_at
      )
      SELECT
        correction_key,
        profile_id,
        previous_rows,
        COALESCE(applied_at, timezone('utc'::text, now()))
      FROM membership_scope_rules_audit_backup;
    ELSE
      ALTER TABLE public.profile_membership_correction_audit
        ADD COLUMN IF NOT EXISTS previous_rows JSONB,
        ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS applied_by TEXT;

      UPDATE public.profile_membership_correction_audit
      SET previous_rows = '[]'::jsonb
      WHERE previous_rows IS NULL;

      UPDATE public.profile_membership_correction_audit
      SET applied_at = timezone('utc'::text, now())
      WHERE applied_at IS NULL;

      ALTER TABLE public.profile_membership_correction_audit
        ALTER COLUMN previous_rows SET NOT NULL,
        ALTER COLUMN applied_at SET NOT NULL,
        ALTER COLUMN applied_at SET DEFAULT timezone('utc'::text, now());

      UPDATE public.profile_membership_correction_audit
      SET applied_by = CURRENT_USER
      WHERE applied_by IS NULL;

      ALTER TABLE public.profile_membership_correction_audit
        ALTER COLUMN applied_by SET DEFAULT CURRENT_USER,
        ALTER COLUMN applied_by SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Ensure ON CONFLICT has a valid live-table conflict target without replacing existing rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'profile_membership_correction_audit'
      AND indexdef ILIKE 'CREATE UNIQUE INDEX%'
      AND indexdef ILIKE '%(correction_key, profile_id)%'
  ) THEN
    ALTER TABLE public.profile_membership_correction_audit
      ADD CONSTRAINT profile_membership_correction_audit_correction_key_profile_id_key
      UNIQUE (correction_key, profile_id);
  END IF;
END $$;

ALTER TABLE public.profile_membership_correction_audit
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_memberships_correction_audit_admin"
  ON public.profile_membership_correction_audit;

CREATE POLICY "profile_memberships_correction_audit_admin"
  ON public.profile_membership_correction_audit
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2) Preflight + audited correction.
DO $$
DECLARE
  v_correction_key CONSTANT TEXT := 'membership_scope_rules_2026_06_26';
  sa_id UUID;
  isi_id UUID;
  e2e_director_profile_id UUID;
  seba_profile_id UUID;
  e2e_director_membership_id UUID;
  seba_invalid_secretario_id UUID;
  seba_valid_secretario_active_id UUID;
  sa_count INTEGER;
  isi_count INTEGER;
  e2e_director_count INTEGER;
  seba_profile_count INTEGER;
  e2e_director_membership_count INTEGER;
  seba_invalid_secretario_count INTEGER;
  seba_valid_secretario_active_count INTEGER;
  unexpected_secretario_count INTEGER;
  unexpected_non_sa_director_count INTEGER;
  unexpected_null_career_director_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sa_count
  FROM public.secretariats s
  WHERE s.code = 'SA';

  IF sa_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one SA secretariat, found %', sa_count;
  END IF;

  SELECT s.id INTO sa_id
  FROM public.secretariats s
  WHERE s.code = 'SA';

  SELECT COUNT(*) INTO isi_count
  FROM public.careers c
  WHERE c.code = 'ISI';

  IF isi_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one ISI career, found %', isi_count;
  END IF;

  SELECT c.id INTO isi_id
  FROM public.careers c
  WHERE c.code = 'ISI';

  SELECT COUNT(*) INTO e2e_director_count
  FROM public.profiles p
  WHERE p.full_name = 'E2E Director';

  IF e2e_director_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one E2E Director profile, found %', e2e_director_count;
  END IF;

  SELECT p.id INTO e2e_director_profile_id
  FROM public.profiles p
  WHERE p.full_name = 'E2E Director';

  SELECT COUNT(*) INTO seba_profile_count
  FROM public.profiles p
  WHERE p.full_name = 'Sebastián Bisson';

  IF seba_profile_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one Sebastián Bisson profile, found %', seba_profile_count;
  END IF;

  SELECT p.id INTO seba_profile_id
  FROM public.profiles p
  WHERE p.full_name = 'Sebastián Bisson';

  SELECT COUNT(*) INTO e2e_director_membership_count
  FROM public.profile_memberships pm
  JOIN public.secretariats s ON s.id = pm.secretariat_id
  WHERE pm.profile_id = e2e_director_profile_id
    AND pm.membership_role = 'director'
    AND pm.is_active = true
    AND s.code = 'CYT'
    AND pm.career_id IS NULL;

  IF e2e_director_membership_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active invalid E2E Director membership, found %', e2e_director_membership_count;
  END IF;

  SELECT pm.id INTO e2e_director_membership_id
  FROM public.profile_memberships pm
  JOIN public.secretariats s ON s.id = pm.secretariat_id
  WHERE pm.profile_id = e2e_director_profile_id
    AND pm.membership_role = 'director'
    AND pm.is_active = true
    AND s.code = 'CYT'
    AND pm.career_id IS NULL;

  SELECT COUNT(*) INTO seba_invalid_secretario_count
  FROM public.profile_memberships pm
  WHERE pm.profile_id = seba_profile_id
    AND pm.membership_role = 'secretario'
    AND pm.secretariat_id = sa_id
    AND pm.career_id = isi_id
    AND pm.is_active = false;

  IF seba_invalid_secretario_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one inactive invalid Sebastián Bisson secretario membership, found %', seba_invalid_secretario_count;
  END IF;

  SELECT pm.id INTO seba_invalid_secretario_id
  FROM public.profile_memberships pm
  WHERE pm.profile_id = seba_profile_id
    AND pm.membership_role = 'secretario'
    AND pm.secretariat_id = sa_id
    AND pm.career_id = isi_id
    AND pm.is_active = false;

  SELECT COUNT(*) INTO seba_valid_secretario_active_count
  FROM public.profile_memberships pm
  WHERE pm.profile_id = seba_profile_id
    AND pm.membership_role = 'secretario'
    AND pm.secretariat_id = sa_id
    AND pm.career_id IS NULL
    AND pm.is_active = true;

  IF seba_valid_secretario_active_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active valid Sebastián Bisson secretario membership, found %', seba_valid_secretario_active_count;
  END IF;

  SELECT pm.id INTO seba_valid_secretario_active_id
  FROM public.profile_memberships pm
  WHERE pm.profile_id = seba_profile_id
    AND pm.membership_role = 'secretario'
    AND pm.secretariat_id = sa_id
    AND pm.career_id IS NULL
    AND pm.is_active = true;

  SELECT COUNT(*) INTO unexpected_secretario_count
  FROM public.profile_memberships pm
  WHERE pm.membership_role = 'secretario'
    AND pm.career_id IS NOT NULL
    AND pm.id <> seba_invalid_secretario_id;

  SELECT COUNT(*) INTO unexpected_non_sa_director_count
  FROM public.profile_memberships pm
  LEFT JOIN public.secretariats s ON s.id = pm.secretariat_id
  WHERE pm.membership_role IN ('director', 'profesor')
    AND s.code IS DISTINCT FROM 'SA'
    AND pm.id <> e2e_director_membership_id;

  SELECT COUNT(*) INTO unexpected_null_career_director_count
  FROM public.profile_memberships pm
  WHERE pm.membership_role IN ('director', 'profesor')
    AND pm.career_id IS NULL
    AND pm.id <> e2e_director_membership_id;

  IF unexpected_secretario_count <> 0
    OR unexpected_non_sa_director_count <> 0
    OR unexpected_null_career_director_count <> 0 THEN
    RAISE EXCEPTION 'Preflight aborted: unexpected membership scope violations detected';
  END IF;

  INSERT INTO public.profile_membership_correction_audit (
    correction_key,
    profile_id,
    previous_rows,
    applied_at
  )
  SELECT
    v_correction_key,
    pm.profile_id,
    jsonb_agg(to_jsonb(pm) ORDER BY pm.id),
    timezone('utc'::text, now())
  FROM public.profile_memberships pm
  WHERE pm.id IN (e2e_director_membership_id, seba_invalid_secretario_id)
  GROUP BY pm.profile_id
  ON CONFLICT (correction_key, profile_id) DO UPDATE
  SET previous_rows = EXCLUDED.previous_rows,
      applied_at = EXCLUDED.applied_at;

  UPDATE public.profile_memberships
  SET secretariat_id = sa_id,
      career_id = isi_id,
      org_unit_id = NULL,
      is_active = true
  WHERE id = e2e_director_membership_id;

  DELETE FROM public.profile_memberships
  WHERE id = seba_invalid_secretario_id
    AND seba_valid_secretario_active_id IS NOT NULL;
END $$;

-- 3) DB invariants.
ALTER TABLE public.profile_memberships
  DROP CONSTRAINT IF EXISTS profile_memberships_secretario_null_career_chk;

ALTER TABLE public.profile_memberships
  ADD CONSTRAINT profile_memberships_secretario_null_career_chk
  CHECK (
    membership_role <> 'secretario' OR (secretariat_id IS NOT NULL AND career_id IS NULL)
  );

ALTER TABLE public.profile_memberships
  DROP CONSTRAINT IF EXISTS profile_memberships_director_profesor_require_career_chk;

ALTER TABLE public.profile_memberships
  ADD CONSTRAINT profile_memberships_director_profesor_require_career_chk
  CHECK (
    membership_role NOT IN ('director', 'profesor') OR career_id IS NOT NULL
  );

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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_membership_scope_rules ON public.profile_memberships;

CREATE TRIGGER trg_enforce_membership_scope_rules
BEFORE INSERT OR UPDATE ON public.profile_memberships
FOR EACH ROW
EXECUTE FUNCTION public.enforce_membership_scope_rules();

-- 4) Post-check.
DO $$
DECLARE
  remaining_active_violations INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_active_violations
  FROM public.profile_memberships pm
  LEFT JOIN public.secretariats s ON s.id = pm.secretariat_id
  WHERE pm.is_active = true
    AND (
      (pm.membership_role = 'secretario' AND pm.career_id IS NOT NULL)
      OR (pm.membership_role IN ('director', 'profesor') AND pm.career_id IS NULL)
      OR (pm.membership_role IN ('director', 'profesor') AND s.code IS DISTINCT FROM 'SA')
    );

  IF remaining_active_violations <> 0 THEN
    RAISE EXCEPTION 'Post-check failed: active membership scope violations remain';
  END IF;
END $$;

-- Rollback note:
-- 1. Drop trg_enforce_membership_scope_rules and the new CHECK constraints.
-- 2. Replay previous_rows from public.profile_membership_correction_audit for
--    correction_key = 'membership_scope_rules_2026_06_26'.
-- 3. Preferred rollback behavior: restore the deleted Sebastián Bisson row as inactive
--    because that was the pre-migration state captured in previous_rows.
-- 4. If a manual replay would reactivate the deleted row, deactivate the current
--    valid SA secretario row first to avoid uq_profile_memberships_active_scope collisions.
