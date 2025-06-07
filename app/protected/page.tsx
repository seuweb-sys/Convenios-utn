import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { 
  FileTextIcon, 
  ClockIcon, 
  CheckIcon, 
  AlertCircleIcon, 
  UsersIcon,
  BuildingIcon,
  ClipboardCheckIcon
} from "lucide-react";

// Componentes refactorizados
import {
  ConvenioItem,
  ConvenioTypeCard,
  ActivityItem,
  DashboardHeader,
  SectionContainer,
  BackgroundPattern,
  ConvenioStatus,
  ConvenioColor
} from "@/app/components/dashboard";

// Importar funciones de carga de datos
import {
  getConvenioTypes,
  getUserConvenios,
  getRecentActivity
} from "@/app/lib/dashboard";

// Componente principal del dashboard
export default async function Dashboard() {
  const supabase = await createClient();
  
  // Obtener el usuario actual para el DashboardHeader
  const { data: { user } } = await supabase.auth.getUser();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuario";

  // Cargar datos de manera paralela
  const [convenioTypes, convenios, activityItems] = await Promise.all([
    getConvenioTypes(),
    getUserConvenios(4), // Limitar a 4 convenios
    getRecentActivity(3) // Limitar a 3 actividades recientes
  ]);

  // Filtrar los tipos de convenio marco
  const conveniosMarco = convenioTypes.filter((type) => type.title.toLowerCase().includes("marco"));

  return (
    <>
      {/* Fondo con patrón de puntos estático */}
      <BackgroundPattern />
      
      <div className="p-6 w-full relative">
        {/* Dashboard Header */}
        <Suspense fallback={<div className="h-24 w-full skeleton"></div>}>
          <DashboardHeader name={userName} />
        </Suspense>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Actividad Reciente y Listado de Convenios */}
          <div className="lg:col-span-2 space-y-6">
            {/* Actividad Reciente */}
            <SectionContainer 
              title="Actividad Reciente" 
              viewAllLink="/protected/actividad"
            >
              <div className="space-y-4">
                {activityItems.length > 0 ? (
                  activityItems.map((item, index) => (
                    <ActivityItem
                      key={index}
                      title={item.title}
                      description={item.description}
                      time={item.time}
                      type={item.type}
                      icon={item.icon}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No hay actividad reciente.</p>
                  </div>
                )}
              </div>
            </SectionContainer>
            
            {/* Listado de Convenios */}
            <SectionContainer 
              title="Mis Convenios" 
              viewAllLink="/protected/convenios-lista"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {convenios.length > 0 ? (
                  convenios.map((convenio) => (
                    <ConvenioItem
                      key={convenio.id}
                      id={convenio.id}
                      title={convenio.title}
                      date={convenio.date}
                      type={convenio.type}
                      status={convenio.status as ConvenioStatus}
                    />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    <p>No tienes convenios creados aún.</p>
                    <p className="text-sm mt-2">
                      Crea tu primer convenio usando las plantillas disponibles.
                    </p>
                  </div>
                )}
              </div>
            </SectionContainer>
          </div>
          
          {/* Crear Nuevo Convenio */}
          <div className="space-y-6">
            <SectionContainer title="Crear Nuevo Convenio">
              <p className="text-sm text-muted-foreground mb-5">
                Selecciona un modelo para comenzar. <span className="font-semibold text-primary">Disponibles: Convenio Marco y Convenio Marco Práctica Supervisada.</span>
              </p>
              <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
                {conveniosMarco.map((tipo) => (
                  <ConvenioTypeCard
                    key={tipo.id}
                    title={tipo.title}
                    description={tipo.description}
                    icon={tipo.icon}
                    color={tipo.color as ConvenioColor}
                    previewUrl={tipo.previewUrl}
                    typeId={tipo.id}
                  />
                ))}
              </div>
            </SectionContainer>
          </div>
        </div>
      </div>
    </>
  );
}
