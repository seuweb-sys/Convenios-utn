"use client";

import { useEffect, useState } from "react";
import { 
  ClockIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  FilePlusIcon,
  EditIcon
} from "lucide-react";

// Componentes refactorizados
import {
  ActivityItem,
  SectionContainer,
  BackgroundPattern,
} from "@/app/components/dashboard";
import { ActivityType } from "@/lib/types";

interface ActivityData {
  id: string;
  action: string;
  status_from: string | null;
  status_to: string | null;
  created_at: string;
  convenio_title: string;
  convenio_serial: string;
  user_name: string;
}

export default function ActividadPage() {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then(res => res.json())
      .then(data => {
        setActivities(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching activity:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <>
        <BackgroundPattern />
        <div className="p-6 max-w-screen-2xl mx-auto relative">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Actividad</h1>
            <p className="text-muted-foreground">Cargando actividad...</p>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
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
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => {
                  let icon = <FileTextIcon className="h-5 w-5" />;
                  let type: ActivityType = "info";
                  let title = "Actividad en convenio";
                  let description = "";

                  switch(activity.action) {
                    case "create":
                      icon = <FilePlusIcon className="h-5 w-5" />;
                      title = "Nuevo convenio creado";
                      description = `Se ha creado el convenio "${activity.convenio_title}" (${activity.convenio_serial})`;
                      break;
                    case "update":
                      icon = <EditIcon className="h-5 w-5" />;
                      title = "Convenio actualizado";
                      description = `Se han realizado cambios en "${activity.convenio_title}"`;
                      break;
                    case "update_status":
                      if (activity.status_to === "aprobado") {
                        icon = <CheckCircleIcon className="h-5 w-5" />;
                        type = "success";
                        title = "Convenio aprobado";
                        description = `El convenio "${activity.convenio_title}" ha sido aprobado`;
                      } else if (activity.status_to === "rechazado") {
                        icon = <AlertCircleIcon className="h-5 w-5" />;
                        type = "error";
                        title = "Convenio rechazado";
                        description = `El convenio "${activity.convenio_title}" ha sido rechazado`;
                      } else if (activity.status_to === "revision") {
                        icon = <ClockIcon className="h-5 w-5" />;
                        title = "Convenio enviado a revisión";
                        description = `El convenio "${activity.convenio_title}" está siendo revisado`;
                      }
                      break;
                  }

                  return (
                    <ActivityItem
                      key={activity.id}
                      title={title}
                      description={description}
                      time={new Date(activity.created_at).toLocaleString()}
                      type={type}
                      icon={icon}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <InfoIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No hay actividad para mostrar.</p>
                <p className="text-sm mt-2">
                  La actividad aparecerá aquí cuando se realicen cambios en el sistema.
                </p>
              </div>
            )}
          </SectionContainer>
        </div>
      </div>
    </>
  );
} 