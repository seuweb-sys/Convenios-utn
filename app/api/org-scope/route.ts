import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  computeConstrainedClassification,
  type MembershipRow,
} from "@/app/lib/authz/classification-scope";

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

  const { data: saRow } = await supabase
    .from("secretariats")
    .select("id")
    .eq("code", "SA")
    .eq("active", true)
    .maybeSingle();

  const saSecretariatId: string | null = saRow?.id ?? null;

  const isAdminLike = profile.role === "admin" || profile.role === "decano";

  if (isAdminLike) {
    const [{ data: secretariats }, { data: careers }, { data: orgUnits }, { data: memberships }] =
      await Promise.all([
        supabase.from("secretariats").select("id, code, name, active").eq("active", true).order("name"),
        supabase.from("careers").select("id, name, code").order("name"),
        supabase
          .from("org_units")
          .select("id, code, name, unit_type, secretariat_id, active")
          .eq("active", true)
          .order("name"),
        supabase
          .from("profile_memberships")
          .select("id, membership_role, secretariat_id, career_id, org_unit_id, is_active")
          .eq("profile_id", user.id)
          .eq("is_active", true),
      ]);

    return NextResponse.json({
      profile,
      canChooseSecretariat: true,
      lockedSecretariatId: null,
      careerMode: null,
      lockedCareerId: null,
      allowedCareerIds: null,
    practiceCareerOptional: false,
      secretariats: secretariats || [],
      careers: careers || [],
      org_units: orgUnits || [],
      memberships: memberships || [],
    });
  }

  const { data: membershipsRaw, error: membershipsError } = await supabase
    .from("profile_memberships")
    .select("id, membership_role, secretariat_id, career_id, org_unit_id, is_active")
    .eq("profile_id", user.id)
    .eq("is_active", true);

  if (membershipsError) {
    return NextResponse.json({ error: "No se pudo obtener membresías" }, { status: 500 });
  }

  const memberships = (membershipsRaw || []) as MembershipRow[];

  const constrained = computeConstrainedClassification(profile.role, memberships, saSecretariatId);

  if (constrained.kind === "full") {
    return NextResponse.json({ error: "Estado de alcance inconsistente" }, { status: 500 });
  }

  const locked = constrained.lockedSecretariatId;

  if (!locked) {
    return NextResponse.json({
      profile,
      canChooseSecretariat: false,
      lockedSecretariatId: null,
      careerMode: constrained.careerScope,
      lockedCareerId: constrained.lockedCareerId,
      allowedCareerIds: constrained.allowedCareerIds,
    practiceCareerOptional: false,
      secretariats: [],
      careers: [],
      org_units: [],
      memberships,
      scopeWarning: "Sin secretaría asignada en tu perfil",
    });
  }

  const secretariatsRes = await supabase
    .from("secretariats")
    .select("id, code, name, active")
    .eq("id", locked)
    .eq("active", true)
    .maybeSingle();

  const secretariats = secretariatsRes.data ? [secretariatsRes.data] : [];

  let careers: { id: string; name: string; code: string | null }[] = [];
  if (constrained.careerScope === "all_sa") {
    const { data: allCareers, error: cErr } = await supabase
      .from("careers")
      .select("id, name, code")
      .order("name");
    if (cErr) {
      console.error("careers all_sa", cErr);
      return NextResponse.json({ error: "No se pudo cargar carreras" }, { status: 500 });
    }
    careers = allCareers || [];
  } else if (
    constrained.careerScope === "fixed" ||
    constrained.careerScope === "subset"
  ) {
    const ids =
      constrained.allowedCareerIds?.filter(Boolean) ||
      (constrained.lockedCareerId ? [constrained.lockedCareerId] : []);
    if (ids.length > 0) {
      const { data: subCareers, error: scErr } = await supabase
        .from("careers")
        .select("id, name, code")
        .in("id", ids)
        .order("name");
      if (scErr) {
        console.error("careers subset", scErr);
        return NextResponse.json({ error: "No se pudo cargar carreras" }, { status: 500 });
      }
      careers = subCareers || [];
    }
  }

  let orgUnits: any[] = [];
  if (constrained.orgUnitsForSecretariat === "all_active") {
    const { data: ou, error: ouErr } = await supabase
      .from("org_units")
      .select("id, code, name, unit_type, secretariat_id, active")
      .eq("secretariat_id", locked)
      .eq("active", true)
      .order("name");
    if (ouErr) {
      console.error("org_units all", ouErr);
      return NextResponse.json({ error: "No se pudo cargar subáreas" }, { status: 500 });
    }
    orgUnits = ou || [];
  } else {
    const orgUnitIds = Array.from(
      new Set(memberships.map((m) => m.org_unit_id).filter(Boolean) as string[])
    );
    if (orgUnitIds.length) {
      const { data: ou, error: ouErr } = await supabase
        .from("org_units")
        .select("id, code, name, unit_type, secretariat_id, active")
        .in("id", orgUnitIds)
        .eq("active", true)
        .order("name");
      if (ouErr) {
        console.error("org_units membership", ouErr);
        return NextResponse.json({ error: "No se pudo cargar subáreas" }, { status: 500 });
      }
      orgUnits = (ou || []).filter((u) => !u.secretariat_id || u.secretariat_id === locked);
    }
  }

  const careerMode =
    constrained.careerScope === "all_sa"
      ? "all"
      : constrained.careerScope === "subset"
        ? "subset"
        : "fixed";

  return NextResponse.json({
    profile,
    canChooseSecretariat: false,
    lockedSecretariatId: locked,
    careerMode,
    lockedCareerId: constrained.lockedCareerId,
    allowedCareerIds: constrained.allowedCareerIds,
    practiceCareerOptional:
      constrained.careerScope === "all_sa" &&
      constrained.effectiveRole === "secretario",
    secretariats,
    careers,
    org_units: orgUnits,
    memberships,
  });
}
