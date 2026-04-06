import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { normalizeAgreementYear } from "@/app/lib/authz/scope-rules";

export const dynamic = "force-dynamic";

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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase, userId } = guard;

  const convenioId = params.id;
  const body = (await request.json()) as {
    secretariat_id?: string;
    career_id?: string | null;
    org_unit_id?: string | null;
    agreement_year?: number | null;
  };

  if (!body.secretariat_id) {
    return NextResponse.json({ error: "secretariat_id es obligatorio" }, { status: 400 });
  }

  const { data: convenio, error: convenioError } = await supabase
    .from("convenios")
    .select("id, secretariat_id, career_id, org_unit_id, agreement_year")
    .eq("id", convenioId)
    .single();

  if (convenioError || !convenio) {
    return NextResponse.json({ error: "Convenio no encontrado" }, { status: 404 });
  }

  const { data: secretariat, error: secError } = await supabase
    .from("secretariats")
    .select("id, code")
    .eq("id", body.secretariat_id)
    .single();

  if (secError || !secretariat) {
    return NextResponse.json({ error: "Secretaría inválida" }, { status: 400 });
  }

  let careerId: string | null = body.career_id ?? null;
  if (secretariat.code !== "SA") {
    careerId = null;
  }

  let orgUnitId: string | null = body.org_unit_id ?? null;
  if (orgUnitId) {
    const { data: orgUnit, error: ouError } = await supabase
      .from("org_units")
      .select("id, secretariat_id")
      .eq("id", orgUnitId)
      .single();

    if (ouError || !orgUnit) {
      return NextResponse.json({ error: "Subárea inválida" }, { status: 400 });
    }
    if (orgUnit.secretariat_id !== body.secretariat_id) {
      return NextResponse.json(
        { error: "La subárea no pertenece a la secretaría seleccionada" },
        { status: 400 }
      );
    }
  }

  const currentYear = new Date().getFullYear();
  const yearNorm = normalizeAgreementYear(body.agreement_year, currentYear);
  if (!yearNorm.valid) {
    return NextResponse.json({ error: yearNorm.error || "agreement_year inválido" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("convenios")
    .update({
      secretariat_id: body.secretariat_id,
      career_id: careerId,
      org_unit_id: orgUnitId,
      agreement_year: yearNorm.year,
      legacy_unclassified: false,
      hidden_set_by: null,
      is_hidden_from_area: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", convenioId);

  if (updateError) {
    console.error("Error reclassifying convenio (admin)", updateError);
    return NextResponse.json(
      { error: updateError.message || "No se pudo reclasificar el convenio" },
      { status: 500 }
    );
  }

  await supabase.from("activity_log").insert({
    convenio_id: convenioId,
    user_id: userId,
    action: "reclassify_admin",
    metadata: {
      previous: {
        secretariat_id: convenio.secretariat_id,
        career_id: convenio.career_id,
        org_unit_id: convenio.org_unit_id,
        agreement_year: convenio.agreement_year,
      },
      next: {
        secretariat_id: body.secretariat_id,
        career_id: careerId,
        org_unit_id: orgUnitId,
        agreement_year: yearNorm.year,
      },
    },
    ip_address: "server",
  });

  return NextResponse.json({ success: true });
}
