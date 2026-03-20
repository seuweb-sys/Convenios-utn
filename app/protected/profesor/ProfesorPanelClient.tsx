"use client";

import { useMemo, useState } from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { SectionContainer } from "@/app/components/dashboard";
import {
  FilterIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FileTextIcon,
  GraduationCapIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/app/components/ui/label";

export type PanelScope = "director" | "secretario" | "profesor";

interface ProfesorPanelClientProps {
  convenios: any[];
  showOwnerInfo?: boolean;
  /** Cuando viene del panel por membresía (API scope) */
  scope?: PanelScope;
  /** Carreras posibles para filtrar (ids desde datos o membresías) */
  careerOptions?: { id: string; name: string }[];
}

export function ProfesorPanelClient({
  convenios,
  showOwnerInfo = false,
  scope,
  careerOptions = [],
}: ProfesorPanelClientProps) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [careerFilter, setCareerFilter] = useState<string | null>(null);

  const careerIdsFromRow = (c: any) => c.career_id || c.careers?.id;

  const filteredConvenios = (convenios || []).filter((c) => {
    const statusOk = !statusFilter || c.status === statusFilter;
    const typeOk = !typeFilter || c.convenio_types?.name === typeFilter;
    const careerOk =
      !careerFilter || String(careerIdsFromRow(c)) === careerFilter;
    return statusOk && typeOk && careerOk;
  });

  const availableStatuses = Array.from(
    new Set(convenios.map((item: any) => item.status).filter(Boolean))
  );

  const availableTypes = useMemo(() => {
    const names = Array.from(
      new Set(convenios.map((item: any) => item.convenio_types?.name).filter(Boolean))
    ) as string[];
    if (scope === "profesor") {
      const practice = [
        "Convenio Particular de Práctica Supervisada",
        "Convenio Marco Práctica Supervisada",
      ];
      const present = practice.filter((p) => names.includes(p));
      return present.length > 0 ? present : practice;
    }
    return names;
  }, [convenios, scope]);

  const getStatusCount = (status: string) => {
    return convenios.filter((item: any) => item.status === status).length;
  };

  const sectionTitle = scope
    ? scope === "director"
      ? "Convenios en tus carreras (director)"
      : scope === "secretario"
        ? "Convenios de tu secretaría"
        : "Práctica supervisada (tus carreras)"
    : showOwnerInfo
      ? "Convenios de tu Carrera"
      : "Tus Convenios";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-4">
        <SectionContainer title={sectionTitle}>
          <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg overflow-hidden">
            <DataTable columns={columns} data={filteredConvenios} />
          </div>
        </SectionContainer>
      </div>
      <div className="lg:col-span-1">
        <div className="space-y-4">
          <div className="p-4 bg-card/80 backdrop-blur-sm shadow-lg rounded-xl border border-border/60">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FilterIcon className="h-5 w-5 text-muted-foreground" />
              Filtros
            </h3>

            <div className="space-y-4">
              {careerOptions.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <GraduationCapIcon className="h-3.5 w-3.5" />
                    Carrera
                  </Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={careerFilter ?? "all"}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCareerFilter(v === "all" ? null : v);
                    }}
                  >
                    <option value="all">Todas las carreras</option>
                    {careerOptions.map((co) => (
                      <option key={co.id} value={co.id}>
                        {co.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                    className={`flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md transition-colors ${
                      statusFilter === status
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === "enviado" && <ClockIcon className="h-4 w-4" />}
                    {(status === "aceptado" || status === "aprobado") && (
                      <CheckCircleIcon className="h-4 w-4" />
                    )}
                    {status === "rechazado" && <XCircleIcon className="h-4 w-4" />}
                    <span>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {getStatusCount(status)}
                    </Badge>
                  </div>
                ))}
              </div>

              {availableTypes.length > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                    Tipo de convenio
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      className={`text-xs w-full text-left p-2 rounded-md ${!typeFilter ? "bg-primary/10 text-primary" : "hover:bg-muted/40"}`}
                      onClick={() => setTypeFilter(null)}
                    >
                      Todos los tipos
                    </button>
                    {availableTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`text-xs w-full text-left p-2 rounded-md ${typeFilter === t ? "bg-primary/10 text-primary" : "hover:bg-muted/40"}`}
                        onClick={() => setTypeFilter(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-1 gap-2 text-center">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <div className="text-xl font-bold text-blue-600">
                      {filteredConvenios.length}
                    </div>
                    <div className="text-xs text-blue-600/80">Mostrados</div>
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
