import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
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
    console.error("Error fetching convenios:", conveniosError);
  }

  return (
    <div className="w-full">
      <BackgroundPattern />
      <div className="p-6">
        <DashboardHeader
          name="Convenios"
          subtitle="Aquí puedes ver todos los convenios visibles para tu perfil"
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