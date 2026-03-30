export const dynamic = 'force-dynamic';

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  getPracticeConvenioTypeIds,
  shouldApplyProfesorPracticeOnlyConvenioFilter,
} from "@/app/lib/authz/profesor-membership-scope";
import {
  BackgroundPattern,
  DashboardHeader
} from "@/app/components/dashboard";
import { AprobacionesClient } from "./AprobacionesClient";

export default async function AprobacionesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const applyProfesorPracticeOnly =
    profile &&
    (await shouldApplyProfesorPracticeOnlyConvenioFilter(
      supabase,
      user.id,
      profile.role
    ));

  // Por ahora, traemos todos los convenios. El cliente se encarga de filtrar
  // los que son relevantes para aprobación ('enviado', 'revision').
  // Esto es más simple que hacer una consulta compleja con 'or'.
  let conveniosQuery = supabase
    .from("convenios")
    .select(`
      *,
      convenio_types(name),
      profiles:user_id (
        full_name,
        role,
        career_id
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
        code,
        name,
        unit_type
      )
    `)
    .order("created_at", { ascending: false });

  if (applyProfesorPracticeOnly) {
    conveniosQuery = conveniosQuery.in("convenio_type_id", getPracticeConvenioTypeIds());
  }

  const { data: convenios, error: conveniosError } = await conveniosQuery;

  const { data: careers } = await supabase
    .from("careers")
    .select("*")
    .order("name");

  const { data: secretariats } = await supabase
    .from("secretariats")
    .select("id, code, name")
    .eq("active", true)
    .order("name");

  if (conveniosError) {
    console.error("Error fetching convenios for approval:", conveniosError);
    // Considerar un estado de error en la UI
  }

  return (
    <div className="w-full">
      <BackgroundPattern />
      <div className="p-6">
        <DashboardHeader
          name="Aprobaciones de Convenios"
          subtitle="Revisa y gestiona los convenios pendientes"
        />
        <AprobacionesClient
          convenios={convenios || []}
          careers={careers || []}
          secretariats={secretariats || []}
        />
      </div>
    </div>
  );
} 