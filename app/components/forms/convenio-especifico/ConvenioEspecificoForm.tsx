"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { BuildingIcon, UserIcon, FileTextIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
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
    title: "Detalles del Convenio",
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
  domicilio: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  cuit: z.string().min(11, "El CUIT es obligatorio y debe tener al menos 11 dígitos"),
});

const representanteSchema = z.object({
  representanteNombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  cargoRepresentante: z.string().min(2, "El cargo debe tener al menos 2 caracteres"),
  representanteDni: z.string().min(7, "El DNI debe tener al menos 7 dígitos").max(8, "El DNI no puede tener más de 8 dígitos"),
});

const detallesSchema = z.object({
  convenioMarcoFecha: z.string().min(1, "La fecha del convenio marco es requerida"),
  convenioEspecificoTipo: z.string().min(2, "El tipo de convenio específico es requerido"),
  unidadEjecutoraFacultad: z.string().min(2, "La unidad ejecutora de la facultad es requerida"),
  unidadEjecutoraEntidad: z.string().min(2, "La unidad ejecutora de la entidad es requerida"),
  dia: z.string().min(1, "El día es requerido"),
  mes: z.string().min(1, "El mes es requerido"),
  objetivoGeneral: z.string().min(10, "Describe el objetivo general"),
  actividades: z.string().min(10, "Describe las actividades"),
  propiedadIntelectual: z.string().min(5, "Completa este campo"),
  confidencialidad: z.string().min(5, "Completa este campo"),
});

interface ConvenioEspecificoFormProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  formState: Record<string, any>;
  onFormStateChange: (state: Record<string, any>) => void;
  onError: (error: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

export function ConvenioEspecificoForm({
  currentStep,
  onStepChange,
  formState,
  onFormStateChange,
  onError,
  isSubmitting,
  setIsSubmitting
}: ConvenioEspecificoFormProps) {
  const router = useRouter();
  const { updateConvenioData, convenioData } = useConvenioMarcoStore();
  const [validationSchema, setValidationSchema] = useState<z.ZodTypeAny>(entidadSchema);
  const [localStatus, setLocalStatus] = useState(convenioData?.status || 'enviado');
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
        setValidationSchema(detallesSchema);
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
          domicilio: parte.domicilio || '',
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
          convenioMarcoFecha: datosBasicos?.convenioMarcoFecha || '',
          convenioEspecificoTipo: datosBasicos?.convenioEspecificoTipo || '',
          unidadEjecutoraFacultad: datosBasicos?.unidadEjecutoraFacultad || '',
          unidadEjecutoraEntidad: datosBasicos?.unidadEjecutoraEntidad || '',
          dia: datosBasicos?.dia || '',
          mes: datosBasicos?.mes || '',
          objetivoGeneral: datosBasicos?.objetivoGeneral || '',
          actividades: datosBasicos?.actividades || '',
          propiedadIntelectual: datosBasicos?.propiedadIntelectual || '',
          confidencialidad: datosBasicos?.confidencialidad || ''
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
            domicilio: data.domicilio,
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
            convenioMarcoFecha: data.convenioMarcoFecha || '',
            convenioEspecificoTipo: data.convenioEspecificoTipo || '',
            unidadEjecutoraFacultad: data.unidadEjecutoraFacultad || '',
            unidadEjecutoraEntidad: data.unidadEjecutoraEntidad || '',
            dia: data.dia || '',
            mes: data.mes || '',
            objetivoGeneral: data.objetivoGeneral || '',
            actividades: data.actividades || '',
            propiedadIntelectual: data.propiedadIntelectual || '',
            confidencialidad: data.confidencialidad || ''
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
                <div className="p-1.5 rounded-full bg-orange-500/20 text-orange-600">
                  <BuildingIcon className="h-5 w-5" />
                </div>
                Datos de la Entidad
              </h2>
              <p className="text-sm text-muted-foreground">
                Información de la entidad que firmará el convenio específico.
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
                  <Label htmlFor="domicilio">Domicilio *</Label>
                  <Input
                    id="domicilio"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Domicilio legal de la entidad"
                    {...form.register("domicilio")}
                  />
                  {form.formState.errors.domicilio && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.domicilio.message)}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cuit">CUIT (sin guiones) *</Label>
                  <Input
                    id="cuit"
                    className="border-border focus-visible:ring-primary"
                    placeholder="20445041743"
                    {...form.register("cuit")}
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
                <div className="p-1.5 rounded-full bg-orange-500/20 text-orange-600">
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
                    className="border-border focus-visible:ring-primary"
                    placeholder="Sin puntos ni guiones"
                    {...form.register("representanteDni")}
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
                <div className="p-1.5 rounded-full bg-orange-500/20 text-orange-600">
                  <FileTextIcon className="h-5 w-5" />
                </div>
                Detalles del Convenio
              </h2>
              <p className="text-sm text-muted-foreground">
                Información específica del convenio y fechas de firma.
              </p>
            </div>

            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="convenioMarcoFecha">Fecha del Convenio Marco *</Label>
                  <Input
                    id="convenioMarcoFecha"
                    type="date"
                    className="border-border focus-visible:ring-primary"
                    {...form.register("convenioMarcoFecha")}
                  />
                  {form.formState.errors.convenioMarcoFecha?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.convenioMarcoFecha.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="convenioEspecificoTipo">Tipo de Convenio Específico *</Label>
                  <Input
                    id="convenioEspecificoTipo"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Ej: Asistencia Técnica, Colaboración"
                    {...form.register("convenioEspecificoTipo")}
                  />
                  {form.formState.errors.convenioEspecificoTipo?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.convenioEspecificoTipo.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidadEjecutoraFacultad">Unidad Ejecutora Facultad *</Label>
                  <Input
                    id="unidadEjecutoraFacultad"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Ej: Departamento de Ingeniería en Sistemas"
                    {...form.register("unidadEjecutoraFacultad")}
                  />
                  {form.formState.errors.unidadEjecutoraFacultad?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.unidadEjecutoraFacultad.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidadEjecutoraEntidad">Unidad Ejecutora Entidad *</Label>
                  <Input
                    id="unidadEjecutoraEntidad"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Ej: Departamento de Desarrollo"
                    {...form.register("unidadEjecutoraEntidad")}
                  />
                  {form.formState.errors.unidadEjecutoraEntidad?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.unidadEjecutoraEntidad.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dia">Día de Firma *</Label>
                  <Input
                    id="dia"
                    type="number"
                    min={1}
                    max={31}
                    className="border-border focus-visible:ring-primary"
                    placeholder="Ej: 15"
                    {...form.register("dia")}
                  />
                  {form.formState.errors.dia?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.dia.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mes">Mes de Firma *</Label>
                  <Input
                    id="mes"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Ej: junio"
                    {...form.register("mes")}
                  />
                  {form.formState.errors.mes?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.mes.message)}</p>
                  )}
                </div>

                {/* Objetivo General */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="objetivoGeneral">Objetivo General *</Label>
                  <Textarea
                    id="objetivoGeneral"
                    rows={3}
                    className="border-border focus-visible:ring-primary"
                    placeholder="Describe el objetivo general del convenio"
                    {...form.register("objetivoGeneral")}
                  />
                  {form.formState.errors.objetivoGeneral?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.objetivoGeneral.message)}</p>
                  )}
                </div>

                {/* Actividades */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="actividades">Actividades a Desarrollar *</Label>
                  <Textarea
                    id="actividades"
                    rows={3}
                    className="border-border focus-visible:ring-primary"
                    placeholder="Detalle de actividades y compromisos"
                    {...form.register("actividades")}
                  />
                  {form.formState.errors.actividades?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.actividades.message)}</p>
                  )}
                </div>

                {/* Propiedad Intelectual */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="propiedadIntelectual">Propiedad Intelectual *</Label>
                  <Textarea
                    id="propiedadIntelectual"
                    rows={2}
                    className="border-border focus-visible:ring-primary"
                    placeholder="Términos sobre propiedad intelectual"
                    {...form.register("propiedadIntelectual")}
                  />
                  {form.formState.errors.propiedadIntelectual?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.propiedadIntelectual.message)}</p>
                  )}
                </div>

                {/* Confidencialidad */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="confidencialidad">Confidencialidad *</Label>
                  <Textarea
                    id="confidencialidad"
                    rows={2}
                    className="border-border focus-visible:ring-primary"
                    placeholder="Cláusula de confidencialidad"
                    {...form.register("confidencialidad")}
                  />
                  {form.formState.errors.confidencialidad?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.confidencialidad.message)}</p>
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
                Revisa toda la información antes de crear el convenio específico.
              </p>
            </div>

            <div className="space-y-6">
              {/* Datos de la Entidad */}
              <div className="rounded-xl p-6 bg-orange-500/10 border border-orange-500/20 backdrop-blur-xl shadow-md">
                <h3 className="font-semibold text-orange-600 mb-3 text-lg flex items-center gap-2">
                  <BuildingIcon className="h-5 w-5" />
                  Entidad
                </h3>
                <div className="text-base space-y-1">
                  <div><b>Nombre:</b> <span>{parte.nombre}</span></div>
                  <div><b>Domicilio:</b> <span>{parte.domicilio}</span></div>
                  <div><b>CUIT:</b> <span>{parte.cuit}</span></div>
                </div>
              </div>
              <div className="rounded-xl p-6 bg-teal-500/10 border border-teal-500/20 backdrop-blur-xl shadow-md">
                <h3 className="font-semibold text-teal-600 mb-3 text-lg flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Representante
                </h3>
                <div className="text-base space-y-1">
                  <div><b>Nombre:</b> <span>{parte.representanteNombre}</span></div>
                  <div><b>Cargo:</b> <span>{parte.cargoRepresentante}</span></div>
                  <div><b>DNI:</b> <span>{parte.representanteDni}</span></div>
                </div>
              </div>
              <div className="rounded-xl p-6 bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-xl shadow-md">
                <h3 className="font-semibold text-indigo-600 mb-3 text-lg flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Detalles del Convenio
                </h3>
                <div className="text-base space-y-1">
                  <div><b>Fecha convenio marco:</b> <span>{datosBasicos.convenioMarcoFecha}</span></div>
                  <div><b>Tipo específico:</b> <span>{datosBasicos.convenioEspecificoTipo}</span></div>
                  <div><b>Unidad ejecutora facultad:</b> <span>{datosBasicos.unidadEjecutoraFacultad}</span></div>
                  <div><b>Unidad ejecutora entidad:</b> <span>{datosBasicos.unidadEjecutoraEntidad}</span></div>
                  <div><b>Día de firma:</b> <span>{datosBasicos.dia}</span></div>
                  <div><b>Mes de firma:</b> <span>{datosBasicos.mes}</span></div>
                  <div><b>Objetivo general:</b> <span>{datosBasicos.objetivoGeneral}</span></div>
                  <div><b>Actividades:</b> <span>{datosBasicos.actividades}</span></div>
                  <div><b>Propiedad Intelectual:</b> <span>{datosBasicos.propiedadIntelectual}</span></div>
                  <div><b>Confidencialidad:</b> <span>{datosBasicos.confidencialidad}</span></div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
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
                      <p className="mb-6">¿Deseas enviar este convenio específico? Una vez enviado no podrás volver a modificarlo.</p>
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
                                entidad_domicilio: parte.domicilio || '',
                                entidad_cuit: parte.cuit || '',
                                entidad_representante: parte.representanteNombre || '',
                                entidad_dni: parte.representanteDni || '',
                                entidad_cargo: parte.cargoRepresentante || '',
                                convenio_marco_fecha: datosBasicos.convenioMarcoFecha || '',
                                convenio_especifico_tipo: datosBasicos.convenioEspecificoTipo || '',
                                unidad_ejecutora_facultad: datosBasicos.unidadEjecutoraFacultad || '',
                                unidad_ejecutora_entidad: datosBasicos.unidadEjecutoraEntidad || '',
                                dia: datosBasicos.dia || '',
                                mes: datosBasicos.mes || '',
                                objetivoGeneral: datosBasicos.objetivoGeneral || '',
                                actividades: datosBasicos.actividades || '',
                                propiedadIntelectual: datosBasicos.propiedadIntelectual || '',
                                confidencialidad: datosBasicos.confidencialidad || ''
                              };
                              const requestData = {
                                title: dbData.entidad_nombre,
                                convenio_type_id: 4, // ID del convenio específico según base de datos
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
                              // Forzar redirección más robusta
                              setTimeout(() => {
                                router.push('/protected');
                              }, 100);
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

export default ConvenioEspecificoForm; 