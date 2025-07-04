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
import { ChevronLeftIcon, ChevronRightIcon, BuildingIcon, UserIcon, CalendarIcon, CheckIcon } from "lucide-react";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { ConvenioData, ParteData, DatosBasicosData } from '@/types/convenio';
import { Modal } from '@/app/components/ui/modal';

const STEPS = [
  {
    title: "Datos de la Entidad",
    component: null
  },
  {
    title: "Datos del Representante",
    component: null
  },
  {
    title: "Fechas del Convenio",
    component: null
  },
  {
    title: "Revisión",
    component: null
  }
];

// Esquemas de validación para cada paso
const entidadSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  tipo: z.string().min(2, "El tipo es requerido"),
  domicilio: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  ciudad: z.string().min(2, "La ciudad es requerida"),
  cuit: z.string().min(11, "El CUIT es obligatorio y debe tener al menos 11 dígitos"),
  rubro: z.string().min(2, "El rubro/actividad es requerido"),
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

interface ConvenioPracticaMarcoFormProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  formState: Record<string, any>;
  onFormStateChange: (state: Record<string, any>) => void;
  onError: (error: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

export function ConvenioPracticaMarcoForm({
  currentStep,
  onStepChange,
  formState,
  onFormStateChange,
  onError,
  isSubmitting,
  setIsSubmitting
}: ConvenioPracticaMarcoFormProps) {
  const router = useRouter();
  const { updateConvenioData, convenioData } = useConvenioMarcoStore();
  const [validationSchema, setValidationSchema] = useState<z.ZodTypeAny>(entidadSchema);
  const [localStatus, setLocalStatus] = useState(convenioData?.status || 'enviado');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

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
    setLocalStatus(convenioData?.status || 'enviado');
  }, [convenioData?.status]);

  // Inicializar el formulario con valores del store global
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
          cuit: parte.cuit || '',
          rubro: parte.rubro || ''
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

  // Sincronizar el formulario cuando cambia el paso
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
            cuit: data.cuit,
            rubro: data.rubro
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
          <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-purple-500/20 text-purple-600">
                  <BuildingIcon className="h-5 w-5" />
                </div>
                Datos de la Entidad
              </h2>
              <p className="text-sm text-muted-foreground">
                Información de la entidad que firmará el convenio de práctica supervisada.
              </p>
            </div>

            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Entidad *</Label>
                  <Input
                    id="nombre"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Nombre completo de la entidad"
                    {...form.register("nombre")}
                  />
                  {form.formState.errors.nombre?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.nombre.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Entidad *</Label>
                  <Input
                    id="tipo"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Ej: Empresa, ONG, etc."
                    {...form.register("tipo")}
                  />
                  {form.formState.errors.tipo?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.tipo.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domicilio">Dirección *</Label>
                  <Input
                    id="domicilio"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Dirección completa"
                    {...form.register("domicilio")}
                  />
                  {form.formState.errors.domicilio?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.domicilio.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad *</Label>
                  <Input
                    id="ciudad"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Ciudad"
                    {...form.register("ciudad")}
                  />
                  {form.formState.errors.ciudad?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.ciudad.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuit">CUIT (sin guiones) *</Label>
                  <Input
                    id="cuit"
                    placeholder="xx-xxxxxxxx-x (sin puntos ni guiones)"
                    {...form.register("cuit", {
                      pattern: { value: /^\d+$/, message: "Solo números" }
                    })}
                  />
                  {form.formState.errors.cuit?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.cuit.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rubro">Rubro/Actividad *</Label>
                  <Input
                    id="rubro"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Ej: Software, Construcción"
                    {...form.register("rubro")}
                  />
                  {form.formState.errors.rubro?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.rubro.message)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-purple-500/20 text-purple-600">
                  <UserIcon className="h-5 w-5" />
                </div>
                Datos del Representante
              </h2>
              <p className="text-sm text-muted-foreground">
                Información del representante legal de la entidad.
              </p>
            </div>

            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="representanteNombre">Nombre Completo *</Label>
                  <Input
                    id="representanteNombre"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Nombre completo del representante"
                    {...form.register("representanteNombre")}
                  />
                  {form.formState.errors.representanteNombre?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.representanteNombre.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargoRepresentante">Cargo *</Label>
                  <Input
                    id="cargoRepresentante"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Ej: Director, Gerente"
                    {...form.register("cargoRepresentante")}
                  />
                  {form.formState.errors.cargoRepresentante?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.cargoRepresentante.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="representanteDni">DNI *</Label>
                  <Input
                    id="representanteDni"
                    placeholder="sin puntos"
                    {...form.register("representanteDni", {
                      pattern: { value: /^\d+$/, message: "Solo números" }
                    })}
                  />
                  {form.formState.errors.representanteDni?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.representanteDni.message)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-purple-500/20 text-purple-600">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                Fechas del Convenio
              </h2>
              <p className="text-sm text-muted-foreground">
                Información para la fecha de firma del convenio.
              </p>
            </div>

            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dia">Día de Firma *</Label>
                  <select
                    id="dia"
                    className="border border-border focus-visible:ring-2 focus-visible:ring-primary rounded-md w-full h-10 px-3 bg-card"
                    {...form.register("dia", { required: true })}
                    onChange={e => {
                      form.setValue("dia", e.target.value);
                    }}
                    value={form.watch("dia") || ""}
                  >
                    <option value="">Seleccionar día</option>
                    {(() => {
                      const mesIdx = meses.indexOf(form.watch("mes"));
                      const dias = mesIdx >= 0 ? diasPorMes[mesIdx] : 31;
                      return Array.from({ length: dias }, (_, i) => i + 1).map(dia => (
                        <option key={dia} value={dia}>{dia}</option>
                      ));
                    })()}
                  </select>
                  {form.formState.errors.dia?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.dia.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mes">Mes de Firma *</Label>
                  <select
                    id="mes"
                    className="border border-border focus-visible:ring-2 focus-visible:ring-primary rounded-md w-full h-10 px-3 bg-card"
                    {...form.register("mes", { required: true })}
                    onChange={e => {
                      form.setValue("mes", e.target.value);
                      form.setValue("dia", "");
                    }}
                    value={form.watch("mes") || ""}
                  >
                    <option value="">Seleccionar mes</option>
                    {meses.map((mes, idx) => (
                      <option key={mes} value={mes}>{mes}</option>
                    ))}
                  </select>
                  {form.formState.errors.mes?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.mes.message)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        // Paso de revisión visual con bloques glass/blur, verticales, colores legibles
        const parte = (convenioData?.partes?.[0] as Record<string, any>) || {};
        const datosBasicos = (convenioData?.datosBasicos as Record<string, any>) || {};
        return (
          <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-purple-500/20 text-purple-600">
                  <CheckIcon className="h-5 w-5" />
                </div>
                Revisión Final
              </h2>
              <p className="text-sm text-muted-foreground">
                Revisá todos los datos antes de enviar el convenio de práctica supervisada.
              </p>
            </div>

            <div className="space-y-6 p-4 rounded-lg bg-background/80 border border-border backdrop-blur-md max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col gap-6">
                <div className="rounded-xl p-6 bg-purple-900/40 border border-purple-700/30 backdrop-blur-md shadow-md text-purple-100">
                  <h3 className="font-semibold text-purple-200 mb-3 text-lg">Entidad</h3>
                  <div className="text-base space-y-1">
                    <div><b>Nombre:</b> <span className="text-purple-50">{parte.nombre}</span></div>
                    <div><b>Tipo:</b> <span className="text-purple-50">{parte.tipo}</span></div>
                    <div><b>Dirección:</b> <span className="text-purple-50">{parte.domicilio}</span></div>
                    <div><b>Ciudad:</b> <span className="text-purple-50">{parte.ciudad}</span></div>
                    <div><b>CUIT:</b> <span className="text-purple-50">{parte.cuit}</span></div>
                    <div><b>Rubro:</b> <span className="text-purple-50">{parte.rubro}</span></div>
                  </div>
                </div>
                <div className="rounded-xl p-6 bg-emerald-900/40 border border-emerald-700/30 backdrop-blur-md shadow-md text-emerald-100">
                  <h3 className="font-semibold text-emerald-200 mb-3 text-lg">Representante</h3>
                  <div className="text-base space-y-1">
                    <div><b>Nombre:</b> <span className="text-emerald-50">{parte.representanteNombre}</span></div>
                    <div><b>Cargo:</b> <span className="text-emerald-50">{parte.cargoRepresentante}</span></div>
                    <div><b>DNI:</b> <span className="text-emerald-50">{parte.representanteDni}</span></div>
                  </div>
                </div>
                <div className="rounded-xl p-6 bg-amber-700/30 border border-amber-600/30 backdrop-blur-md shadow-md text-amber-50">
                  <h3 className="font-semibold text-amber-200 mb-3 text-lg">Fechas</h3>
                  <div className="text-base space-y-1">
                    <div><b>Día de firma:</b> <span className="text-amber-50">{datosBasicos.dia}</span></div>
                    <div><b>Mes de firma:</b> <span className="text-amber-50">{datosBasicos.mes}</span></div>
                  </div>
                </div>
              </div>
              <div className="mt-8 text-center text-muted-foreground text-base">
                Si los datos son correctos, podés guardar, finalizar y enviar el convenio de práctica supervisada.
              </div>
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
                      <p className="mb-6">¿Deseas enviar este convenio de práctica supervisada? Una vez enviado no podrás volver a modificarlo.</p>
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
                                entidad_rubro: parte.rubro || '',
                                entidad_representante: parte.representanteNombre || '',
                                entidad_dni: parte.representanteDni || '',
                                entidad_cargo: parte.cargoRepresentante || '',
                                dia: datosBasicos.dia || '',
                                mes: datosBasicos.mes || ''
                              };
                              const requestData = {
                                title: dbData.entidad_nombre,
                                convenio_type_id: 5, // ID específico para práctica supervisada
                                content_data: dbData,
                                status: 'enviado'
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

export default ConvenioPracticaMarcoForm;
