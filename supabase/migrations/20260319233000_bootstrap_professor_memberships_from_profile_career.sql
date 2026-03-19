-- Transitional bootstrap after unifying profiles.role as global-only:
-- If a user has legacy career_id and no active memberships, create SA/profesor membership.
DO $$
DECLARE
  sa_id UUID;
BEGIN
  SELECT id INTO sa_id
  FROM public.secretariats
  WHERE code = 'SA'
  LIMIT 1;

  IF sa_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.profile_memberships (
    profile_id,
    membership_role,
    secretariat_id,
    career_id,
    org_unit_id,
    is_active,
    created_by
  )
  SELECT
    p.id,
    'profesor',
    sa_id,
    p.career_id,
    NULL,
    true,
    NULL
  FROM public.profiles p
  WHERE p.career_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.profile_memberships pm
      WHERE pm.profile_id = p.id
        AND pm.is_active = true
    )
  ON CONFLICT DO NOTHING;
END $$;
