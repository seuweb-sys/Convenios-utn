-- Corrective follow-up for production environments that already applied
-- 20260624010000_pps_secretaria_visibility.sql before the create-scope fix.
--
-- Business rule for práctica convenios (type 1 / 5):
-- - Non-SA secretariats must still be rejected.
-- - An SA-wide secretario (career_id IS NULL) may create any SA práctica scope,
--   including career-scoped PPS / Marco PPS rows.
-- - Career-scoped secretario/director/profesor memberships remain limited to
--   their exact career scope.

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

  IF p_convenio_type_id IN (1, 5) THEN
    IF sec_code <> 'SA' THEN
      RETURN false;
    END IF;

    IF has_membership_exact_scope(uid,'secretario',p_secretariat_id,NULL,NULL) THEN
      RETURN true;
    END IF;

    IF p_career_id IS NULL THEN
      RETURN false;
    END IF;

    RETURN
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
