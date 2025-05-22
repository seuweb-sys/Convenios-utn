"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { EntidadForm } from "./EntidadForm";
import { RepresentanteForm } from "./RepresentanteForm";
import { FechasForm } from "./FechasForm";

const STEPS = [
  {
    title: "Datos de la Entidad",
    component: EntidadForm
  },
  {
    title: "Datos del Representante",
    component: RepresentanteForm
  },
  {
    title: "Fechas del Convenio",
    component: FechasForm
  }
];

// Esquema de validación para cada paso
const entidadSchema = z.object({
  nombre_entidad: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  direccion: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  telefono: z.string().min(8, "El teléfono debe tener al menos 8 dígitos"),
});

const representanteSchema = z.object({
  nombre_completo: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  cargo: z.string().min(2, "El cargo debe tener al menos 2 caracteres"),
  dni: z.string().min(7, "El DNI debe tener al menos 7 dígitos").max(8, "El DNI no puede tener más de 8 dígitos"),
});

// Función auxiliar para validar que fecha_fin sea posterior a fecha_inicio
const validarFechas = (data: { fecha_inicio: string, fecha_fin: string }) => {
  // Solo validar si ambas fechas existen
  if (!data.fecha_inicio || !data.fecha_fin) return true;
  
  const inicio = new Date(data.fecha_inicio);
  const fin = new Date(data.fecha_fin);
  
  return fin > inicio;
};

const fechasSchema = z.object({
  fecha_inicio: z.string()
    .min(1, "La fecha de inicio es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "El formato de fecha debe ser AAAA-MM-DD"),
  fecha_fin: z.string()
    .min(1, "La fecha de fin es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "El formato de fecha debe ser AAAA-MM-DD"),
  duracion: z.string()
    .min(1, "La duración es requerida")
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, "La duración debe ser un número positivo")
}).refine(data => validarFechas(data), {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["fecha_fin"]
});

interface ConvenioMarcoFormProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  formState: Record<string, any>;
  onFormStateChange: (state: Record<string, any>) => void;
  onError: (error: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

export function ConvenioMarcoForm({
  currentStep,
  onStepChange,
  formState,
  onFormStateChange,
  onError,
  isSubmitting,
  setIsSubmitting
}: ConvenioMarcoFormProps) {
  const router = useRouter();
  const { updateConvenioData, convenioData } = useConvenioMarcoStore();
  const [validationSchema, setValidationSchema] = useState<z.ZodTypeAny>(entidadSchema);

  // Configurar el esquema de validación según el paso actual
  useEffect(() => {
    switch (currentStep) {
      case 1:
        setValidationSchema(entidadSchema);
        break;
      case 2:
        setValidationSchema(representanteSchema);
        break;
      case 3:
        setValidationSchema(fechasSchema);
        break;
    }
  }, [currentStep]);

  // CORRECCIÓN: Inicializar el formulario con valores del store global o del estado pasado
  const getDefaultValues = () => {
    if (formState[currentStep]) {
      return formState[currentStep];
    } 
    // Como respaldo, intentar obtener datos del store global según el paso
    switch(currentStep) {
      case 1:
        return {
          nombre_entidad: convenioData?.entidad?.nombre || '',
          direccion: convenioData?.entidad?.domicilio || '',
          telefono: convenioData?.entidad?.cuit || ''
        };
      case 2:
        return {
          nombre_completo: convenioData?.representante?.nombre || '',
          cargo: convenioData?.representante?.cargo || '',
          dni: convenioData?.representante?.dni || ''
        };
      case 3:
        return {
          fecha_inicio: convenioData?.fechas?.dia || '',
          fecha_fin: convenioData?.fechas?.mes || '',
          duracion: ''
        };
      default:
        return {};
    }
  };

  const form = useForm<any>({
    resolver: zodResolver(validationSchema),
    defaultValues: getDefaultValues(),
    mode: "onChange"
  });

  // CORRECCIÓN: Sincronizar el formulario cuando cambia el paso
  useEffect(() => {
    form.reset(getDefaultValues());
  }, [currentStep]);

  const onSubmit = async (data: z.infer<typeof validationSchema>) => {
    try {
      // Guardar los datos del paso actual
      const newFormState = {
        ...formState,
        [currentStep]: data,
      };
      onFormStateChange(newFormState);
      
      // CORRECCIÓN: Actualizar el store global según el paso
      switch(currentStep) {
        case 1:
          updateConvenioData('entidad', {
            nombre: data.nombre_entidad,
            domicilio: data.direccion,
            cuit: data.telefono,
            tipo: data.tipo || 'Empresa',
            ciudad: data.ciudad || 'Resistencia'
          });
          break;
        case 2:
          updateConvenioData('representante', {
            nombre: data.nombre_completo,
            cargo: data.cargo,
            dni: data.dni
          });
          break;
        case 3:
          updateConvenioData('fechas', {
            dia: data.dia,
            mes: data.mes
          });
          break;
      }

      // Si es el último paso, enviar todo el formulario
      if (currentStep === 3) {
        setIsSubmitting(true);
        try {
          // Obtener los datos del convenio en formato DB
          const dbData = {
            entidad_nombre: convenioData?.entidad?.nombre || '',
            entidad_tipo: convenioData?.entidad?.tipo || '',
            entidad_domicilio: convenioData?.entidad?.domicilio || '',
            entidad_ciudad: convenioData?.entidad?.ciudad || '',
            entidad_cuit: convenioData?.entidad?.cuit || '',
            entidad_representante: convenioData?.representante?.nombre || '',
            entidad_dni: convenioData?.representante?.dni || '',
            entidad_cargo: convenioData?.representante?.cargo || '',
            dia: data.dia || convenioData?.fechas?.dia || '',
            mes: data.mes || convenioData?.fechas?.mes || ''
          };
          
          // Preparar los datos en el formato que la API espera
          const requestData = {
            title: `Convenio Marco - ${dbData.entidad_nombre}`,
            convenio_type_id: 2, // Según el JSON, el tipo 2 es Convenio Marco
            content_data: dbData,
            estado: 'borrador'
          };

          console.log("Enviando datos al servidor:", requestData);

          const response = await fetch('/api/convenios', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          });

          const responseData = await response.json();

          if (!response.ok) {
            throw new Error(responseData.error || 'Error al crear el convenio');
          }

          console.log("Convenio guardado exitosamente:", responseData);
          onError(null); // Limpiar cualquier error previo
          
          // Redirigir a la página de convenios (corregido)
          router.push('/protected/convenios-lista');
        } catch (error) {
          console.error("Error guardando convenio:", error);
          onError(error instanceof Error ? error.message : 'Error inesperado al enviar el formulario');
          setIsSubmitting(false);
        }
      } else {
        // Avanzar al siguiente paso
        onStepChange(currentStep + 1);
      }
    } catch (error) {
      console.error("Error en el formulario:", error);
      onError("Ocurrió un error al procesar el formulario. Por favor verifica los datos.");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <FormField
              control={form.control}
              name="nombre_entidad"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">Nombre de la Entidad</FormLabel>
                  <FormControl>
                    <Input className="border-border focus-visible:ring-primary" placeholder="Ingrese el nombre de la entidad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">Dirección</FormLabel>
                  <FormControl>
                    <Input className="border-border focus-visible:ring-primary" placeholder="Ingrese la dirección" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">Teléfono</FormLabel>
                  <FormControl>
                    <Input className="border-border focus-visible:ring-primary" placeholder="Ingrese el teléfono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 2:
        return (
          <>
            <FormField
              control={form.control}
              name="nombre_completo"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">Nombre completo</FormLabel>
                  <FormControl>
                    <Input className="border-border focus-visible:ring-primary" placeholder="Ingrese nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cargo"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">Cargo</FormLabel>
                  <FormControl>
                    <Input className="border-border focus-visible:ring-primary" placeholder="Ingrese cargo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">DNI (sin puntos)</FormLabel>
                  <FormControl>
                    <Input className="border-border focus-visible:ring-primary" placeholder="Ingrese dni (sin puntos)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 3:
        return (
          <>
            <FormField
              control={form.control}
              name="fecha_inicio"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">Fecha de inicio</FormLabel>
                  <FormControl>
                    <Input 
                      className="border-border focus-visible:ring-primary" 
                      type="date" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Si hay fecha de fin y fecha inicio, calculamos automáticamente la duración
                        const fechaInicio = e.target.value;
                        const fechaFin = form.getValues("fecha_fin");
                        if (fechaInicio && fechaFin) {
                          const inicio = new Date(fechaInicio);
                          const fin = new Date(fechaFin);
                          const diff = fin.getTime() - inicio.getTime();
                          // Calcular diferencia en meses
                          const diffMonths = Math.ceil(diff / (1000 * 60 * 60 * 24 * 30));
                          if (diffMonths > 0) {
                            form.setValue("duracion", String(diffMonths));
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fecha_fin"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">Fecha de fin</FormLabel>
                  <FormControl>
                    <Input 
                      className="border-border focus-visible:ring-primary" 
                      type="date" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Si hay fecha de inicio y fecha fin, calculamos automáticamente la duración
                        const fechaFin = e.target.value;
                        const fechaInicio = form.getValues("fecha_inicio");
                        if (fechaInicio && fechaFin) {
                          const inicio = new Date(fechaInicio);
                          const fin = new Date(fechaFin);
                          const diff = fin.getTime() - inicio.getTime();
                          // Calcular diferencia en meses
                          const diffMonths = Math.ceil(diff / (1000 * 60 * 60 * 24 * 30));
                          if (diffMonths > 0) {
                            form.setValue("duracion", String(diffMonths));
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duracion"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">Duración (en meses)</FormLabel>
                  <FormControl>
                    <Input 
                      className="border-border focus-visible:ring-primary" 
                      type="number" 
                      min="1"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario actual */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1 mb-8">
            {renderStepContent()}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onStepChange(currentStep - 1)}
                disabled={isSubmitting}
                className="px-4 transition-all"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="px-4 transition-all"
            >
              {currentStep === 3 ? (
                isSubmitting ? (
                  <>Guardando...</>
                ) : (
                  <>Guardar Convenio</>
                )
              ) : (
                <>Siguiente <ChevronRightIcon className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 