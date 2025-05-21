"use client";

import React from "react";
import { CalendarIcon } from "lucide-react";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { DynamicField } from "./DynamicField";
import { validateFechas } from "@/lib/types/convenio-marco";

const FECHAS_FIELDS = [
  {
    name: "dia",
    label: "Día",
    type: "number" as const,
    required: true
  },
  {
    name: "mes",
    label: "Mes",
    type: "number" as const,
    required: true
  }
];

export const FechasForm = () => {
  const { convenioData, updateConvenioData } = useConvenioMarcoStore();
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleFieldChange = (fieldName: string, value: string) => {
    const old = convenioData.fechas || { dia: '', mes: '' };
    const newFechasData = {
      dia: fieldName === 'dia' ? value : old.dia || '',
      mes: fieldName === 'mes' ? value : old.mes || ''
    };

    // Validar el campo
    const validation = validateFechas(newFechasData);
    setErrors(validation.errors);

    // Actualizar el store
    updateConvenioData('fechas', newFechasData);
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
          Ingresa la fecha de firma del convenio.
        </p>
      </div>

      {/* Contenedor principal */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 bg-white dark:bg-gray-900/60">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          {FECHAS_FIELDS.map((field) => (
            <DynamicField
              key={field.name}
              field={field}
              value={convenioData.fechas?.[field.name as keyof typeof convenioData.fechas]}
              onChange={(value) => handleFieldChange(field.name, value)}
              error={errors[field.name]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 