"use client";

import React from "react";
import { CalendarIcon } from "lucide-react";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { validateFechas } from "@/lib/types/convenio-marco";
import { Label } from "@/components/ui/label";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

export const FechasForm = () => {
  const { convenioData, updateConvenioData } = useConvenioMarcoStore();
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleFieldChange = (fieldName: "fechaInicio" | "fechaFin", value: string) => {
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
          Ingresa la fecha de inicio y fin del convenio.
        </p>
      </div>

      {/* Contenedor principal */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 bg-white dark:bg-gray-900/60">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          <div>
            <Label htmlFor="fechaInicio" className={errors.fechaInicio ? "text-destructive" : ""}>
              Fecha de inicio
            </Label>
            <input
              type="date"
              id="fechaInicio"
              className={`w-full mt-1.5 h-10 px-3 py-2 text-sm rounded-md border ${
                errors.fechaInicio ? 'border-destructive' : 'border-input'
              } bg-background`}
              value={convenioData.datosBasicos?.fechaInicio || ''}
              onChange={e => handleFieldChange("fechaInicio", e.target.value)}
            />
            {errors.fechaInicio && <p className="text-destructive text-sm mt-1">{errors.fechaInicio}</p>}
          </div>

          <div>
            <Label htmlFor="fechaFin" className={errors.fechaFin ? "text-destructive" : ""}>
              Fecha de fin
            </Label>
            <input
              type="date"
              id="fechaFin"
              className={`w-full mt-1.5 h-10 px-3 py-2 text-sm rounded-md border ${
                errors.fechaFin ? 'border-destructive' : 'border-input'
              } bg-background`}
              value={convenioData.datosBasicos?.fechaFin || ''}
              onChange={e => handleFieldChange("fechaFin", e.target.value)}
            />
            {errors.fechaFin && <p className="text-destructive text-sm mt-1">{errors.fechaFin}</p>}
          </div>

          <div className="md:col-span-2">
            <div className="rounded-md p-4 bg-muted/50 border border-muted mt-4">
              <h3 className="text-sm font-medium mb-2">Información adicional</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• El convenio tendrá una duración de <strong>3 años</strong> desde su firma</li>
                <li>• Se renovará automáticamente por única vez y por igual período</li>
                <li>• Cualquiera de las partes podrá denunciarlo con preaviso de 6 meses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 