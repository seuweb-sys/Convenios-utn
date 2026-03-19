-- Fix "stack depth limit exceeded" when selecting convenios (and related tables).
-- RLS on convenios calls can_view_convenio(), which queried convenios again as the
-- same role → infinite recursion. SECURITY DEFINER runs internal reads as the
-- function owner (bypasses RLS on those reads).

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p WHERE p.id = uid AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_decano(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p WHERE p.id = uid AND p.role = 'decano'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_membership(
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
      AND (p_secretariat_id IS NULL OR pm.secretariat_id = p_secretariat_id)
      AND (p_career_id IS NULL OR pm.career_id = p_career_id)
      AND (p_org_unit_id IS NULL OR pm.org_unit_id = p_org_unit_id)
  );
$$;

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
    IF sec_code <> 'SA' OR p_career_id IS NULL THEN
      RETURN false;
    END IF;

    RETURN
      public.has_membership(uid, 'secretario', p_secretariat_id, NULL, NULL) OR
      public.has_membership(uid, 'director', p_secretariat_id, p_career_id, NULL) OR
      public.has_membership(uid, 'profesor', p_secretariat_id, p_career_id, NULL);
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
    RETURN
      public.has_membership(uid, 'secretario', cv.secretariat_id, NULL, NULL) OR
      public.has_membership(uid, 'director', cv.secretariat_id, cv.career_id, NULL) OR
      public.has_membership(uid, 'profesor', cv.secretariat_id, cv.career_id, NULL);
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

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_decano(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_membership(uuid, text, uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_create_in_scope(uuid, uuid, uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_view_convenio(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_decano(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_membership(uuid, text, uuid, uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_create_in_scope(uuid, uuid, uuid, uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_convenio(uuid, uuid) TO authenticated, service_role;
