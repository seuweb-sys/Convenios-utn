"use client";

import { 
  FilterIcon,
  FileTextIcon,
  UsersIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfesorFiltersProps {
  data: any[];
  statusFilter: string | null;
  setStatusFilter: (s: string | null) => void;
  typeFilter: string | null;
  setTypeFilter: (t: string | null) => void;
}

const getStatusCount = (data: any[], status: string) => 
  data.filter(c => c.status === status).length;

const getTypeCount = (data: any[], typeName: string) => 
  data.filter(c => c.convenio_types?.name === typeName).length;

export function ProfesorFilters({ data, statusFilter, setStatusFilter, typeFilter, setTypeFilter }: ProfesorFiltersProps) {

  const allStatuses = Array.from(new Set(data.map(c => c.status).filter(Boolean)));
  const allTypes = Array.from(new Set(data.map(c => c.convenio_types?.name).filter(Boolean)));

  return (
    <div className="sticky top-24">
      <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 text-sm mb-3">
            <FilterIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground font-semibold">Filtrar Convenios</span>
          </div>

          <div className="space-y-4">
            {/* Filtro por Estado */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Por Estado</p>
              <div className="flex flex-col items-start gap-2">
                <Badge 
                  variant={!statusFilter ? "default" : "outline"}
                  onClick={() => setStatusFilter(null)}
                  className="cursor-pointer w-full flex justify-between"
                >
                  Todos <span className="text-muted-foreground">{data.length}</span>
                </Badge>
                {allStatuses.map(status => (
                  <Badge 
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    onClick={() => setStatusFilter(status)}
                    className="cursor-pointer w-full flex justify-between capitalize"
                  >
                    {status.replace("_", " ")} <span className="text-muted-foreground">{getStatusCount(data, status)}</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Filtro por Tipo */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Por Tipo</p>
              <div className="flex flex-col items-start gap-2">
                <Badge 
                  variant={!typeFilter ? "default" : "outline"}
                  onClick={() => setTypeFilter(null)}
                  className="cursor-pointer w-full flex justify-between"
                >
                  Todos <span className="text-muted-foreground">{data.length}</span>
                </Badge>
                {allTypes.map(type => (
                  <Badge 
                    key={type}
                    variant={typeFilter === type ? "default" : "outline"}
                    onClick={() => setTypeFilter(type)}
                    className="cursor-pointer w-full flex justify-between"
                  >
                    {type} <span className="text-muted-foreground">{getTypeCount(data, type)}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 