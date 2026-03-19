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

  return { supabase };
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
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;

  const { error } = await supabase
    .from("profile_memberships")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("Error deleting membership", error);
    return NextResponse.json({ error: "Error al eliminar membresía" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
