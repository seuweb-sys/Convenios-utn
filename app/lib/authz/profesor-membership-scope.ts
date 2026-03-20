import type { SupabaseClient } from "@supabase/supabase-js";
import { PRACTICE_TYPE_IDS } from "./scope-rules";

/** IDs de `convenios.convenio_type_id` para práctica supervisada (particular + marco). */
export function getPracticeConvenioTypeIds(): number[] {
  return Array.from(PRACTICE_TYPE_IDS);
}

/**
 * Membresía activa con `membership_role = 'profesor'` en `profile_memberships`.
 * No usar `profiles.role` para este comportamiento.
 */
export async function hasActiveProfesorMembership(
  supabase: SupabaseClient,
  profileId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profile_memberships")
    .select("id")
    .eq("profile_id", profileId)
    .eq("membership_role", "profesor")
    .eq("is_active", true)
    .limit(1);

  return !error && !!data && data.length > 0;
}

/**
 * Aplica restricción de listados/detalle a solo convenios de práctica supervisada
 * para usuarios con membresía "profesor". Admin y decano no se restringen.
 */
export async function shouldApplyProfesorPracticeOnlyConvenioFilter(
  supabase: SupabaseClient,
  profileId: string,
  profileRole: string
): Promise<boolean> {
  if (profileRole === "admin" || profileRole === "decano") {
    return false;
  }
  return hasActiveProfesorMembership(supabase, profileId);
}
