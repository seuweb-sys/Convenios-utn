import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  return { supabase, user };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;

  const body = (await request.json()) as {
    is_active?: boolean;
  };

  if (typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "is_active es requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profile_memberships")
    .update({ is_active: body.is_active })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating membership", error);
    return NextResponse.json({ error: "Error al actualizar membresía" }, { status: 500 });
  }

  return NextResponse.json({ success: true, membership: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;

  const { data: membership, error: membershipError } = await supabase
    .from("profile_memberships")
    .select("id, profile_id, membership_role, secretariat_id, career_id, org_unit_id, is_active")
    .eq("id", params.id)
    .single();

  if (membershipError || !membership) {
    return NextResponse.json({ error: "Membresía no encontrada" }, { status: 404 });
  }

  const { data: targetProfile, error: targetProfileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", membership.profile_id)
    .single();

  if (targetProfileError || !targetProfile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  if (targetProfile.role === "admin" && membership.is_active) {
    const { data: siblingMemberships, error: siblingMembershipsError } = await supabase
      .from("profile_memberships")
      .select("id, is_active")
      .eq("profile_id", membership.profile_id);

    if (siblingMembershipsError) {
      console.error("Error checking active admin memberships", siblingMembershipsError);
      return NextResponse.json({ error: "Error al validar membresías activas" }, { status: 500 });
    }

    const activeMemberships = (siblingMemberships || []).filter((row: { is_active?: boolean }) => row.is_active !== false);
    if (activeMemberships.length <= 1) {
      return NextResponse.json(
        {
          error: "No se puede eliminar la última membresía activa de un administrador",
          code: "LAST_ACTIVE_ADMIN_MEMBERSHIP",
        },
        { status: 409 },
      );
    }
  }

  const { error: auditError } = await supabase
    .from("profile_membership_correction_audit")
    .insert({
      correction_key: `admin_delete_membership:${membership.id}:${Date.now()}`,
      profile_id: membership.profile_id,
      previous_rows: [membership],
    });

  if (auditError) {
    console.error("Error auditing membership deletion", auditError);
    return NextResponse.json({ error: "Error al auditar la membresía" }, { status: 500 });
  }

  const { error } = await supabase
    .from("profile_memberships")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("Error deleting membership", error);
    return NextResponse.json({ error: "Error al eliminar membresía" }, { status: 500 });
  }

  // Membership deletions are not convenio-scoped, and activity_log requires a
  // non-null convenio_id (convenio-scoped table). The audit snapshot written to
  // profile_membership_correction_audit above is the authoritative record for
  // membership corrections, so no activity_log entry is produced here.
  return NextResponse.json({ success: true });
}
