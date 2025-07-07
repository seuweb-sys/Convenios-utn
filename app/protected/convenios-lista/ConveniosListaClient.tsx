"use client";

import { useState } from "react";
import { AdminFilters } from "@/app/protected/admin/admin-filters";
import { ConvenioItem } from "@/app/components/dashboard";
import { ConvenioCardSkeleton } from "@/app/components/ui/skeleton";

export function ConveniosListaClient({ convenios }: { convenios: any[] }) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredConvenios = (convenios || []).filter((convenio) => {
    const statusMatch = !statusFilter || convenio.status === statusFilter;
    const typeMatch = !typeFilter || convenio.convenio_type_id === typeFilter;
    return statusMatch && typeMatch;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
      <div className="md:col-span-1">
        <AdminFilters
          data={convenios}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
        />
      </div>
      <div className="md:col-span-3">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ConvenioCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredConvenios.length > 0 ? (
          <div className="space-y-4 animate-in fade-in-0 duration-300">
            {filteredConvenios.map((convenio) => (
              <ConvenioItem 
                key={convenio.id}
                id={convenio.id}
                title={convenio.title}
                date={new Date(convenio.created_at).toLocaleDateString('es-ES')}
                type={convenio.convenio_types.name}
                status={convenio.status}
              />
            ))}
          </div>
        ) : (
          <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg p-8 text-center animate-in fade-in-0 duration-300">
            <p className="text-muted-foreground">No se encontraron convenios con los filtros seleccionados.</p>
          </div>
        )}
      </div>
    </div>
  );
} 