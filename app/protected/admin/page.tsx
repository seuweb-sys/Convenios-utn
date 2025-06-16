import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminPanelClient } from "@/app/protected/admin/AdminPanelClient";
import {
  SectionContainer,
  BackgroundPattern,
  DashboardHeader
} from "@/app/components/dashboard";

export default async function AdminPage() {
  const supabase = await createClient();

  // Verificar si el usuario es admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return redirect("/protected");
  }

  // Obtener todos los convenios
  const { data: convenios, error } = await supabase
    .from("convenios")
    .select(`
      *,
      profiles:user_id (
        full_name,
        role
      ),
      convenio_types (
        name
      ),
      observaciones (
        id,
        content,
        created_at,
        resolved
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener convenios:", error);
    return (
      <>
        <BackgroundPattern />
        <div className="p-6 w-full relative">
          <Suspense fallback={<div className="h-24 w-full skeleton"></div>}>
            <DashboardHeader name="Panel Admin" subtitle="Error al cargar convenios" />
          </Suspense>
          <div className="mt-6">
            <SectionContainer title="Error">
              <div className="text-center py-8 text-red-500">
                <p className="text-lg font-semibold">Error al cargar los convenios</p>
                <p className="text-sm mt-2">Por favor, intenta recargar la página</p>
              </div>
            </SectionContainer>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BackgroundPattern />
      <div className="p-6 w-full relative">
        <Suspense fallback={<div className="h-24 w-full skeleton"></div>}>
          <DashboardHeader 
            name="Administración de Convenios" 
            subtitle="Gestiona todos los convenios del sistema desde este panel" 
          />
        </Suspense>
        <AdminPanelClient convenios={convenios || []} />
      </div>
    </>
  );
} 