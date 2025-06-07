"use client";

import React from "react";
import { CalendarIcon } from "lucide-react";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";

export const FechasForm = () => {
  const { convenioData, updateConvenioData } = useConvenioMarcoStore();
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleFieldChange = (fieldName: "dia" | "mes", value: string) => {
    const updated = { ...convenioData.datosBasicos, [fieldName]: value };
    updateConvenioData('datosBasicos', updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* Encabezado */}
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/20 text-primary">
            <CalendarIcon className="h-5 w-5" />
          </div>
          Fechas del Convenio
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ingresá el día y el mes de firma del convenio.
        </p>
      </div>

      {/* Contenedor principal */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 bg-white dark:bg-gray-900/60">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          <div>
            <Label htmlFor="dia" className={errors.dia ? "text-destructive" : ""}>
              Día de firma
            </Label>
            <Input
              type="number"
              id="dia"
              min={1}
              max={31}
              className={`w-full mt-1.5 h-10 px-3 py-2 text-sm rounded-md border ${
                errors.dia ? 'border-destructive' : 'border-input'
              } bg-background`}
              value={convenioData.datosBasicos?.dia || ''}
              onChange={e => handleFieldChange("dia", e.target.value)}
              placeholder="Ej: 15"
            />
            {errors.dia && <p className="text-destructive text-sm mt-1">{errors.dia}</p>}
          </div>
          <div>
            <Label htmlFor="mes" className={errors.mes ? "text-destructive" : ""}>
              Mes de firma
            </Label>
            <Input
              type="text"
              id="mes"
              className={`w-full mt-1.5 h-10 px-3 py-2 text-sm rounded-md border ${
                errors.mes ? 'border-destructive' : 'border-input'
              } bg-background`}
              value={convenioData.datosBasicos?.mes || ''}
              onChange={e => handleFieldChange("mes", e.target.value)}
              placeholder="Ej: junio"
            />
            {errors.mes && <p className="text-destructive text-sm mt-1">{errors.mes}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}; 