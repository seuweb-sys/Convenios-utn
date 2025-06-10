"use client";

import { useEffect, useState, Suspense } from "react";
import { 
  ClockIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  FilePlusIcon,
  EditIcon
} from "lucide-react";

import {
  ActivityItem,
  SectionContainer,
  BackgroundPattern,
  DashboardHeader
} from "@/app/components/dashboard";
import { ActivityType } from "@/lib/types";
import type { ActivityApiData } from "@/app/api/activity/route";

// Componente de esqueleto para los items de actividad
const ActivityItemSkeleton = () => (
  <div className="flex items-start gap-4 p-4 bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg">
    <div className="p-2 rounded-lg bg-primary/5 animate-pulse">
      <div className="h-5 w-5" />
    </div>
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
    </div>
  </div>
);

// Componente de esqueleto para filtros
const FiltersSkeleton = () => (
  <div className="space-y-4">
    <div className="h-4 w-full bg-muted animate-pulse rounded" />
    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
  </div>
);

export default function ActividadPage() {
  const [activities, setActivities] = useState<ActivityApiData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then(res => res.json())
      .then((data: ActivityApiData[]) => {
        setActivities(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching activity:", error);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <BackgroundPattern />
      <div className="p-6 w-full relative">
        <Suspense fallback={<div className="h-24 w-full skeleton"></div>}>
          <DashboardHeader name="Actividad" subtitle="Historial de actividades y cambios en el sistema" />
        </Suspense>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-2">
          <div className="lg:col-span-2 space-y-6">
            <SectionContainer title="Historial de Actividad">
              {loading ? (
                <div className="space-y-4">
                  <ActivityItemSkeleton />
                  <ActivityItemSkeleton />
                  <ActivityItemSkeleton />
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity, index) => {
                    // Mapear iconName a icono React
                    let icon = <FileTextIcon className="h-5 w-5" />;
                    
                    switch(activity.iconName) {
                      case "file-plus":
                        icon = <FilePlusIcon className="h-5 w-5" />;
                        break;
                      case "edit":
                        icon = <EditIcon className="h-5 w-5" />;
                        break;
                      case "check":
                        icon = <CheckCircleIcon className="h-5 w-5" />;
                        break;
                      case "alert-circle":
                        icon = <AlertCircleIcon className="h-5 w-5" />;
                        break;
                      case "clock":
                        icon = <ClockIcon className="h-5 w-5" />;
                        break;
                      default:
                        icon = <FileTextIcon className="h-5 w-5" />;
                        break;
                    }

                    return (
                      <ActivityItem
                        key={index}
                        title={activity.title}
                        description={activity.description}
                        time={activity.time}
                        type={activity.type}
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
          <div className="space-y-6">
            <SectionContainer title="Filtros">
              {loading ? (
                <FiltersSkeleton />
              ) : (
                <div className="flex flex-wrap gap-4 p-2 bg-card rounded-lg">
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
              )}
            </SectionContainer>
          </div>
        </div>
      </div>
    </>
  );
} 