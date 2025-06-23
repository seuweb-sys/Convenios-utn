import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
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

  // Por ahora, traemos todos los convenios. El cliente se encarga de filtrar
  // los que son relevantes para aprobación ('enviado', 'revision').
  // Esto es más simple que hacer una consulta compleja con 'or'.
  const { data: convenios, error: conveniosError } = await supabase
    .from("convenios")
    .select("*, convenio_types(name)")
    .order("created_at", { ascending: false });

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
        <AprobacionesClient convenios={convenios || []} />
      </div>
    </div>
  );
} 