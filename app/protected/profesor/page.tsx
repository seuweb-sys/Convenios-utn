"use client";

import { useState, useEffect } from "react";
import { ProfesorPanelClient } from "./ProfesorPanelClient";
import {
  SectionContainer,
  BackgroundPattern,
  DashboardHeader
} from "@/app/components/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

export default function ProfesorPage() {
  const [misConvenios, setMisConvenios] = useState<any[]>([]);
  const [conveniosCarrera, setConveniosCarrera] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch solo mis convenios
        const resMine = await fetch("/api/convenios?limit=1000&full=true&mine=true");
        if (!resMine.ok) {
          throw new Error("Error al cargar mis convenios");
        }
        const mineData = await resMine.json();
        setMisConvenios(mineData || []);

        // Fetch convenios de mi carrera (todos los de la carrera)
        const resCareer = await fetch("/api/convenios?limit=1000&full=true");
        if (!resCareer.ok) {
          throw new Error("Error al cargar convenios de carrera");
        }
        const careerData = await resCareer.json();
        setConveniosCarrera(careerData || []);

        console.log("Mis convenios:", mineData?.length, "Carrera:", careerData?.length);
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
          subtitle="Visualiza convenios de tu carrera"
        />
        <div className="mt-6">
          <Tabs defaultValue="carrera" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="carrera">
                Convenios de mi Carrera ({conveniosCarrera.length})
              </TabsTrigger>
              <TabsTrigger value="mios">
                Mis Convenios ({misConvenios.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="carrera">
              <ProfesorPanelClient convenios={conveniosCarrera} showOwnerInfo={true} />
            </TabsContent>

            <TabsContent value="mios">
              <ProfesorPanelClient convenios={misConvenios} showOwnerInfo={false} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}