"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { practicaMarcoSteps } from "./steps";
import { useConvenioStore } from "@/stores/convenioStore";
import { BuildingIcon, UserIcon, CalendarIcon } from "lucide-react";
import { Button } from "../../ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

// Generar schemas dinámicos por paso
const getStepSchema = (fields: any[]) => {
  const shape: Record<string, any> = {};
  fields.forEach((f: any) => {
    let base = z.string();
    if (f.type === "number") base = z.string().regex(/^\d+$/, "Solo números");
    if (f.required) base = base.min(1, "Este campo es obligatorio");
    shape[f.name] = base;
  });
  return z.object(shape);
};

const placeholders: Record<string, string> = {
  entidad_nombre: "Ingrese el nombre de la entidad",
  entidad_domicilio: "Ingrese el domicilio legal",
  entidad_ciudad: "Ingrese la ciudad",
  entidad_cuit: "Ej: 20445041743 (sin guiones ni puntos)",
  entidad_rubro: "Ej: Software, Construcción, etc.",
  entidad_representante: "Nombre completo del representante",
  entidad_dni: "Ej: 12345678 (sin puntos)",
  entidad_cargo: "Ej: Director, Gerente, etc.",
  dia: "Ej: 15",
  mes: "Ej: Marzo"
};

const labelHighlights: Record<string, string> = {
  entidad_cuit: "CUIT (sin guiones ni puntos)",
  entidad_dni: "DNI (sin puntos)",
  entidad_nombre: "Nombre de la entidad",
  entidad_domicilio: "Domicilio de la entidad",
  entidad_ciudad: "Ciudad de la entidad",
  entidad_rubro: "Rubro/actividad de la entidad",
};

const stepIcons: Record<string, React.ReactNode> = {
  "Datos de la Entidad": <BuildingIcon className="h-5 w-5" />,
  "Datos del Representante": <UserIcon className="h-5 w-5" />,
  "Fechas del Convenio": <CalendarIcon className="h-5 w-5" />,
};

const stepSubtitles: Record<string, string> = {
  "Datos de la Entidad": "Ingresa la información de la entidad con la que se realizará el convenio.",
  "Datos del Representante": "Ingresa la información del representante legal de la entidad.",
  "Fechas del Convenio": "Ingresá el día y el mes de firma del convenio.",
};

const ConvenioPracticaMarcoForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = practicaMarcoSteps[currentStep];
  const { updateConvenioData, convenioData } = useConvenioStore();

  const schema = getStepSchema(step.fields);
  const form = useForm<any>({
    resolver: zodResolver(schema),
    mode: "onChange"
  });

  const onSubmit = (data: any) => {
    updateConvenioData(currentStep, data);
    if (currentStep < practicaMarcoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      form.reset();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* Encabezado del paso */}
      {step.title !== "Revisión" && (
        <div className="space-y-2 mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-primary/20 text-primary">
              {stepIcons[step.title]}
            </div>
            {step.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {stepSubtitles[step.title]}
          </p>
        </div>
      )}
      {step.fields.length > 0 ? (
        <form className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 bg-white dark:bg-gray-900/60" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            {step.fields.map((field: any) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  {labelHighlights[field.name] ? (
                    <span className="font-semibold text-foreground">{labelHighlights[field.name]}</span>
                  ) : (
                    field.label
                  )}
                </label>
                <input
                  type={field.type === "number" ? "text" : field.type}
                  {...form.register(field.name)}
                  placeholder={placeholders[field.name] || field.label}
                  className="w-full border rounded px-3 py-2 bg-background text-sm placeholder:text-muted-foreground"
                />
                {form.formState.errors && (form.formState.errors as any)[field.name] && (
                  <p className="text-destructive text-xs mt-1">
                    {(() => {
                      const err = (form.formState.errors as any)[field.name]?.message?.toString();
                      if (err?.toLowerCase().includes('obligatorio') || err?.toLowerCase().includes('requerido')) {
                        return `Este campo es obligatorio.`;
                      }
                      if (err?.toLowerCase().includes('números')) {
                        return `Solo números. No uses puntos ni guiones.`;
                      }
                      if (err?.toLowerCase().includes('caracteres')) {
                        return err;
                      }
                      return err || 'Campo inválido.';
                    })()}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-8">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                className="h-10 px-6"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
            <Button
              type="submit"
              className="h-10 px-6"
            >
              Siguiente <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 border rounded bg-muted text-sm">Revisión: aquí se mostrará el resumen de los datos cargados.</div>
      )}
    </div>
  );
};

export default ConvenioPracticaMarcoForm;
