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

  return { supabase, userId: user.id };
}

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;

  const { data, error } = await supabase
    .from("convenios")
    .select(`
      id,
      serial_number,
      title,
      created_at,
      convenio_type_id,
      user_id,
      profiles:user_id (
        full_name
      )
    `)
    .eq("legacy_unclassified", true)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error loading legacy convenios", error);
    return NextResponse.json({ error: "No se pudieron cargar convenios legacy" }, { status: 500 });
  }

  return NextResponse.json({ convenios: data || [] });
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase, userId } = guard;

  const body = (await request.json()) as {
    convenio_id?: string;
    secretariat_id?: string;
    career_id?: string | null;
    org_unit_id?: string | null;
    agreement_year?: number;
  };

  if (!body.convenio_id || !body.secretariat_id) {
    return NextResponse.json({ error: "convenio_id y secretariat_id son obligatorios" }, { status: 400 });
  }

  const { error } = await supabase
    .from("convenios")
    .update({
      secretariat_id: body.secretariat_id,
      career_id: body.career_id || null,
      org_unit_id: body.org_unit_id || null,
      agreement_year: body.agreement_year || null,
      legacy_unclassified: false,
      hidden_set_by: null,
      is_hidden_from_area: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.convenio_id);

  if (error) {
    console.error("Error reclassifying legacy convenio", error);
    return NextResponse.json({ error: error.message || "No se pudo reclasificar el convenio" }, { status: 500 });
  }

  await supabase.from("activity_log").insert({
    convenio_id: body.convenio_id,
    user_id: userId,
    action: "reclassify_legacy",
    metadata: {
      secretariat_id: body.secretariat_id,
      career_id: body.career_id || null,
      org_unit_id: body.org_unit_id || null,
      agreement_year: body.agreement_year || null,
    },
    ip_address: "server",
  });

  return NextResponse.json({ success: true });
}
