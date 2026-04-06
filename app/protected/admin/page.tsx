export const dynamic = 'force-dynamic';

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

  // Obtener todos los convenios (incluyendo signed_pdf_path para PDF firmados)
  const { data: convenios, error } = await supabase
    .from("convenios")
    .select(`
      *,
      profiles:user_id (
        full_name,
        role,
        career_id
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

  // Obtener usuarios para la gestión
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select(`
      *,
      careers (
        name,
        code
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

  const { data: org_units } = await supabase
    .from("org_units")
    .select("id, code, name, unit_type, secretariat_id")
    .eq("active", true)
    .order("name");

  if (error || usersError) {
    console.error("Error al obtener datos:", error || usersError);
    return (
      <>
        <BackgroundPattern />
        <div className="p-6 w-full relative">
          <Suspense fallback={<div className="h-24 w-full skeleton"></div>}>
            <DashboardHeader name="Panel Admin" subtitle="Error al cargar datos" />
          </Suspense>
          <div className="mt-6">
            <SectionContainer title="Error">
              <div className="text-center py-8 text-red-500">
                <p className="text-lg font-semibold">Error al cargar los datos</p>
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
            subtitle="Gestiona convenios, usuarios y carreras del sistema"
          />
        </Suspense>
        <AdminPanelClient
          convenios={convenios || []}
          users={users || []}
          careers={careers || []}
          secretariats={secretariats || []}
          org_units={org_units || []}
        />
      </div>
    </>
  );
}