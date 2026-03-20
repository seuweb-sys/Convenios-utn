"use client";

import { useState } from "react";
import {
  FilterIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FileTextIcon,
  UsersIcon,
  BookOpenIcon,
  BriefcaseIcon,
  FileText,
  UserCheck,
  HeartHandshake,
  GraduationCapIcon,
  BuildingIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Career {
  id: string;
  name: string;
  code: string;
}

interface Secretariat {
  id: string;
  name: string;
  code: string;
}

interface AdminFiltersProps {
  data: any[];
  statusFilter: string | null;
  setStatusFilter: (s: string | null) => void;
  typeFilter: string | null;
  setTypeFilter: (t: string | null) => void;
  careerFilter: string | null;
  setCareerFilter: (c: string | null) => void;
  careers: Career[];
  secretariats?: Secretariat[];
  secretariatFilter?: string | null;
  setSecretariatFilter?: (s: string | null) => void;
}

const tipoConvenioUI: Record<string, { icon: React.ReactNode; color: string }> = {
  "Convenio Marco": {
    icon: <BookOpenIcon className="h-7 w-7 text-blue-500" />,
    color: "bg-blue-100 dark:bg-blue-900/20",
  },
  "Convenio Marco Práctica Supervisada": {
    icon: <UserCheck className="h-7 w-7 text-purple-500" />,
    color: "bg-purple-100 dark:bg-purple-900/20",
  },
  "Convenio Específico": {
    icon: <FileText className="h-7 w-7 text-orange-500" />,
    color: "bg-orange-100 dark:bg-orange-900/20",
  },
  "Convenio Particular de Práctica Supervisada": {
    icon: <BriefcaseIcon className="h-7 w-7 text-green-500" />,
    color: "bg-green-100 dark:bg-green-900/20",
  },
  "Acuerdo de Colaboracion": {
    icon: <HeartHandshake className="h-7 w-7 text-red-500" />,
    color: "bg-red-100 dark:bg-red-900/20",
  },
  "Acuerdo de Colaboración": {
    icon: <HeartHandshake className="h-7 w-7 text-red-500" />,
    color: "bg-red-100 dark:bg-red-900/20",
  },
};

function resolveTipoUI(typeName: string) {
  return (
    tipoConvenioUI[typeName] || {
      icon: <FileTextIcon className="h-7 w-7 text-muted-foreground" />,
      color: "",
    }
  );
}

export function AdminFilters({
  data,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  careerFilter,
  setCareerFilter,
  careers,
  secretariats = [],
  secretariatFilter = null,
  setSecretariatFilter,
}: AdminFiltersProps) {
  const [careersOpen, setCareersOpen] = useState(false);

  const availableStatuses = Array.from(
    new Set(data.map((item: any) => (item as any).status).filter(Boolean))
  );

  const availableTypes = Array.from(
    new Set(data.map((item: any) => (item as any).convenio_types?.name).filter(Boolean))
  );

  const getStatusCount = (status: string) => {
    return data.filter((item: any) => (item as any).status === status).length;
  };

  const getTypeCount = (type: string) => {
    return data.filter((item: any) => (item as any).convenio_types?.name === type)
      .length;
  };

  const getCareerCount = (careerId: string) => {
    return data.filter((item: any) => {
      const c = item as any;
      return c.career_id === careerId || c.profiles?.career_id === careerId;
    }).length;
  };

  const getSecretariatCount = (secretariatId: string) => {
    return data.filter((item: any) => (item as any).secretariat_id === secretariatId)
      .length;
  };

  return (
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
              className={`cursor-pointer transition-colors ${!statusFilter ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setStatusFilter(null)}
            >
              Todos los estados
            </span>
          </div>

          <div className="space-y-2">
            {availableStatuses.map((status) => (
              <div
                key={status}
                className={`flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md transition-colors ${statusFilter === status ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === "enviado" && <ClockIcon className="h-4 w-4" />}
                {(status === "aceptado" || status === "aprobado") && (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
                {status === "rechazado" && <XCircleIcon className="h-4 w-4" />}
                <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {getStatusCount(status)}
                </Badge>
              </div>
            ))}
          </div>

          {/* Secretarías primero */}
          {secretariats &&
            setSecretariatFilter &&
            secretariatFilter !== undefined &&
            secretariats.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                  <span
                    className={`cursor-pointer transition-colors ${!secretariatFilter ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setSecretariatFilter(null)}
                  >
                    Todas las secretarías
                  </span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {secretariats.map((secretariat) => (
                    <div
                      key={secretariat.id}
                      className={`flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md transition-colors ${secretariatFilter === secretariat.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
                      onClick={() => setSecretariatFilter(secretariat.id)}
                    >
                      <BuildingIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {secretariat.code || secretariat.name}
                      </span>
                      <Badge variant="outline" className="ml-auto text-xs shrink-0">
                        {getSecretariatCount(secretariat.id)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Carreras con toggle */}
          {careers && careers.length > 0 && (
            <div className="border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-between px-2 h-auto py-2 mb-1"
                onClick={() => setCareersOpen(!careersOpen)}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
                  Carreras
                </span>
                {careersOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              {careersOpen && (
                <>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span
                      className={`cursor-pointer transition-colors ${!careerFilter ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setCareerFilter(null)}
                    >
                      Todas las carreras
                    </span>
                  </div>
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {careers.map((career) => (
                      <div
                        key={career.id}
                        className={`flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md transition-colors ${careerFilter === career.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
                        onClick={() => setCareerFilter(career.id)}
                      >
                        <GraduationCapIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {career.code || career.name}
                        </span>
                        <Badge variant="outline" className="ml-auto text-xs shrink-0">
                          {getCareerCount(career.id)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-base font-semibold mb-3">
              <FileTextIcon className="h-5 w-5 text-muted-foreground" />
              <span>Tipo de convenio</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className={`text-left text-xs px-2 py-1.5 rounded-md w-full ${!typeFilter ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/40 text-muted-foreground"}`}
                onClick={() => setTypeFilter(null)}
              >
                Todos los tipos
              </button>
              {availableTypes.map((type) => {
                const ui = resolveTipoUI(type);
                return (
                  <div
                    key={type}
                    className={`flex items-start gap-3 cursor-pointer p-2 rounded-lg transition-colors ${typeFilter === type ? ui.color + " ring-2 ring-primary/60" : "hover:bg-muted/30 border border-transparent"}`}
                    onClick={() => setTypeFilter(type)}
                  >
                    <div className="shrink-0 pt-0.5">{ui.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium leading-snug">{type}</p>
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {getTypeCount(type)} convenios
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-sm mb-3">
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Resumen rápido</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-center">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <div className="text-xl font-bold text-blue-600">
                  {getStatusCount("enviado")}
                </div>
                <div className="text-xs text-blue-600/80">Enviados</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <div className="text-xl font-bold text-green-600">
                  {getStatusCount("aceptado") + getStatusCount("aprobado")}
                </div>
                <div className="text-xs text-green-600/80">Aprobados</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
