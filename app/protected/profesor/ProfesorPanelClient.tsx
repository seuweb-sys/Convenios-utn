"use client";
import { useState } from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { SectionContainer } from "@/app/components/dashboard";
import {
  FilterIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FileTextIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfesorPanelClientProps {
  convenios: any[];
  showOwnerInfo?: boolean;
}

export function ProfesorPanelClient({ convenios, showOwnerInfo = false }: ProfesorPanelClientProps) {
  console.log("ProfesorPanelClient recibió:", convenios);

  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const filteredConvenios = (convenios || []).filter((c) => {
    const statusOk = !statusFilter || c.status === statusFilter;
    const typeOk = !typeFilter || c.convenio_types?.name === typeFilter;
    return statusOk && typeOk;
  });

  // Extraer estados y tipos únicos
  const availableStatuses = Array.from(new Set(
    convenios.map((item: any) => item.status).filter(Boolean)
  ));

  const availableTypes = Array.from(new Set(
    convenios.map((item: any) => item.convenio_types?.name).filter(Boolean)
  ));

  const getStatusCount = (status: string) => {
    return convenios.filter((item: any) => item.status === status).length;
  };

  console.log("Convenios filtrados:", filteredConvenios.length);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-4">
        <SectionContainer title={showOwnerInfo ? "Convenios de tu Carrera" : "Tus Convenios"}>
          <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg overflow-hidden">
            <DataTable columns={columns} data={filteredConvenios} />
          </div>
        </SectionContainer>
      </div>
      <div className="lg:col-span-1">
        {/* Filtros simplificados sin career */}
        <div className="space-y-4">
          <div className="p-4 bg-card/80 backdrop-blur-sm shadow-lg rounded-xl border border-border/60">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FilterIcon className="h-5 w-5 text-muted-foreground" />
              Filtros
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <span
                  className={`cursor-pointer transition-colors ${!statusFilter ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setStatusFilter(null)}
                >
                  Todos los estados
                </span>
              </div>

              <div className="space-y-2">
                {availableStatuses.map(status => (
                  <div
                    key={status}
                    className={`flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md transition-colors ${statusFilter === status
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'enviado' && <ClockIcon className="h-4 w-4" />}
                    {(status === 'aceptado' || status === 'aprobado') && <CheckCircleIcon className="h-4 w-4" />}
                    {status === 'rechazado' && <XCircleIcon className="h-4 w-4" />}
                    <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {getStatusCount(status)}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Resumen */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 gap-2 text-center">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <div className="text-xl font-bold text-blue-600">{convenios.length}</div>
                    <div className="text-xs text-blue-600/80">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}