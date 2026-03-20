-- Práctica (tipos 1 y 5): career_id puede ser NULL si el creador es secretario de esa secretaría (o admin/decano en trigger).

CREATE OR REPLACE FUNCTION public.validate_convenio_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
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
        NOT EXISTS (
          SELECT 1 FROM public.profile_memberships pm
          WHERE pm.profile_id = auth.uid()
            AND pm.is_active = true
            AND pm.membership_role = 'secretario'
            AND pm.secretariat_id = NEW.secretariat_id
        )
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

    IF p_career_id IS NULL THEN
      RETURN public.has_membership(uid, 'secretario', p_secretariat_id, NULL, NULL);
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
    IF cv.career_id IS NULL THEN
      RETURN public.has_membership(uid, 'secretario', cv.secretariat_id, NULL, NULL);
    END IF;

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
