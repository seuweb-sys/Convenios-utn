"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ProfesorPanelClient } from "./ProfesorPanelClient";
import {
  SectionContainer,
  BackgroundPattern,
  DashboardHeader
} from "@/app/components/dashboard";

export default function ProfesorPage() {
  const [convenios, setConvenios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Verificar autenticación
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          window.location.href = "/sign-in";
          return;
        }

        // Verificar rol
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "admin" && profile?.role !== "profesor") {
          window.location.href = "/protected";
          return;
        }

        // Obtener convenios con joins completos igual que admin
        const { data: conveniosData, error: conveniosError } = await supabase
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

        if (conveniosError) {
          throw new Error("Error al cargar convenios");
        }

        setConvenios(conveniosData || []);
        console.log("Convenios cargados:", conveniosData?.length);
      } catch (e) {
        console.error("Error:", e);
        setError(e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <BackgroundPattern />
        <div className="p-6 w-full relative">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded-lg w-64 mb-2"></div>
            <div className="h-4 bg-muted rounded-lg w-96 mb-8"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <BackgroundPattern />
        <div className="p-6 w-full relative">
          <DashboardHeader name="Panel de Profesor" subtitle="Error al cargar convenios" />
          <div className="mt-6">
            <SectionContainer title="Error">
              <div className="text-center py-12 text-red-500">
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
        <DashboardHeader 
          name="Panel de Profesor" 
          subtitle="Visualiza y filtra todos los convenios del sistema" 
        />
        <ProfesorPanelClient convenios={convenios} />
      </div>
    </>
  );
} 