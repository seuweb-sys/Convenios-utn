"use client";

import React from "react";
import { BuildingIcon } from "lucide-react";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { DynamicField } from "./DynamicField";
import { validateEntidad } from "@/lib/types/convenio-marco";

const ENTIDAD_FIELDS = [
  {
    name: "nombre",
    label: "Nombre de la entidad",
    type: "text" as const,
    required: true
  },
  {
    name: "tipo",
    label: "Tipo de entidad",
    type: "text" as const,
    required: true
  },
  {
    name: "domicilio",
    label: "Domicilio",
    type: "text" as const,
    required: true
  },
  {
    name: "ciudad",
    label: "Ciudad",
    type: "text" as const,
    required: true
  },
  {
    name: "cuit",
    label: "CUIT (sin guiones)",
    type: "number" as const,
    required: true
  }
];

export const EntidadForm = () => {
  const { convenioData, updateConvenioData } = useConvenioMarcoStore();
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleFieldChange = (fieldName: string, value: string) => {
    const old = convenioData.entidad || { nombre: '', tipo: '', domicilio: '', ciudad: '', cuit: '' };
    const newEntidadData = {
      nombre: fieldName === 'nombre' ? value : old.nombre || '',
      tipo: fieldName === 'tipo' ? value : old.tipo || '',
      domicilio: fieldName === 'domicilio' ? value : old.domicilio || '',
      ciudad: fieldName === 'ciudad' ? value : old.ciudad || '',
      cuit: fieldName === 'cuit' ? value : old.cuit || ''
    };

    // Validar el campo
    const validation = validateEntidad(newEntidadData);
    setErrors(validation.errors);

    // Actualizar el store
    updateConvenioData('entidad', newEntidadData);
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
          {ENTIDAD_FIELDS.map((field) => (
            <DynamicField
              key={field.name}
              field={field}
              value={convenioData.entidad?.[field.name as keyof typeof convenioData.entidad]}
              onChange={(value) => handleFieldChange(field.name, value)}
              error={errors[field.name]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 