"use client";

import React from "react";
import { UserIcon } from "lucide-react";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { DynamicField } from "./DynamicField";
import { validateRepresentante } from "@/lib/types/convenio-marco";

const representanteFields = [
  {
    name: "representanteNombre",
    label: "Nombre completo del Representante",
    type: "text" as const,
    required: true,
    placeholder: "Nombre y apellido completo del representante"
  },
  {
    name: "cargoRepresentante",
    label: "Cargo",
    type: "text" as const,
    required: true,
    placeholder: "Ej: Presidente, Director, Gerente"
  },
  {
    name: "representanteDni",
    label: "DNI (sin puntos)",
    type: "text" as const,
    required: true,
    placeholder: "Ej: 12345678"
  }
];

export const RepresentanteForm = () => {
  const { convenioData, updateConvenioData } = useConvenioMarcoStore();
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const currentParte = (convenioData.partes?.[0] as Record<string, any>) || {};
  const handleFieldChange = (fieldName: string, value: string) => {
    const updatedParte = { ...currentParte, [fieldName]: value };
    updateConvenioData('partes', [{ ...updatedParte }]);
  };

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* Encabezado */}
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/20 text-primary">
            <UserIcon className="h-5 w-5" />
          </div>
          Datos del Representante
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ingresa la información del representante legal de la entidad.
        </p>
      </div>

      {/* Contenedor principal */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 bg-white dark:bg-gray-900/60">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          {representanteFields.map((field) => (
            <DynamicField
              key={field.name}
              field={field}
              value={currentParte[field.name] || ""}
              onChange={(value) => handleFieldChange(field.name, value)}
              error={errors[field.name]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 