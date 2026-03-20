import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  BackgroundPattern,
  DashboardHeader,
} from "@/app/components/dashboard";
import { ConveniosListaClient } from "@/app/protected/convenios-lista/ConveniosListaClient";

/** Misma visibilidad que admin vía RLS; solo lectura en API (PATCH/POST bloqueados para decano). */
export default async function DecanoConveniosPage() {
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

  if (profile?.role !== "decano") {
    return redirect("/protected");
  }

  const { data: convenios, error: conveniosError } = await supabase
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
    console.error("Error fetching convenios decano:", conveniosError);
  }

  return (
    <div className="w-full">
      <BackgroundPattern />
      <div className="p-6">
        <DashboardHeader
          name="Vista Decano"
          subtitle="Consulta de convenios (solo lectura). Las acciones de administración no están disponibles."
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
