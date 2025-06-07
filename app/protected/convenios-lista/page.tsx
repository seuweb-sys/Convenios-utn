"use client";

import { useEffect, useState, Suspense } from "react";
import { 
  FileTextIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  InfoIcon,
  FilterIcon,
  PlusIcon
} from "lucide-react";

import {
  SectionContainer,
  BackgroundPattern,
  DashboardHeader
} from "@/app/components/dashboard";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

interface ConvenioData {
  id: string;
  title: string;
  convenio_type_id: string;
  status: string;
  created_at: string;
}

// Componente de esqueleto para los items de convenio
const ConvenioItemSkeleton = () => (
  <div className="flex items-center justify-between p-4 bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg">
    <div className="flex items-center gap-4">
      <div className="p-2 rounded-lg bg-primary/5 animate-pulse">
        <div className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="h-6 w-24 bg-muted animate-pulse rounded-full" />
      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
    </div>
  </div>
);

// Componente de esqueleto para los filtros
const FiltersSkeleton = () => (
  <div className="flex flex-wrap gap-4 p-2 bg-card rounded-lg">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-2">
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </div>
    ))}
  </div>
);

export default function ConveniosPage() {
  const [convenios, setConvenios] = useState<ConvenioData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/convenios")
      .then(res => res.json())
      .then(data => {
        setConvenios(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching convenios:", error);
        setLoading(false);
      });
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "aprobado":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "revision":
        return <ClockIcon className="h-4 w-4 text-amber-500" />;
      case "rechazado":
        return <AlertCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <FileTextIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "aprobado":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "revision":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
      case "rechazado":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
    }
  };

  return (
    <>
      <BackgroundPattern />
      <div className="p-6 w-full relative">
        <Suspense fallback={<div className="h-24 w-full skeleton"></div>}>
          <DashboardHeader name="Convenios" subtitle="Gestiona y visualiza todos tus convenios desde aquí" />
        </Suspense>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-2">
          <div className="lg:col-span-2 space-y-6">
            <SectionContainer title="Lista de Convenios">
              <div className="space-y-4">
                {loading ? (
                  <>
                    <ConvenioItemSkeleton />
                    <ConvenioItemSkeleton />
                    <ConvenioItemSkeleton />
                  </>
                ) : convenios.length > 0 ? (
                  convenios.map((convenio) => (
                    <div 
                      key={convenio.id} 
                      className="flex items-center justify-between p-4 bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileTextIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{convenio.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Tipo: {convenio.convenio_type_id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
                          getStatusColor(convenio.status)
                        )}>
                          {getStatusIcon(convenio.status)}
                          {convenio.status}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(convenio.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <InfoIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>No tienes convenios creados aún.</p>
                    <p className="text-sm mt-2">
                      Crea tu primer convenio usando las plantillas disponibles.
                    </p>
                  </div>
                )}
              </div>
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
                    <span className="text-sm">Todos los estados</span>
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
              )}
            </SectionContainer>
          </div>
        </div>
      </div>
    </>
  );
}