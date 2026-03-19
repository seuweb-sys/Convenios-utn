-- Refactor architecture for convenios by secretariat/career/org-unit.
-- Scope: Option 3 hybrid (fixed catalogs + membership admin UI).

-- 1) Catalog tables
CREATE TABLE IF NOT EXISTS public.secretariats (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.org_units (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  secretariat_id UUID NOT NULL REFERENCES public.secretariats(id) ON DELETE CASCADE,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('cyt_group', 'seu_sector')),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT org_units_secretariat_code_unique UNIQUE (secretariat_id, code)
);

-- 2) Membership table
CREATE TABLE IF NOT EXISTS public.profile_memberships (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_role TEXT NOT NULL CHECK (membership_role IN ('secretario', 'director', 'profesor', 'miembro')),
  secretariat_id UUID REFERENCES public.secretariats(id) ON DELETE CASCADE,
  career_id UUID REFERENCES public.careers(id) ON DELETE CASCADE,
  org_unit_id UUID REFERENCES public.org_units(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profile_memberships_scope_required CHECK (
    secretariat_id IS NOT NULL OR career_id IS NOT NULL OR org_unit_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_memberships_active_scope
  ON public.profile_memberships (
    profile_id,
    membership_role,
    COALESCE(secretariat_id::text, ''),
    COALESCE(career_id::text, ''),
    COALESCE(org_unit_id::text, '')
  )
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_profile_memberships_lookup
  ON public.profile_memberships (profile_id, membership_role, secretariat_id, career_id, org_unit_id)
  WHERE is_active = true;

-- 3) Add convenio classification columns
ALTER TABLE public.convenios
  ADD COLUMN IF NOT EXISTS secretariat_id UUID REFERENCES public.secretariats(id),
  ADD COLUMN IF NOT EXISTS career_id UUID REFERENCES public.careers(id),
  ADD COLUMN IF NOT EXISTS org_unit_id UUID REFERENCES public.org_units(id),
  ADD COLUMN IF NOT EXISTS is_hidden_from_area BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_set_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS legacy_unclassified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreement_year INTEGER,
  ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.convenios
  DROP CONSTRAINT IF EXISTS convenios_legacy_or_secretariat_required;

ALTER TABLE public.convenios
  DROP CONSTRAINT IF EXISTS convenios_agreement_year_range;

ALTER TABLE public.convenios
  ADD CONSTRAINT convenios_agreement_year_range
  CHECK (agreement_year IS NULL OR (agreement_year >= 2000 AND agreement_year <= 2100));

CREATE INDEX IF NOT EXISTS idx_convenios_scope_filters
  ON public.convenios (secretariat_id, career_id, org_unit_id, convenio_type_id, agreement_year);

CREATE INDEX IF NOT EXISTS idx_convenios_legacy_unclassified
  ON public.convenios (legacy_unclassified);

-- 4) Seed secretariats and org units
INSERT INTO public.secretariats (code, name)
VALUES
  ('SA', 'Secretaría Académica'),
  ('CYT', 'Secretaría de Ciencia y Tecnología'),
  ('SEU', 'Secretaría de Extensión Universitaria'),
  ('SAU', 'Secretaría de Asuntos Universitarios')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, active = true;

DO $$
DECLARE
  seu_id UUID;
  cyt_id UUID;
BEGIN
  SELECT id INTO seu_id FROM public.secretariats WHERE code = 'SEU' LIMIT 1;
  SELECT id INTO cyt_id FROM public.secretariats WHERE code = 'CYT' LIMIT 1;

  IF seu_id IS NOT NULL THEN
    INSERT INTO public.org_units (secretariat_id, unit_type, code, name)
    VALUES
      (seu_id, 'seu_sector', 'formacion_continua', 'Formación Continua'),
      (seu_id, 'seu_sector', 'servicios_a_terceros', 'Servicios a Terceros')
    ON CONFLICT (secretariat_id, code) DO UPDATE
    SET name = EXCLUDED.name, active = true;
  END IF;

  IF cyt_id IS NOT NULL THEN
    INSERT INTO public.org_units (secretariat_id, unit_type, code, name)
    VALUES
      (cyt_id, 'cyt_group', 'grupo_general', 'Grupo General de Investigación')
    ON CONFLICT (secretariat_id, code) DO UPDATE
    SET name = EXCLUDED.name, active = true;
  END IF;
END $$;

-- 5) Seed/update careers catalog
DO $$
BEGIN
  -- De grado
  UPDATE public.careers SET code = 'LAR' WHERE lower(name) = lower('Licenciatura en Administración Rural');
  INSERT INTO public.careers (name, code)
  SELECT 'Licenciatura en Administración Rural', 'LAR'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.careers WHERE code = 'LAR' OR lower(name) = lower('Licenciatura en Administración Rural')
  );

  UPDATE public.careers SET code = 'IEM' WHERE lower(name) = lower('Ingeniería Electromecánica');
  INSERT INTO public.careers (name, code)
  SELECT 'Ingeniería Electromecánica', 'IEM'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.careers WHERE code = 'IEM' OR lower(name) = lower('Ingeniería Electromecánica')
  );

  UPDATE public.careers SET code = 'ISI' WHERE lower(name) = lower('Ingeniería en Sistemas de Información');
  INSERT INTO public.careers (name, code)
  SELECT 'Ingeniería en Sistemas de Información', 'ISI'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.careers WHERE code = 'ISI' OR lower(name) = lower('Ingeniería en Sistemas de Información')
  );

  UPDATE public.careers SET code = 'IQ' WHERE lower(name) = lower('Ingeniería Química');
  INSERT INTO public.careers (name, code)
  SELECT 'Ingeniería Química', 'IQ'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.careers WHERE code = 'IQ' OR lower(name) = lower('Ingeniería Química')
  );

  -- Tecnicaturas
  UPDATE public.careers SET code = 'TUL' WHERE lower(name) = lower('Tecnicatura Universitaria en Logística');
  INSERT INTO public.careers (name, code)
  SELECT 'Tecnicatura Universitaria en Logística', 'TUL'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.careers WHERE code = 'TUL' OR lower(name) = lower('Tecnicatura Universitaria en Logística')
  );

  UPDATE public.careers SET code = 'TUOMRE' WHERE lower(name) = lower('Tecnicatura Universitaria en Operaciones Y Mantenimiento de Redes Eléctricas');
  INSERT INTO public.careers (name, code)
  SELECT 'Tecnicatura Universitaria en Operaciones Y Mantenimiento de Redes Eléctricas', 'TUOMRE'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.careers WHERE code = 'TUOMRE' OR lower(name) = lower('Tecnicatura Universitaria en Operaciones Y Mantenimiento de Redes Eléctricas')
  );

  UPDATE public.careers SET code = 'TUM' WHERE lower(name) = lower('Tecnicatura Universitaria en Mecatrónica');
  INSERT INTO public.careers (name, code)
  SELECT 'Tecnicatura Universitaria en Mecatrónica', 'TUM'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.careers WHERE code = 'TUM' OR lower(name) = lower('Tecnicatura Universitaria en Mecatrónica')
  );

  UPDATE public.careers SET code = 'TUP' WHERE lower(name) = lower('Tecnicatura Universitaria en Programación');
  INSERT INTO public.careers (name, code)
  SELECT 'Tecnicatura Universitaria en Programación', 'TUP'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.careers WHERE code = 'TUP' OR lower(name) = lower('Tecnicatura Universitaria en Programación')
  );
END $$;

-- 6) Backfill legacy records and agreement_year
UPDATE public.convenios
SET legacy_unclassified = true
WHERE secretariat_id IS NULL;

UPDATE public.convenios
SET agreement_year = EXTRACT(YEAR FROM COALESCE(created_at, timezone('utc'::text, now())))::INTEGER
WHERE agreement_year IS NULL;

ALTER TABLE public.convenios
  ADD CONSTRAINT convenios_legacy_or_secretariat_required
  CHECK (legacy_unclassified = true OR secretariat_id IS NOT NULL);

-- 7) Role migration: rector -> decano
UPDATE public.profiles
SET role = 'decano'
WHERE role = 'rector';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['user'::text, 'admin'::text, 'profesor'::text, 'reviewer'::text, 'decano'::text]));

-- 8) Membership bootstrap for current profesores (SA + career)
DO $$
DECLARE
  sa_id UUID;
BEGIN
  SELECT id INTO sa_id FROM public.secretariats WHERE code = 'SA' LIMIT 1;

  IF sa_id IS NOT NULL THEN
    INSERT INTO public.profile_memberships (profile_id, membership_role, secretariat_id, career_id, is_active)
    SELECT p.id, 'profesor', sa_id, p.career_id, true
    FROM public.profiles p
    WHERE p.role = 'profesor' AND p.career_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 9) Serial number functions by selected year
CREATE OR REPLACE FUNCTION public.generate_serial_number_for_year(target_year INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  last_number INTEGER := 0;
  new_number INTEGER;
BEGIN
  IF target_year IS NULL OR target_year < 2000 OR target_year > 2100 THEN
    RAISE EXCEPTION 'target_year inválido: %', target_year;
  END IF;

  LOCK TABLE public.convenios IN EXCLUSIVE MODE;

  SELECT COALESCE(MAX(split_part(serial_number, '-', 2)::INTEGER), 0)
  INTO last_number
  FROM public.convenios
  WHERE serial_number LIKE target_year::TEXT || '-%';

  new_number := last_number + 1;
  RETURN target_year::TEXT || '-' || LPAD(new_number::TEXT, 3, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_serial_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN public.generate_serial_number_for_year(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
END;
$$;

-- 10) Validation trigger for convenio scope
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
      RAISE EXCEPTION 'career_id es obligatorio para convenios de práctica';
    END IF;

    IF NEW.agreement_year <> current_year THEN
      RAISE EXCEPTION 'Convenios de práctica no permiten carga histórica (año actual requerido)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_convenio_scope ON public.convenios;
CREATE TRIGGER trg_validate_convenio_scope
  BEFORE INSERT OR UPDATE ON public.convenios
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_convenio_scope();

-- 11) Authorization helper functions
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p WHERE p.id = uid AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_decano(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
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
AS $$
DECLARE
  sec_code TEXT;
BEGIN
  IF uid IS NULL THEN
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

  -- Practice types: SA only, career required, creators SA secretary/director/profesor.
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
    -- Non-practice SA creations restricted to SA secretary.
    RETURN public.has_membership(uid, 'secretario', p_secretariat_id, NULL, NULL);
  ELSIF sec_code = 'CYT' THEN
    -- Members require group, secretary can create at secretariat level.
    RETURN
      public.has_membership(uid, 'secretario', p_secretariat_id, NULL, NULL) OR
      (p_org_unit_id IS NOT NULL AND public.has_membership(uid, 'miembro', p_secretariat_id, NULL, p_org_unit_id));
  ELSIF sec_code = 'SEU' THEN
    -- Sector optional in SEU.
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
AS $$
DECLARE
  cv public.convenios%ROWTYPE;
  sec_code TEXT;
BEGIN
  IF uid IS NULL THEN
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
    -- Reserved for future CyT confidential types.
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
    -- Directors can view all types in their career.
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

-- 12) RLS policies rewrite
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('convenios', 'anexos', 'observaciones', 'activity_log', 'secretariats', 'org_units', 'profile_memberships')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE public.secretariats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_memberships ENABLE ROW LEVEL SECURITY;

-- secretariats
CREATE POLICY "secretariats_select_authenticated"
  ON public.secretariats FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "secretariats_manage_admin"
  ON public.secretariats FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- org_units
CREATE POLICY "org_units_select_authenticated"
  ON public.org_units FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "org_units_manage_admin"
  ON public.org_units FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- profile_memberships
CREATE POLICY "profile_memberships_select_scope"
  ON public.profile_memberships FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    public.is_decano(auth.uid()) OR
    profile_id = auth.uid()
  );

CREATE POLICY "profile_memberships_manage_admin"
  ON public.profile_memberships FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- convenios
CREATE POLICY "convenios_select_by_scope"
  ON public.convenios FOR SELECT
  TO authenticated
  USING (public.can_view_convenio(auth.uid(), id));

CREATE POLICY "convenios_insert_by_scope"
  ON public.convenios FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_create_in_scope(auth.uid(), secretariat_id, career_id, org_unit_id, convenio_type_id)
  );

CREATE POLICY "convenios_update_owner_admin_secretary_decano"
  ON public.convenios FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.is_decano(auth.uid())
    OR user_id = auth.uid()
    OR public.has_membership(auth.uid(), 'secretario', secretariat_id, NULL, NULL)
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.is_decano(auth.uid())
    OR user_id = auth.uid()
    OR public.has_membership(auth.uid(), 'secretario', secretariat_id, NULL, NULL)
  );

CREATE POLICY "convenios_delete_owner_admin"
  ON public.convenios FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

-- anexos
CREATE POLICY "anexos_select_by_convenio_scope"
  ON public.anexos FOR SELECT
  TO authenticated
  USING (public.can_view_convenio(auth.uid(), convenio_id));

CREATE POLICY "anexos_insert_by_convenio_scope"
  ON public.anexos FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND public.can_view_convenio(auth.uid(), convenio_id)
  );

CREATE POLICY "anexos_delete_owner_admin"
  ON public.anexos FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_admin(auth.uid()));

-- observaciones
CREATE POLICY "observaciones_select_by_convenio_scope"
  ON public.observaciones FOR SELECT
  TO authenticated
  USING (public.can_view_convenio(auth.uid(), convenio_id));

CREATE POLICY "observaciones_insert_by_convenio_scope"
  ON public.observaciones FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.can_view_convenio(auth.uid(), convenio_id)
  );

CREATE POLICY "observaciones_update_owner_admin"
  ON public.observaciones FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- activity_log
CREATE POLICY "activity_log_select_by_convenio_scope"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (public.can_view_convenio(auth.uid(), convenio_id));

CREATE POLICY "activity_log_insert_any_authenticated"
  ON public.activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
