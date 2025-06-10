"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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
import { ConvenioData, ParteData, DatosBasicosData } from '@/types/convenio';
import { EntidadForm } from "./EntidadForm";
import { RepresentanteForm } from "./RepresentanteForm";
import { FechasForm } from "./FechasForm";
import { Modal } from '@/app/components/ui/modal';

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
  },
  {
    title: "Revisión",
    component: null // lo manejo aparte en renderStepContent
  }
];

// Esquema de validación para cada paso
const entidadSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  tipo: z.string().min(2, "El tipo es requerido"),
  domicilio: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  ciudad: z.string().min(2, "La ciudad es requerida"),
  cuit: z.string().min(11, "El CUIT es obligatorio y debe tener al menos 11 dígitos"),
});

const representanteSchema = z.object({
  representanteNombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  cargoRepresentante: z.string().min(2, "El cargo debe tener al menos 2 caracteres"),
  representanteDni: z.string().min(7, "El DNI debe tener al menos 7 dígitos").max(8, "El DNI no puede tener más de 8 dígitos"),
});

const fechasSchema = z.object({
  dia: z.string().min(1, "El día es requerido"),
  mes: z.string().min(1, "El mes es requerido"),
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
  const [localStatus, setLocalStatus] = useState(convenioData?.status || 'borrador');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  useEffect(() => {
    setLocalStatus(convenioData?.status || 'borrador');
  }, [convenioData?.status]);

  // CORRECCIÓN: Inicializar el formulario con valores del store global o del estado pasado
  const getDefaultValues = () => {
    if (formState[currentStep]) {
      return formState[currentStep];
    }
    const parte = (convenioData?.partes?.[0] as Record<string, any>) || {};
    const datosBasicos = (convenioData?.datosBasicos as Record<string, any>) || {};
    switch(currentStep) {
      case 1:
        return {
          nombre: parte.nombre || '',
          tipo: parte.tipo || '',
          domicilio: parte.domicilio || '',
          ciudad: parte.ciudad || '',
          cuit: parte.cuit || ''
        };
      case 2:
        return {
          representanteNombre: parte.representanteNombre || '',
          cargoRepresentante: parte.cargoRepresentante || '',
          representanteDni: parte.representanteDni || ''
        };
      case 3:
        return {
          dia: datosBasicos?.dia || '',
          mes: datosBasicos?.mes || ''
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
      const newFormState = {
        ...formState,
        [currentStep]: data,
      };
      onFormStateChange(newFormState);
      const currentParte = (convenioData?.partes?.[0] as Record<string, any>) || {};
      switch(currentStep) {
        case 1:
          updateConvenioData('partes', [{
            ...currentParte,
            nombre: data.nombre,
            tipo: data.tipo,
            domicilio: data.domicilio,
            ciudad: data.ciudad,
            cuit: data.cuit
          }]);
          break;
        case 2:
          updateConvenioData('partes', [{
            ...currentParte,
            representanteNombre: data.representanteNombre,
            cargoRepresentante: data.cargoRepresentante,
            representanteDni: data.representanteDni
          }]);
          break;
        case 3:
          updateConvenioData('datosBasicos', {
            ...convenioData?.datosBasicos,
            dia: data.dia || '',
            mes: data.mes || ''
          });
          // Avanzar al paso 4 sin guardar en la base
          onStepChange(currentStep + 1);
          break;
      }
      // Avanzar al siguiente paso si no es el paso 3
      if (currentStep !== 3) {
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
              name="nombre"
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
              name="tipo"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">Tipo de Entidad</FormLabel>
                  <FormControl>
                    <Input
                      className="border-border focus-visible:ring-primary"
                      placeholder="Ej: Empresa, ONG, etc."
                      {...field}
                      value={field.value === 'empresa' ? 'Empresa' : field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="domicilio"
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
              name="ciudad"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">Ciudad</FormLabel>
                  <FormControl>
                    <Input className="border-border focus-visible:ring-primary" placeholder="Ingrese la ciudad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cuit"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">CUIT (sin guiones ni puntos)</FormLabel>
                  <FormControl>
                    <Input className="border-border focus-visible:ring-primary" placeholder="Ej: 20445041743 (sin guiones ni puntos)" {...field} />
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
              name="representanteNombre"
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
              name="cargoRepresentante"
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
              name="representanteDni"
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
              name="dia"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">Día de firma</FormLabel>
                  <FormControl>
                    <Input
                      className="border-border focus-visible:ring-primary"
                      type="number"
                      min={1}
                      max={31}
                      placeholder="Ej: 15"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mes"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-foreground">Mes de firma</FormLabel>
                  <FormControl>
                    <Input
                      className="border-border focus-visible:ring-primary"
                      type="text"
                      placeholder="Ej: Marzo"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 4:
        // Paso de revisión visual con bloques glass/blur, verticales, colores legibles
        const parte = (convenioData?.partes?.[0] as Record<string, any>) || {};
        const datosBasicos = (convenioData?.datosBasicos as Record<string, any>) || {};
        return (
          <div className="space-y-6 p-4 rounded-lg bg-background/80 border border-border backdrop-blur-md animate-in fade-in-50 max-h-[70vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-primary">Revisión final del convenio</h2>
            <div className="flex flex-col gap-6">
              <div className="rounded-xl p-6 bg-blue-900/40 border border-blue-700/30 backdrop-blur-md shadow-md text-blue-100">
                <h3 className="font-semibold text-blue-200 mb-3 text-lg">Entidad</h3>
                <div className="text-base space-y-1">
                  <div><b>Nombre:</b> <span className="text-blue-50">{parte.nombre}</span></div>
                  <div><b>Tipo:</b> <span className="text-blue-50">{parte.tipo}</span></div>
                  <div><b>Dirección:</b> <span className="text-blue-50">{parte.domicilio}</span></div>
                  <div><b>Ciudad:</b> <span className="text-blue-50">{parte.ciudad}</span></div>
                  <div><b>CUIT:</b> <span className="text-blue-50">{parte.cuit}</span></div>
                </div>
              </div>
              <div className="rounded-xl p-6 bg-green-900/40 border border-green-700/30 backdrop-blur-md shadow-md text-green-100">
                <h3 className="font-semibold text-green-200 mb-3 text-lg">Representante</h3>
                <div className="text-base space-y-1">
                  <div><b>Nombre:</b> <span className="text-green-50">{parte.representanteNombre}</span></div>
                  <div><b>Cargo:</b> <span className="text-green-50">{parte.cargoRepresentante}</span></div>
                  <div><b>DNI:</b> <span className="text-green-50">{parte.representanteDni}</span></div>
                </div>
              </div>
              <div className="rounded-xl p-6 bg-yellow-700/30 border border-yellow-600/30 backdrop-blur-md shadow-md text-yellow-50">
                <h3 className="font-semibold text-yellow-200 mb-3 text-lg">Fechas</h3>
                <div className="text-base space-y-1">
                  <div><b>Día de firma:</b> <span className="text-yellow-50">{datosBasicos.dia}</span></div>
                  <div><b>Mes de firma:</b> <span className="text-yellow-50">{datosBasicos.mes}</span></div>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center text-muted-foreground text-base">
              Si los datos son correctos, podés guardar, finalizar y enviar el convenio.
            </div>
          </div>
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
            {currentStep === 3 && (
              <Button
                type="submit"
                variant="default"
                disabled={Object.values(form.formState.errors).length > 0 || isSubmitting}
                className="px-4 transition-all"
              >
                Siguiente <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            )}
            {currentStep === 4 && (
              <>
                {convenioData?.status === 'enviado' ? (
                  <div className="w-full text-center mt-2">
                    <span className="text-xs text-muted-foreground">Este convenio ya fue enviado y no puede modificarse.</span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="default"
                    disabled={isSubmitting}
                    onClick={() => setShowConfirmModal(true)}
                    className="px-4 transition-all"
                  >
                    Guardar y Enviar convenio
                  </Button>
                )}
                {showConfirmModal && (
                  <Modal onClose={() => setShowConfirmModal(false)}>
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Confirmar envío</h2>
                      <p className="mb-6">¿Deseas enviar este convenio? Una vez enviado no podrás volver a modificarlo.</p>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                          Volver
                        </Button>
                        <Button
                          variant="default"
                          onClick={async () => {
                            setIsSubmitting(true);
                            try {
                              const parte = (convenioData?.partes?.[0] as Record<string, any>) || {};
                              const datosBasicos = (convenioData?.datosBasicos as Record<string, any>) || {};
                              const dbData = {
                                entidad_nombre: parte.nombre || '',
                                entidad_tipo: parte.tipo || 'empresa',
                                entidad_domicilio: parte.domicilio || '',
                                entidad_ciudad: parte.ciudad || '',
                                entidad_cuit: parte.cuit || '',
                                entidad_representante: parte.representanteNombre || '',
                                entidad_dni: parte.representanteDni || '',
                                entidad_cargo: parte.cargoRepresentante || '',
                                dia: datosBasicos.dia || '',
                                mes: datosBasicos.mes || ''
                              };
                              const requestData = {
                                title: `Convenio Marco - ${dbData.entidad_nombre}`,
                                convenio_type_id: 2,
                                content_data: dbData,
                                status: 'pendiente'
                              };
                              let response, responseData;
                              if (!convenioData?.id) {
                                response = await fetch('/api/convenios', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(requestData),
                                });
                              } else {
                                response = await fetch(`/api/convenios/${convenioData.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(requestData),
                                });
                              }
                              responseData = await response.json();
                              if (!response.ok) {
                                throw new Error(responseData.error || 'Error al enviar el convenio');
                              }
                              updateConvenioData('all', responseData);
                              setShowConfirmModal(false);
                              router.push('/protected');
                            } catch (error) {
                              alert(error instanceof Error ? error.message : 'Error inesperado al enviar el convenio');
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                        >
                          Sí, enviar
                        </Button>
                      </div>
                    </div>
                  </Modal>
                )}
              </>
            )}
            {currentStep < 3 && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-4 transition-all"
              >
                Siguiente <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
} 