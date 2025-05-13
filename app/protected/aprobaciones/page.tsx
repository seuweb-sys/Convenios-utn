import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { 
  ClockIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  FilterIcon
} from "lucide-react";

// Componentes refactorizados
import {
  SectionContainer,
  BackgroundPattern,
} from "@/app/components/dashboard";

export default async function AprobacionesPage() {
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
          <h1 className="text-2xl font-semibold tracking-tight">Aprobaciones</h1>
          <p className="text-muted-foreground">
            Gestión de convenios pendientes de aprobación
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Pendientes</span>
            </div>
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Todos los tipos</span>
            </div>
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Filtrar por...</span>
            </div>
          </div>

          {/* Lista de Aprobaciones */}
          <SectionContainer title="Convenios Pendientes">
            <div className="space-y-4">
              {/* Placeholder para la lista de aprobaciones */}
              <div className="text-center py-8 text-muted-foreground">
                <InfoIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No hay convenios pendientes de aprobación.</p>
                <p className="text-sm mt-2">
                  Los convenios que requieran tu aprobación aparecerán aquí.
                </p>
              </div>
            </div>
          </SectionContainer>

          {/* Historial de Aprobaciones */}
          <SectionContainer title="Historial de Aprobaciones">
            <div className="space-y-4">
              {/* Placeholder para el historial */}
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No hay historial de aprobaciones.</p>
                <p className="text-sm mt-2">
                  Aquí podrás ver el historial de tus aprobaciones anteriores.
                </p>
              </div>
            </div>
          </SectionContainer>
        </div>
      </div>
    </>
  );
} 