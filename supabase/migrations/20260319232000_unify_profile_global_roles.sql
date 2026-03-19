-- Unify role sources of truth:
-- - profiles.role => global role only (admin/decano/user/reviewer)
-- - profile_memberships => scope role (secretario/director/profesor/miembro)

UPDATE public.profiles
SET role = 'user'
WHERE role = 'profesor';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['user'::text, 'admin'::text, 'reviewer'::text, 'decano'::text]));
