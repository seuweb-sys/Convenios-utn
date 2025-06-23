"use client";

import { useState } from "react";
import { AdminFilters } from "@/app/protected/admin/admin-filters";
import { ConvenioItem } from "@/app/components/dashboard";

export function AprobacionesClient({ convenios }: { convenios: any[] }) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Filtra solo los que están 'enviado' o 'revision', que son los que requieren acción
  const conveniosParaAprobar = (convenios || []).filter(c => 
    c.status === 'enviado' || c.status === 'revision'
  );

  const filteredConvenios = conveniosParaAprobar.filter((convenio) => {
    const statusMatch = !statusFilter || convenio.status === statusFilter;
    const typeMatch = !typeFilter || convenio.convenio_types?.name === typeFilter;
    return statusMatch && typeMatch;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
      <div className="md:col-span-1">
        <AdminFilters
          data={conveniosParaAprobar}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
        />
      </div>
      <div className="md:col-span-3">
        {filteredConvenios.length > 0 ? (
          <div className="space-y-4">
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
          <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No hay convenios pendientes de aprobación en este momento.</p>
          </div>
        )}
      </div>
    </div>
  );
} 