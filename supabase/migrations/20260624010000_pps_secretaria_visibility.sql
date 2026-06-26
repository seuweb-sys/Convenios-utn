-- PPS Secretaría visibility: exact-scope helper + Seba Bisson membership correction.
--
-- Adds has_membership_exact_scope (NULL argument = membership column MUST be NULL,
-- the opposite of legacy wildcard has_membership) and switches only the práctica
-- (convenio_type_id IN (1,5)) branches of can_view_convenio / can_create_in_scope
-- to the exact helper. Legacy has_membership is preserved unchanged for all other
-- secretariat policies (SA/CYT/SEU/SAU) so blast radius stays minimal.
--
-- A dedicated audit table records before-state snapshots for the Seba Bisson
-- membership correction so the change is rollback-safe.

-- 1) Dedicated membership correction audit table (rollback-oriented).
CREATE TABLE IF NOT EXISTS public.profile_membership_correction_audit (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  correction_key TEXT NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.profile_memberships(id) ON DELETE CASCADE,
  membership_role TEXT NOT NULL,
  secretariat_id UUID,
  career_id UUID,
  org_unit_id UUID,
  is_active BOOLEAN NOT NULL,
  last_state JSONB NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- RLS MUST be enabled on the audit table itself; the policy below is inert
-- otherwise (enabling RLS only on profile_memberships does not cover this table).
ALTER TABLE public.profile_membership_correction_audit
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_memberships_correction_audit_admin" ON public.profile_membership_correction_audit;

CREATE POLICY "profile_memberships_correction_audit_admin"
  ON public.profile_membership_correction_audit
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2) Exact-scope authz helper. NULL argument => membership column must be NULL
--    (exact match), NON-NULL argument => exact equality. No wildcard matching.
CREATE OR REPLACE FUNCTION public.has_membership_exact_scope(
  uid UUID,
  p_role TEXT DEFAULT NULL,
  p_secretariat_id UUID DEFAULT NULL,
  p_career_id UUID DEFAULT NULL,
  p_org_unit_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_memberships pm
    WHERE pm.profile_id = uid
      AND pm.is_active = true
      AND (p_role IS NULL OR pm.membership_role = p_role)
      AND (
        (p_secretariat_id IS NULL AND pm.secretariat_id IS NULL)
        OR (p_secretariat_id IS NOT NULL AND pm.secretariat_id = p_secretariat_id)
      )
      AND (
        (p_career_id IS NULL AND pm.career_id IS NULL)
        OR (p_career_id IS NOT NULL AND pm.career_id = p_career_id)
      )
      AND (
        (p_org_unit_id IS NULL AND pm.org_unit_id IS NULL)
        OR (p_org_unit_id IS NOT NULL AND pm.org_unit_id = p_org_unit_id)
      )
  );
$$;

-- 3) validate_convenio_scope: preserve sec_code <> 'SA' guard for practice creation.
--    Only refreshes the secretario-allow branch to use the exact helper.
CREATE OR REPLACE FUNCTION public.validate_convenio_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secretariat_code TEXT;
  org_unit_secretariat UUID;
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
BEGIN
  IF NEW.legacy_unclassified THEN
    RETURN NEW;
  END IF;

  IF NEW.secretariat_id IS NULL THEN
    RAISE EXCEPTION 'secretariat_id es obligatorio para convenios clasificados';
  END IF;

  SELECT s.code INTO secretariat_code
  FROM public.secretariats s
  WHERE s.id = NEW.secretariat_id;

  IF secretariat_code IS NULL THEN
    RAISE EXCEPTION 'secretariat_id inválido';
  END IF;

  IF NEW.org_unit_id IS NOT NULL THEN
    SELECT ou.secretariat_id INTO org_unit_secretariat
    FROM public.org_units ou
    WHERE ou.id = NEW.org_unit_id;

    IF org_unit_secretariat IS NULL OR org_unit_secretariat <> NEW.secretariat_id THEN
      RAISE EXCEPTION 'org_unit_id no pertenece a la secretaría seleccionada';
    END IF;
  END IF;

  IF NEW.agreement_year IS NULL THEN
    NEW.agreement_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, timezone('utc'::text, now())))::INTEGER;
  END IF;

  IF NEW.convenio_type_id IN (1, 5) THEN
    IF secretariat_code <> 'SA' THEN
      RAISE EXCEPTION 'Tipos de práctica solo permitidos en Secretaría Académica';
    END IF;

    IF NEW.career_id IS NULL THEN
      IF (
        NOT EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role IN ('admin', 'decano')
        )
      ) AND (
        NOT public.has_membership_exact_scope(auth.uid(), 'secretario', NEW.secretariat_id, NULL, NULL)
      ) THEN
        RAISE EXCEPTION 'career_id es obligatorio para convenios de práctica (salvo secretarios de la secretaría o administración)';
      END IF;
    END IF;

    IF NEW.agreement_year <> current_year THEN
      RAISE EXCEPTION 'Convenios de práctica no permiten carga histórica (año actual requerido)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4) can_create_in_scope: práctica branch uses has_membership_exact_scope.
--    Non-práctica secretariat policies keep the legacy wildcard helper.
CREATE OR REPLACE FUNCTION public.can_create_in_scope(
  uid UUID,
  p_secretariat_id UUID,
  p_career_id UUID,
  p_org_unit_id UUID,
  p_convenio_type_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sec_code TEXT;
BEGIN
  IF uid IS NULL OR uid IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;

  IF public.is_admin(uid) OR public.is_decano(uid) THEN
    RETURN true;
  END IF;

  IF p_secretariat_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT s.code INTO sec_code
  FROM public.secretariats s
  WHERE s.id = p_secretariat_id;

  IF sec_code IS NULL THEN
    RETURN false;
  END IF;

  -- Practice types: SA only. Null-career practice creation is allowed for the
  -- SA-wide secretario (career_id IS NULL) via the exact helper, matching the
  -- design contract and validate_convenio_scope's null-career allow path.
  -- Career-required creators (career-scoped secretario/director/profesor) fall
  -- through to the scoped exact-helper return below.
  IF p_convenio_type_id IN (1, 5) THEN
    IF sec_code <> 'SA' THEN
      RETURN false;
    END IF;

    IF p_career_id IS NULL THEN
      RETURN has_membership_exact_scope(uid,'secretario',p_secretariat_id,NULL,NULL);
    END IF;

    RETURN
      has_membership_exact_scope(uid,'secretario',p_secretariat_id,NULL,NULL) OR
      has_membership_exact_scope(uid,'secretario',p_secretariat_id,p_career_id,NULL) OR
      has_membership_exact_scope(uid,'director',p_secretariat_id,p_career_id,NULL) OR
      has_membership_exact_scope(uid,'profesor',p_secretariat_id,p_career_id,NULL);
  END IF;

  IF sec_code = 'SA' THEN
    RETURN public.has_membership(uid, 'secretario', p_secretariat_id, NULL, NULL);
  ELSIF sec_code = 'CYT' THEN
    RETURN
      public.has_membership(uid, 'secretario', p_secretariat_id, NULL, NULL) OR
      (p_org_unit_id IS NOT NULL AND public.has_membership(uid, 'miembro', p_secretariat_id, NULL, p_org_unit_id));
  ELSIF sec_code = 'SEU' THEN
    RETURN
      public.has_membership(uid, 'secretario', p_secretariat_id, NULL, NULL) OR
      (
        p_org_unit_id IS NULL AND public.has_membership(uid, 'miembro', p_secretariat_id, NULL, NULL)
      ) OR (
        p_org_unit_id IS NOT NULL AND public.has_membership(uid, 'miembro', p_secretariat_id, NULL, p_org_unit_id)
      );
  ELSIF sec_code = 'SAU' THEN
    RETURN
      public.has_membership(uid, 'secretario', p_secretariat_id, NULL, NULL) OR
      public.has_membership(uid, 'miembro', p_secretariat_id, NULL, NULL);
  END IF;

  RETURN false;
END;
$$;

-- 5) can_view_convenio: owner-first invariant preserved before any membership
--    check; práctica branch uses has_membership_exact_scope so career-scoped
--    secretaries cannot gain secretariat-wide access to non-owned práctica.
CREATE OR REPLACE FUNCTION public.can_view_convenio(uid UUID, p_convenio_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cv public.convenios%ROWTYPE;
  sec_code TEXT;
BEGIN
  IF uid IS NULL OR uid IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;

  SELECT c.* INTO cv
  FROM public.convenios c
  WHERE c.id = p_convenio_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF public.is_admin(uid) OR public.is_decano(uid) THEN
    RETURN true;
  END IF;

  -- Owner-first access invariant: owners always see their own convenios,
  -- including PPS and Marco PPS, regardless of active membership shape.
  IF cv.user_id = uid THEN
    RETURN true;
  END IF;

  IF cv.legacy_unclassified THEN
    RETURN false;
  END IF;

  IF cv.is_hidden_from_area THEN
    RETURN false;
  END IF;

  SELECT s.code INTO sec_code
  FROM public.secretariats s
  WHERE s.id = cv.secretariat_id;

  IF sec_code IS NULL THEN
    RETURN false;
  END IF;

  IF cv.is_confidential THEN
    IF sec_code <> 'CYT' THEN
      RETURN false;
    END IF;

    RETURN
      public.has_membership(uid, 'secretario', cv.secretariat_id, NULL, NULL) OR
      (
        cv.org_unit_id IS NOT NULL
        AND public.has_membership(uid, 'miembro', cv.secretariat_id, NULL, cv.org_unit_id)
      );
  END IF;

  IF cv.convenio_type_id IN (1, 5) THEN
    -- Secretariat-wide secretario (career_id IS NULL) allow only.
    IF cv.career_id IS NULL THEN
      RETURN has_membership_exact_scope(uid,'secretario',cv.secretariat_id,NULL,NULL);
    END IF;

    RETURN
      has_membership_exact_scope(uid,'secretario',cv.secretariat_id,NULL,NULL) OR
      has_membership_exact_scope(uid,'secretario',cv.secretariat_id,cv.career_id,NULL) OR
      has_membership_exact_scope(uid,'director',cv.secretariat_id,cv.career_id,NULL) OR
      has_membership_exact_scope(uid,'profesor',cv.secretariat_id,cv.career_id,NULL);
  END IF;

  IF sec_code = 'SA' THEN
    RETURN
      public.has_membership(uid, 'secretario', cv.secretariat_id, NULL, NULL) OR
      public.has_membership(uid, 'director', cv.secretariat_id, cv.career_id, NULL);
  ELSIF sec_code = 'CYT' THEN
    RETURN
      public.has_membership(uid, 'secretario', cv.secretariat_id, NULL, NULL) OR
      (
        cv.org_unit_id IS NULL
        AND public.has_membership(uid, 'miembro', cv.secretariat_id, NULL, NULL)
      ) OR (
        cv.org_unit_id IS NOT NULL
        AND public.has_membership(uid, 'miembro', cv.secretariat_id, NULL, cv.org_unit_id)
      );
  ELSIF sec_code = 'SEU' THEN
    RETURN
      public.has_membership(uid, 'secretario', cv.secretariat_id, NULL, NULL) OR
      (
        cv.org_unit_id IS NULL
        AND public.has_membership(uid, 'miembro', cv.secretariat_id, NULL, NULL)
      ) OR (
        cv.org_unit_id IS NOT NULL
        AND public.has_membership(uid, 'miembro', cv.secretariat_id, NULL, cv.org_unit_id)
      );
  ELSIF sec_code = 'SAU' THEN
    RETURN
      public.has_membership(uid, 'secretario', cv.secretariat_id, NULL, NULL) OR
      public.has_membership(uid, 'miembro', cv.secretariat_id, NULL, NULL);
  END IF;

  RETURN false;
END;
$$;

-- 6) Seba Bisson membership correction — rollback-safe, single transaction.
--    Precondition: exactly one active career-scoped SA secretario + one
--    inactive NULL-career SA secretario. We snapshot prior state, deactivate the
--    career-scoped row and reactivate the NULL-career row so the resulting
--    active secretario is secretariat-wide and no duplicate active secretario SA
--    memberships remain.
DO $$
DECLARE
  seba_bisson UUID;
  sa_id UUID;
  active_scoped UUID;
  inactive_wide UUID;
BEGIN
  SELECT s.id INTO sa_id FROM public.secretariats s WHERE s.code = 'SA' LIMIT 1;
  IF sa_id IS NULL THEN
    RAISE NOTICE 'SA secretariat not found; skipping Seba Bisson correction';
    RETURN;
  END IF;

  SELECT p.id INTO seba_bisson
  FROM public.profiles p
  WHERE lower(coalesce(p.full_name, '')) LIKE 'seba bisson'
  LIMIT 1;

  IF seba_bisson IS NULL THEN
    RAISE NOTICE 'Seba Bisson profile not found; skipping correction';
    RETURN;
  END IF;

  SELECT pm.id INTO active_scoped
  FROM public.profile_memberships pm
  WHERE pm.profile_id = seba_bisson
    AND pm.membership_role = 'secretario'
    AND pm.secretariat_id = sa_id
    AND pm.career_id IS NOT NULL
    AND pm.is_active = true
  LIMIT 1;

  SELECT pm.id INTO inactive_wide
  FROM public.profile_memberships pm
  WHERE pm.profile_id = seba_bisson
    AND pm.membership_role = 'secretario'
    AND pm.secretariat_id = sa_id
    AND pm.career_id IS NULL
    AND pm.is_active = false
  LIMIT 1;

  -- Only proceed when the documented precondition holds.
  IF active_scoped IS NULL OR inactive_wide IS NULL THEN
    RAISE NOTICE 'Seba Bisson precondition (active scoped + inactive wide) not met; skipping correction';
    RETURN;
  END IF;

  -- Snapshot before-state so rollback can restore the prior rows exactly.
  INSERT INTO public.profile_membership_correction_audit (
    correction_key, profile_id, membership_id, membership_role,
    secretariat_id, career_id, org_unit_id, is_active, last_state
  )
  SELECT
    'seba_bisson_secretario_sa',
    pm.profile_id,
    pm.id,
    pm.membership_role,
    pm.secretariat_id,
    pm.career_id,
    pm.org_unit_id,
    pm.is_active,
    to_jsonb(pm)
  FROM public.profile_memberships pm
  WHERE pm.id IN (active_scoped, inactive_wide);

  -- Deactivate the career-scoped row and reactivate the secretariat-wide row.
  UPDATE public.profile_memberships
    SET is_active = false
    WHERE id = active_scoped;

  UPDATE public.profile_memberships
    SET is_active = true
    WHERE id = inactive_wide;

  -- Verify the final invariant: no duplicate active secretario SA memberships remain.
  PERFORM 1
  FROM (
    SELECT COUNT(*) AS dup
    FROM public.profile_memberships pm
    WHERE pm.profile_id = seba_bisson
      AND pm.membership_role = 'secretario'
      AND pm.secretariat_id = sa_id
      AND pm.is_active = true
  ) c
  WHERE c.dup = 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Correction aborted: no duplicate active secretario SA memberships invariant violated';
  END IF;
END $$;
