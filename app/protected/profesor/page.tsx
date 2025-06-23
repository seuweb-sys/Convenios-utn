import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProfesorPanelClient } from "./ProfesorPanelClient";
import {
  SectionContainer,
  BackgroundPattern,
  DashboardHeader
} from "@/app/components/dashboard";

export default async function ProfesorPage() {
  const supabase = await createClient();

  // Verificar si el usuario es profesor o admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Solo roles 'profesor' y 'admin' pueden acceder
  if (profile?.role !== "admin" && profile?.role !== "profesor") {
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
    console.error("Error al obtener convenios para profesor:", error);
    return (
      <>
        <BackgroundPattern />
        <div className="p-6 w-full relative">
          <Suspense fallback={<div className="h-24 w-full skeleton"></div>}>
            <DashboardHeader name="Panel de Profesor" subtitle="Error al cargar convenios" />
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
            name="Panel de Profesor" 
            subtitle="Visualiza y filtra todos los convenios del sistema" 
          />
        </Suspense>
        <ProfesorPanelClient convenios={convenios || []} />
      </div>
    </>
  );
} 