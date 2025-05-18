"use client";

import { useEffect, useState } from "react";
import { DashboardHeader, SectionContainer, BackgroundPattern } from "@/app/components/dashboard";
import { FileTextIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConveniosPage() {
  const [convenios, setConvenios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/convenios")
      .then(res => res.json())
      .then(data => {
        setConvenios(data);
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

  if (loading) {
    return (
      <>
        <BackgroundPattern />
        <div className="p-6 max-w-screen-2xl mx-auto relative">
          <DashboardHeader name="Convenios" subtitle="Cargando convenios..." />
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
        <DashboardHeader 
          name="Convenios" 
          subtitle="Gestiona y visualiza todos tus convenios desde aquí."
        />
        
        <SectionContainer title="Lista de Convenios">
          <div className="space-y-4">
            {convenios.length > 0 ? (
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
                <p>No tienes convenios creados aún.</p>
                <p className="text-sm mt-2">
                  Crea tu primer convenio usando las plantillas disponibles.
                </p>
              </div>
            )}
          </div>
        </SectionContainer>
      </div>
    </>
  );
}