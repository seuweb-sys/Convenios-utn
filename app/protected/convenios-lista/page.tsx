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
    .select("*, convenio_types(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (conveniosError) {
    console.error("Error fetching convenios:", conveniosError);
  }

  return (
    <div className="w-full">
      <BackgroundPattern />
      <div className="p-6">
        <DashboardHeader
          name="Mis Convenios"
          subtitle="Aquí puedes ver todos los convenios que has creado"
        />
        <ConveniosListaClient convenios={convenios || []} />
      </div>
    </div>
  );
}