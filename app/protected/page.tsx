export const dynamic = 'force-dynamic';

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
import { isPracticeType } from "@/app/lib/authz/scope-rules";
import { shouldApplyProfesorPracticeOnlyConvenioFilter } from "@/app/lib/authz/profesor-membership-scope";
import { shouldUseMineOnlyConveniosForDashboard } from "@/app/lib/authz/membership-scope";

// Componente principal del dashboard
export default async function Dashboard() {
  const supabase = await createClient();
  
  // Obtener el usuario actual para el DashboardHeader
  const { data: { user } } = await supabase.auth.getUser();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuario";

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null as { role: string } | null };

  const mineOnlyDashboard =
    !!user &&
    !!profile &&
    (await shouldUseMineOnlyConveniosForDashboard(supabase, user.id, profile.role));

  // Cargar datos de manera paralela
  const [convenioTypesRaw, convenios, activityItems] = await Promise.all([
    getConvenioTypes(),
    getUserConvenios(4, { mine: mineOnlyDashboard }),
    getRecentActivity(3) // Limitar a 3 actividades recientes
  ]);

  /** Membresía profesor (profile_memberships): solo cards de práctica supervisada (tipos 1 y 5). */
  let convenioTypes = convenioTypesRaw;
  if (
    user &&
    profile &&
    (await shouldApplyProfesorPracticeOnlyConvenioFilter(supabase, user.id, profile.role))
  ) {
    convenioTypes = convenioTypesRaw.filter((t) => isPracticeType(t.id));
  }

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
              title="Actividad reciente" 
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
              title="Mis convenios" 
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
            <SectionContainer title="Crear nuevo convenio">
              <div className="space-y-4">
                {convenioTypes.map((tipo) => (
                  <ConvenioTypeCard
                    key={tipo.id}
                    title={tipo.title}
                    description={tipo.description}
                    icon={tipo.icon}
                    color={tipo.color as ConvenioColor}
                    previewUrl={tipo.previewUrl}
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
