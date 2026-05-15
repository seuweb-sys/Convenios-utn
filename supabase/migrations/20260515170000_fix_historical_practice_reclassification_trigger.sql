CREATE OR REPLACE FUNCTION public.validate_convenio_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  secretariat_code TEXT;
  org_unit_secretariat UUID;
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  actor_is_admin_or_decano BOOLEAN := false;
  historical_year_unchanged_update BOOLEAN := false;
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

  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'decano')
    ) INTO actor_is_admin_or_decano;
  END IF;

  historical_year_unchanged_update :=
    TG_OP = 'UPDATE'
    AND OLD.convenio_type_id IN (1, 5)
    AND OLD.agreement_year <> current_year
    AND OLD.agreement_year IS NOT DISTINCT FROM NEW.agreement_year;

  IF NEW.convenio_type_id IN (1, 5) THEN
    IF secretariat_code <> 'SA' THEN
      RAISE EXCEPTION 'Tipos de práctica solo permitidos en Secretaría Académica';
    END IF;

    IF NEW.career_id IS NULL THEN
      IF (
        NOT actor_is_admin_or_decano
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

    IF NEW.agreement_year <> current_year AND NOT (
      actor_is_admin_or_decano OR historical_year_unchanged_update
    ) THEN
      RAISE EXCEPTION 'Convenios de práctica no permiten carga histórica (año actual requerido salvo actualización histórica autorizada)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
