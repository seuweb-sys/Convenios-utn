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

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;

  const [{ data: users, error: usersError }, { data: secretariats, error: secError }, { data: careers, error: careersError }, { data: orgUnits, error: orgError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, career_id, is_approved")
      .order("full_name", { ascending: true }),
    supabase
      .from("secretariats")
      .select("id, code, name, active")
      .order("name", { ascending: true }),
    supabase
      .from("careers")
      .select("id, name, code")
      .order("name", { ascending: true }),
    supabase
      .from("org_units")
      .select("id, code, name, unit_type, secretariat_id, active")
      .order("name", { ascending: true }),
    supabase
      .from("profile_memberships")
      .select(`
        id,
        profile_id,
        membership_role,
        secretariat_id,
        career_id,
        org_unit_id,
        is_active,
        created_at,
        profiles:profile_id (
          id,
          full_name
        ),
        secretariats:secretariat_id (
          id,
          code,
          name
        ),
        careers:career_id (
          id,
          name,
          code
        ),
        org_units:org_unit_id (
          id,
          name,
          code,
          unit_type
        )
      `)
      .order("created_at", { ascending: false }),
  ]);

  if (usersError || secError || careersError || orgError || membershipsError) {
    console.error("Error fetching memberships admin data", {
      usersError,
      secError,
      careersError,
      orgError,
      membershipsError,
    });
    return NextResponse.json({ error: "Error al obtener datos de membresías" }, { status: 500 });
  }

  return NextResponse.json({
    users: users || [],
    secretariats: secretariats || [],
    careers: careers || [],
    org_units: orgUnits || [],
    memberships: memberships || [],
  });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;

  const body = (await request.json()) as {
    profile_id?: string;
    membership_role?: "secretario" | "director" | "profesor" | "miembro";
    secretariat_id?: string | null;
    career_id?: string | null;
    org_unit_id?: string | null;
    is_active?: boolean;
  };

  if (!body.profile_id || !body.membership_role) {
    return NextResponse.json({ error: "profile_id y membership_role son requeridos" }, { status: 400 });
  }

  const payload = {
    profile_id: body.profile_id,
    membership_role: body.membership_role,
    secretariat_id: body.secretariat_id || null,
    career_id: body.career_id || null,
    org_unit_id: body.org_unit_id || null,
    is_active: body.is_active ?? true,
  };

  const { data, error } = await supabase
    .from("profile_memberships")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error creating membership", error);
    return NextResponse.json({ error: error.message || "Error al crear membresía" }, { status: 500 });
  }

  return NextResponse.json({ success: true, membership: data });
}
