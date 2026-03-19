import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_approved")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "No se pudo obtener el perfil" }, { status: 500 });
  }

  const isAdminLike = profile.role === "admin" || profile.role === "decano";

  if (isAdminLike) {
    const [{ data: secretariats }, { data: careers }, { data: orgUnits }, { data: memberships }] = await Promise.all([
      supabase.from("secretariats").select("id, code, name, active").eq("active", true).order("name"),
      supabase.from("careers").select("id, name, code").order("name"),
      supabase.from("org_units").select("id, code, name, unit_type, secretariat_id, active").eq("active", true).order("name"),
      supabase
        .from("profile_memberships")
        .select("id, membership_role, secretariat_id, career_id, org_unit_id, is_active")
        .eq("profile_id", user.id)
        .eq("is_active", true),
    ]);

    return NextResponse.json({
      profile,
      secretariats: secretariats || [],
      careers: careers || [],
      org_units: orgUnits || [],
      memberships: memberships || [],
    });
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("profile_memberships")
    .select("id, membership_role, secretariat_id, career_id, org_unit_id, is_active")
    .eq("profile_id", user.id)
    .eq("is_active", true);

  if (membershipsError) {
    return NextResponse.json({ error: "No se pudo obtener membresías" }, { status: 500 });
  }

  const secretariatIds = Array.from(
    new Set((memberships || []).map((m: any) => m.secretariat_id).filter(Boolean))
  );
  const careerIds = Array.from(
    new Set(
      (memberships || []).map((m: any) => m.career_id).filter(Boolean)
    )
  );
  const orgUnitIds = Array.from(
    new Set((memberships || []).map((m: any) => m.org_unit_id).filter(Boolean))
  );

  const [secretariatsRes, careersRes, orgUnitsRes] = await Promise.all([
    secretariatIds.length
      ? supabase
          .from("secretariats")
          .select("id, code, name, active")
          .in("id", secretariatIds)
          .eq("active", true)
          .order("name")
      : Promise.resolve({ data: [] as any[], error: null as any }),
    careerIds.length
      ? supabase.from("careers").select("id, name, code").in("id", careerIds).order("name")
      : Promise.resolve({ data: [] as any[], error: null as any }),
    orgUnitIds.length
      ? supabase
          .from("org_units")
          .select("id, code, name, unit_type, secretariat_id, active")
          .in("id", orgUnitIds)
          .eq("active", true)
          .order("name")
      : Promise.resolve({ data: [] as any[], error: null as any }),
  ]);

  if (secretariatsRes.error || careersRes.error || orgUnitsRes.error) {
    console.error("Error resolving org scope", {
      sec: secretariatsRes.error,
      car: careersRes.error,
      org: orgUnitsRes.error,
    });
    return NextResponse.json({ error: "No se pudo resolver el ámbito organizacional" }, { status: 500 });
  }

  return NextResponse.json({
    profile,
    secretariats: secretariatsRes.data || [],
    careers: careersRes.data || [],
    org_units: orgUnitsRes.data || [],
    memberships: memberships || [],
  });
}
