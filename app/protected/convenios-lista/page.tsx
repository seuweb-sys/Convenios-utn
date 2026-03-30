export const dynamic = 'force-dynamic';

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  getPracticeConvenioTypeIds,
  shouldApplyProfesorPracticeOnlyConvenioFilter,
} from "@/app/lib/authz/profesor-membership-scope";
import { shouldUseMineOnlyConveniosForDashboard } from "@/app/lib/authz/membership-scope";
import {
  BackgroundPattern,
  DashboardHeader
} from "@/app/components/dashboard";
import { ConveniosListaClient } from "./ConveniosListaClient";

export default async function ConveniosListaPage() {
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

  const mineOnlyList =
    profile &&
    (await shouldUseMineOnlyConveniosForDashboard(supabase, user.id, profile.role));

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

  if (mineOnlyList) {
    conveniosQuery = conveniosQuery.eq("user_id", user.id);
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
    console.error("Error fetching convenios:", conveniosError);
  }

  return (
    <div className="w-full">
      <BackgroundPattern />
      <div className="p-6">
        <DashboardHeader
          name="Convenios"
          subtitle={
            mineOnlyList
              ? "Solo convenios creados por vos"
              : "Aquí puedes ver todos los convenios visibles para tu perfil"
          }
        />
        <ConveniosListaClient
          convenios={convenios || []}
          careers={careers || []}
          secretariats={secretariats || []}
        />
      </div>
    </div>
  );
}