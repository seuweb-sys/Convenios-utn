"use client";

import React from "react";
import { BuildingIcon } from "lucide-react";
import { useConvenioStore } from "@/stores/convenioStore";
import { DynamicField } from "./DynamicField";
import { validateEntidad } from "@/lib/types/convenio-marco";

export const EntidadForm = () => {
  const { convenioData, updateConvenioData } = useConvenioStore();
  const formFields = useConvenioStore((state) => state.formFields);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const entidadFields = [
    {
      name: "nombre",
      label: "Nombre de la Entidad",
      type: "text" as const,
      required: true,
      placeholder: "Ingrese el nombre de la entidad"
    },
    {
      name: "tipo",
      label: "Tipo de Entidad",
      type: "text" as const,
      required: true,
      placeholder: "Ej: Empresa, ONG, etc."
    },
    {
      name: "domicilio",
      label: "Dirección",
      type: "text" as const,
      required: true,
      placeholder: "Ingrese la dirección"
    },
    {
      name: "ciudad",
      label: "Ciudad",
      type: "text" as const,
      required: true,
      placeholder: "Ingrese la ciudad"
    },
    {
      name: "cuit",
      label: "CUIT (sin guiones ni puntos)",
      type: "text" as const,
      required: true,
      placeholder: "Ej: 20445041743 (sin guiones ni puntos)"
    }
  ];

  const currentEntidad = (convenioData.partes?.[0] as Record<string, any>) || {};
  const handleFieldChange = (fieldName: string, value: string) => {
    let newValue = value;
    if (fieldName === 'tipo' && (!value || value === 'empresa')) {
      newValue = 'Empresa';
    }
    if (fieldName === 'cuit') {
      // Solo permitir números
      newValue = value.replace(/[^0-9]/g, '');
    }
    const updatedEntidad = { ...currentEntidad, [fieldName]: newValue };
    updateConvenioData('partes', [{ ...updatedEntidad }]);
  };

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* Encabezado */}
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/20 text-primary">
            <BuildingIcon className="h-5 w-5" />
          </div>
          Datos de la Entidad
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ingresa la información de la entidad con la que se realizará el convenio.
        </p>
      </div>

      {/* Contenedor principal */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 bg-white dark:bg-gray-900/60">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          {entidadFields.map((field) => (
            <DynamicField
              key={field.name}
              field={field}
              value={currentEntidad[field.name] || ""}
              onChange={(value) => handleFieldChange(field.name, value)}
              error={errors[field.name]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 