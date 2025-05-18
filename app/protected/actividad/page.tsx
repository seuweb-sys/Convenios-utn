import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { 
  ClockIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon
} from "lucide-react";

// Componentes refactorizados
import {
  ActivityItem,
  SectionContainer,
  BackgroundPattern,
} from "@/app/components/dashboard";

export default async function ActividadPage() {
  const supabase = await createClient();
  
  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuario";

  return (
    <>
      {/* Fondo con patrón de puntos estático */}
      <BackgroundPattern />
      
      <div className="p-6 w-full relative">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Actividad</h1>
          <p className="text-muted-foreground">
            Historial de actividades y cambios en el sistema
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Últimos 7 días</span>
            </div>
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Todos los tipos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Todos los estados</span>
            </div>
          </div>

          {/* Lista de Actividad */}
          <SectionContainer title="Historial de Actividad">
            <div className="space-y-4">
              {/* Placeholder para la lista de actividad */}
              <div className="text-center py-8 text-muted-foreground">
                <InfoIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No hay actividad para mostrar.</p>
                <p className="text-sm mt-2">
                  La actividad aparecerá aquí cuando se realicen cambios en el sistema.
                </p>
              </div>
            </div>
          </SectionContainer>
        </div>
      </div>
    </>
  );
} 