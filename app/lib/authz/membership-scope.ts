import type { SupabaseClient } from "@supabase/supabase-js";
import type { MembershipRole } from "./scope-rules";

export async function hasActiveMembershipRole(
  supabase: SupabaseClient,
  profileId: string,
  role: MembershipRole
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profile_memberships")
    .select("id")
    .eq("profile_id", profileId)
    .eq("membership_role", role)
    .eq("is_active", true)
    .limit(1);

  return !error && !!data && data.length > 0;
}

/** Carreras (`career_id`) donde el usuario tiene la membresía indicada. */
export async function getCareerIdsForMembershipRole(
  supabase: SupabaseClient,
  profileId: string,
  role: "director" | "profesor"
): Promise<string[]> {
  const { data, error } = await supabase
    .from("profile_memberships")
    .select("career_id")
    .eq("profile_id", profileId)
    .eq("membership_role", role)
    .eq("is_active", true)
    .not("career_id", "is", null);

  if (error || !data) return [];
  return Array.from(
    new Set(data.map((r) => r.career_id).filter(Boolean) as string[])
  );
}

/** Secretarías donde el usuario es secretario activo. */
export async function getSecretariatIdsForSecretario(
  supabase: SupabaseClient,
  profileId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("profile_memberships")
    .select("secretariat_id")
    .eq("profile_id", profileId)
    .eq("membership_role", "secretario")
    .eq("is_active", true)
    .not("secretariat_id", "is", null);

  if (error || !data) return [];
  return Array.from(
    new Set(data.map((r) => r.secretariat_id).filter(Boolean) as string[])
  );
}

/**
 * Dashboard / lista principal "Convenios": solo propios para director o secretario por membresía
 * (no aplica a admin/decano en profiles.role).
 */
export async function shouldUseMineOnlyConveniosForDashboard(
  supabase: SupabaseClient,
  profileId: string,
  profileRole: string
): Promise<boolean> {
  if (profileRole === "admin" || profileRole === "decano") return false;
  const [dir, sec] = await Promise.all([
    hasActiveMembershipRole(supabase, profileId, "director"),
    hasActiveMembershipRole(supabase, profileId, "secretario"),
  ]);
  return dir || sec;
}

/** profile_id de usuarios con membresía en las secretarías dadas (p. ej. filtro secretario). */
export async function getProfileIdsWithMembershipInSecretariats(
  supabase: SupabaseClient,
  membershipRole: "director" | "profesor",
  secretariatIds: string[]
): Promise<string[]> {
  if (secretariatIds.length === 0) return [];
  const { data, error } = await supabase
    .from("profile_memberships")
    .select("profile_id")
    .eq("membership_role", membershipRole)
    .eq("is_active", true)
    .in("secretariat_id", secretariatIds);

  if (error || !data) return [];
  return Array.from(
    new Set(data.map((r) => r.profile_id).filter(Boolean) as string[])
  );
}

export interface NavMembershipFlags {
  hasProfesor: boolean;
  hasDirector: boolean;
  hasSecretario: boolean;
}

/** Enlaces de paneles por membresía (decano se determina con profiles.role, no suele estar en memberships). */
export async function getNavMembershipFlags(
  supabase: SupabaseClient,
  profileId: string
): Promise<NavMembershipFlags> {
  const { data, error } = await supabase
    .from("profile_memberships")
    .select("membership_role")
    .eq("profile_id", profileId)
    .eq("is_active", true);

  if (error || !data?.length) {
    return {
      hasProfesor: false,
      hasDirector: false,
      hasSecretario: false,
    };
  }

  const roles = new Set(data.map((r) => r.membership_role));
  return {
    hasProfesor: roles.has("profesor"),
    hasDirector: roles.has("director"),
    hasSecretario: roles.has("secretario"),
  };
}
