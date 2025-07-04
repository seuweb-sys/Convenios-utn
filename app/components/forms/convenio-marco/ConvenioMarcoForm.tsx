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
import { BuildingIcon, UserIcon, CalendarIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
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
          <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-blue-500/20 text-blue-600">
                  <BuildingIcon className="h-5 w-5" />
                </div>
                Datos de la Entidad
              </h2>
              <p className="text-sm text-muted-foreground">
                Información de la entidad que firmará el convenio marco.
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
                  {form.formState.errors.nombre && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.nombre.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Entidad *</Label>
                  <Input
                    id="tipo"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Ej: EMPRESA, FUNDACION, ONG"
                    {...form.register("tipo", {
                      onChange: (e) => {
                        // Forzar mayúsculas y solo letras, eliminar artículo LA
                        let upper = e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ ]/g, "");
                        upper = upper.replace(/^LA\s+/, "");
                        e.target.value = upper;
                        form.setValue("tipo", upper);
                      },
                      validate: (v) => /^[A-ZÁÉÍÓÚÜÑ ]+$/.test(v) || "Solo letras mayúsculas"
                    })}
                  />
                  {form.formState.errors.tipo && (
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
                  {form.formState.errors.domicilio && (
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
                  {form.formState.errors.ciudad && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.ciudad.message)}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cuit">CUIT (sin guiones) *</Label>
                  <Input
                    id="cuit"
                    placeholder="xx-xxxxxxxx-x (sin puntos ni guiones)"
                    {...form.register("cuit", {
                      pattern: { value: /^\d+$/, message: "Solo números" }
                    })}
                  />
                  {form.formState.errors.cuit && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.cuit.message)}</p>
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
                <div className="p-1.5 rounded-full bg-blue-500/20 text-blue-600">
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
                  {form.formState.errors.representanteNombre && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.representanteNombre.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargoRepresentante">Cargo *</Label>
                  <Input
                    id="cargoRepresentante"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Ej: Gerente, Director"
                    {...form.register("cargoRepresentante")}
                  />
                  {form.formState.errors.cargoRepresentante && (
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
                  {form.formState.errors.representanteDni && (
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
                <div className="p-1.5 rounded-full bg-blue-500/20 text-blue-600">
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
                  {form.formState.errors.dia && (
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
                  {form.formState.errors.mes && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.mes.message)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        // Paso de revisión con efectos glassmorphism mejorados
        const parte = (convenioData?.partes?.[0] as Record<string, any>) || {};
        const datosBasicos = (convenioData?.datosBasicos as Record<string, any>) || {};
        return (
          <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-blue-500/20 text-blue-600">
                  <CheckIcon className="h-5 w-5" />
                </div>
                Revisión y Finalización
              </h2>
              <p className="text-sm text-muted-foreground">
                Revisa toda la información antes de crear el convenio.
              </p>
            </div>

            <div className="space-y-6">
              {/* Datos de la Entidad */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/10 to-blue-600/10 rounded-xl blur-xl"></div>
                <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center gap-2">
                    <BuildingIcon className="h-5 w-5" />
                    Datos de la Entidad
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Entidad:</span> {parte.nombre}</div>
                    <div><span className="font-medium">Tipo:</span> {parte.tipo}</div>
                    <div><span className="font-medium">Dirección:</span> {parte.domicilio}</div>
                    <div><span className="font-medium">Ciudad:</span> {parte.ciudad}</div>
                    <div><span className="font-medium">CUIT:</span> {parte.cuit}</div>
                  </div>
                </div>
              </div>

              {/* Datos del Representante */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-blue-500/10 to-blue-600/10 rounded-xl blur-xl"></div>
                <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-teal-600 mb-4 flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Datos del Representante
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Representante:</span> {parte.representanteNombre}</div>
                    <div><span className="font-medium">Cargo:</span> {parte.cargoRepresentante}</div>
                    <div><span className="font-medium">DNI:</span> {parte.representanteDni}</div>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-blue-600/10 rounded-xl blur-xl"></div>
                <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Fechas del Convenio
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><span className="font-medium">Día de Firma:</span> {datosBasicos.dia}</div>
                      <div><span className="font-medium">Mes de Firma:</span> {datosBasicos.mes}</div>
                    </div>
                  </div>
                </div>
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
                                title: dbData.entidad_nombre,
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