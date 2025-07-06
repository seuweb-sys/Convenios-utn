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
import { BuildingIcon, UserIcon, FileTextIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, MaximizeIcon, XIcon, UploadIcon } from "lucide-react";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { ConvenioData, ParteData, DatosBasicosData } from '@/types/convenio';
import { Modal } from '@/app/components/ui/modal';
import dynamic from 'next/dynamic';

// Importar React Quill dinámicamente para evitar problemas de SSR
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-32 border border-border rounded-md bg-background animate-pulse" />
});
import 'react-quill/dist/quill.snow.css';

// Estilos personalizados para el editor Quill - FONDO BLANCO por defecto
const quillStyles = `
  .ql-editor {
    min-height: 250px;
    font-family: inherit;
    color: #000000 !important;
    background-color: #ffffff !important;
  }
  
  .ql-editor img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 8px 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  

  
  .ql-toolbar {
    border-color: #d1d5db !important;
    background: #f9fafb !important;
    border-bottom: 1px solid #d1d5db !important;
    display: block !important;
    visibility: visible !important;
  }
  
  .ql-container {
    border-color: #d1d5db;
    background: #ffffff;
  }
  
  .ql-editor.ql-blank::before {
    color: #9ca3af;
    font-style: italic;
  }
  
  .ql-snow .ql-picker {
    color: #374151;
  }
  
  .ql-snow .ql-stroke {
    stroke: #374151;
  }
  
  .ql-snow .ql-fill {
    fill: #374151;
  }
  
  .ql-snow .ql-picker-options {
    background: #ffffff;
    border: 1px solid #d1d5db;
  }
  
  .ql-snow .ql-picker-item:hover {
    background: #f3f4f6;
  }
  
  /* Estilos para modal fullscreen */
  .ql-fullscreen-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .ql-fullscreen-container {
    width: 100%;
    max-width: 1200px;
    height: 90vh;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  
  .ql-fullscreen-header {
    padding: 16px 20px;
    background: #f9fafb;
    border-bottom: 1px solid #d1d5db;
    display: flex;
    justify-content: between;
    align-items: center;
  }
  
  .ql-fullscreen-editor .ql-editor {
    min-height: calc(90vh - 140px);
    font-size: 14px;
    line-height: 1.6;
  }
`;

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

// Esquemas de validación para cada paso - ACTUALIZADOS
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

// ESQUEMA ACTUALIZADO - Con soporte para editor de texto Y archivo adjunto
const detallesSchema = z.object({
  convenioMarcoFecha: z.string().min(1, "La fecha del convenio marco es requerida"),
  convenioEspecificoTipo: z.string().min(2, "El tipo de convenio específico es requerido"),
  unidadEjecutoraFacultad: z.string().min(2, "La unidad ejecutora de la facultad es requerida"),
  unidadEjecutoraEntidad: z.string().min(2, "La unidad ejecutora de la entidad es requerida"),
  dia: z.string().min(1, "El día es requerido"),
  mes: z.string().min(1, "El mes es requerido"),
  anexo: z.string().optional(), // EDITOR DE TEXTO OPCIONAL
});

// Configuración LIMPIA del editor - Sin soporte de tablas, máxima compatibilidad para texto
const quillModules = {
  toolbar: [
    [{ 'header': ['1', '2', '3', '4', '5', '6', false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean']
  ],
  clipboard: {
    matchVisual: true,
  }
};

const quillFormats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike', 
  'script', 'color', 'background',
  'list', 'bullet', 'check', 'indent',
  'align', 'blockquote', 'code-block',
  'link', 'image', 'width', 'height'
];

// 1. Agregar helpers para días y meses
const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

interface ConvenioEspecificoFormProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  formState: Record<string, any>;
  onFormStateChange: (state: Record<string, any>) => void;
  onError: (error: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  convenioIdFromUrl?: string | null;
  mode?: string | null;
}

export function ConvenioEspecificoForm({
  currentStep,
  onStepChange,
  formState,
  onFormStateChange,
  onError,
  isSubmitting,
  setIsSubmitting,
  convenioIdFromUrl,
  mode
}: ConvenioEspecificoFormProps) {
  const router = useRouter();
  const { updateConvenioData, convenioData } = useConvenioMarcoStore();
  const [validationSchema, setValidationSchema] = useState<z.ZodTypeAny>(entidadSchema);
  const [localStatus, setLocalStatus] = useState(convenioData?.status || 'enviado');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenContent, setFullscreenContent] = useState("");
  const [attachedWordFile, setAttachedWordFile] = useState<{name: string, file: File} | null>(null);

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

  // ACTUALIZAR getDefaultValues para el nuevo esquema
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
          anexo: datosBasicos?.anexo || '', // NUEVO CAMPO
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

  // ACTUALIZAR onSubmit para el nuevo esquema
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
            anexo: data.anexo || '',
            anexoWordFile: attachedWordFile,
          });
          break;
      }
      
      if (currentStep < 4) {
        onStepChange(currentStep + 1);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error inesperado');
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
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
                Información básica de la empresa u organización con la que se realizará el convenio.
              </p>
            </div>

            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Entidad *</Label>
                  <Input
                    id="nombre"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Ej: Empresa ABC S.A."
                    {...form.register("nombre")}
                  />
                  {form.formState.errors.nombre?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.nombre.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domicilio">Domicilio *</Label>
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
                  <Label htmlFor="cuit">CUIT *</Label>
                  <Input
                    id="cuit"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Solo números"
                    {...form.register("cuit", {
                      pattern: { value: /^\d+$/, message: "Solo números" }
                    })}
                  />
                  {form.formState.errors.cuit?.message && (
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
                <div className="p-1.5 rounded-full bg-teal-500/20 text-teal-600">
                  <UserIcon className="h-5 w-5" />
                </div>
                Datos del Representante
              </h2>
              <p className="text-sm text-muted-foreground">
                Información del representante legal de la entidad.
              </p>
            </div>

            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="representanteNombre">Nombre del Representante *</Label>
                  <Input
                    id="representanteNombre"
                    className="border-border focus-visible:ring-primary"
                    placeholder="Nombre completo"
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
                <div className="p-1.5 rounded-full bg-orange-500/20 text-orange-600">
                  <FileTextIcon className="h-5 w-5" />
                </div>
                Detalles del Convenio
              </h2>
              <p className="text-sm text-muted-foreground">
                Información específica del convenio, fechas de firma y anexos.
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
                    {...form.register("convenioMarcoFecha", {
                      validate: (value) => {
                        const marco = new Date(value);
                        const mes = meses.indexOf(form.watch("mes"));
                        const dia = parseInt(form.watch("dia"), 10);
                        if (!value || mes < 0 || !form.watch("dia")) return true;
                        if (!isNaN(marco.getTime()) && mes >= 0 && !isNaN(dia)) {
                          const fechaFirma = new Date(marco.getFullYear(), mes, dia);
                          if (fechaFirma < marco) {
                            return "La fecha de firma no puede ser anterior al convenio marco";
                          }
                        }
                        return true;
                      }
                    })}
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
                <div className="space-y-2">
                  <Label htmlFor="dia">Día de Firma *</Label>
                  <select
                    id="dia"
                    className="border border-border focus-visible:ring-2 focus-visible:ring-primary rounded-md w-full h-10 px-3 bg-card"
                    {...form.register("dia", { required: true })}
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

                {/* NUEVO CAMPO ANEXO - REEMPLAZA LOS 4 CAMPOS ANTERIORES */}
                <div className="space-y-2 md:col-span-2">
                  <div className="space-y-4">
                    <Label htmlFor="anexo">
                      Anexo (Opcional)
                      <span className="text-xs text-muted-foreground ml-2">
                        - Incluye objetivos, actividades, propiedad intelectual y confidencialidad
                      </span>
                    </Label>
                    
                    {/* Opción 1: Editor de texto */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">📝 Opción 1: Editor de texto</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openFullscreen}
                        className="text-xs px-2 py-1 h-6"
                      >
                        <MaximizeIcon className="h-3 w-3 mr-1" />
                        Pantalla completa
                      </Button>
                    </div>
                  </div>
                  <div className="border border-border rounded-md overflow-hidden relative">
                    {attachedWordFile && (
                      <div className="absolute inset-0 bg-gray-200 bg-opacity-80 z-10 flex flex-col items-center justify-center">
                        <span className="text-gray-700 font-semibold text-sm">El editor está deshabilitado porque hay un archivo Word adjunto.</span>
                        <span className="text-xs text-gray-500">Elimina el archivo para volver a editar aquí.</span>
                      </div>
                    )}
                    <style dangerouslySetInnerHTML={{ __html: quillStyles }} />
                    <ReactQuill
                      value={form.watch("anexo") || ""}
                      onChange={(content) => {
                        if (!attachedWordFile) form.setValue("anexo", content);
                      }}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Pegue aquí el contenido del anexo con formato (sin tablas)"
                      style={{
                        height: '300px',
                        backgroundColor: '#ffffff',
                        pointerEvents: attachedWordFile ? 'none' : 'auto',
                        opacity: attachedWordFile ? 0.5 : 1
                      }}
                      readOnly={!!attachedWordFile}
                      theme="snow"
                    />
                  </div>
                  {/* Opción 2: Subir archivo Word */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">📄 Opción 2: Adjuntar documento Word</span>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          id="word-upload"
                          accept=".docx"
                          onChange={handleWordFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('word-upload')?.click()}
                          className="text-xs px-2 py-1 h-6"
                        >
                          <UploadIcon className="h-3 w-3 mr-1" />
                          Adjuntar Word
                        </Button>
                      </div>
                    </div>
                    
                    {/* Mostrar archivo adjunto si existe */}
                    {attachedWordFile && (
                      <div className="p-3 bg-gray-800 border border-gray-700 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileTextIcon className="h-4 w-4 text-gray-200" />
                            <span className="text-sm font-medium text-gray-100">{attachedWordFile.name}</span>
                            <span className="text-xs text-gray-300">✅ Adjuntado (incluye tablas)</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeAttachedFile}
                            className="text-xs px-2 py-1 h-6 text-red-400 border-red-700 hover:bg-red-900/20"
                          >
                            <XIcon className="h-3 w-3 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground border-t pt-3">
                    <strong>🎯 Instrucciones:</strong><br/>
                    📝 <strong>Editor de texto:</strong> Copy/paste desde Word. ⚠️ Sin soporte para tablas complejas<br/>
                    📄 <strong>Archivo adjunto:</strong> Mantiene formato original completo, incluyendo tablas e imágenes<br/>
                    💡 <strong>Recomendación:</strong> Use archivo adjunto para documentos con tablas
                  </p>
                  {form.formState.errors.anexo?.message && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.anexo.message)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        // ACTUALIZAR paso de revisión
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
                </div>
              </div>

              {/* NUEVO: Mostrar anexo si existe */}
              {datosBasicos.anexo && (
                <div className="rounded-xl p-6 bg-purple-500/10 border border-purple-500/20 backdrop-blur-xl shadow-md">
                  <h3 className="font-semibold text-purple-600 mb-3 text-lg flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5" />
                    Anexo
                  </h3>
                  <div 
                    className="prose prose-sm max-w-none text-base 
                      [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-2 [&_img]:shadow-sm
                      [&_table]:border-collapse-collapse [&_table]:w-full [&_table]:border [&_table]:border-gray-300 [&_table]:my-4
                      [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_td]:align-top
                      [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-100 [&_th]:font-bold"
                    style={{ 
                      color: 'var(--foreground)',
                      lineHeight: '1.6'
                    }}
                    dangerouslySetInnerHTML={{ __html: datosBasicos.anexo }}
                  />
                </div>
              )}
              {/* NUEVO: Mostrar archivo Word adjunto si existe */}
              {datosBasicos.anexoWordFile && (
                <div className="rounded-xl p-6 bg-gray-900 border border-gray-700 backdrop-blur-xl shadow-md mt-4">
                  <h3 className="font-semibold text-gray-200 mb-3 text-lg flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5" />
                    Archivo Word adjunto
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-100 font-medium">{datosBasicos.anexoWordFile.name}</span>
                    <span className="text-xs text-gray-400">✅ Adjuntado (incluye tablas e imágenes)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  // Funciones para manejar pantalla completa
  const openFullscreen = () => {
    setFullscreenContent(form.watch("anexo") || "");
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    form.setValue("anexo", fullscreenContent);
    setIsFullscreen(false);
  };

  // Adjuntar archivo Word (solo guarda el File)
  const handleWordFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.docx')) {
      alert('Por favor selecciona un archivo Word (.docx)');
      return;
    }
    setAttachedWordFile({ name: file.name, file });
    alert(`✅ Archivo "${file.name}" adjuntado exitosamente!\n\n📄 El documento se incluirá completo (con tablas) al generar el convenio.\n🔗 No aparece en el editor - es un anexo independiente.`);
    event.target.value = '';
  };

  // Remover archivo adjunto
  const removeAttachedFile = () => {
    setAttachedWordFile(null);
    alert('📄 Archivo adjunto removido');
  };

  // Modal de pantalla completa para el editor
  const FullscreenEditor = () => {
    if (!isFullscreen) return null;
    
    return (
      <div className="ql-fullscreen-modal" onClick={closeFullscreen}>
        <div className="ql-fullscreen-container" onClick={(e) => e.stopPropagation()}>
          <div className="ql-fullscreen-header">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Editor de Anexo - Pantalla Completa</h3>
              <p className="text-sm text-gray-600">Copia y pega contenido desde Word/Google Docs con formato completo</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeFullscreen}
              className="ml-4"
            >
              <XIcon className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
          </div>
          <div className="ql-fullscreen-editor">
            <style dangerouslySetInnerHTML={{ __html: quillStyles }} />
            <ReactQuill
              value={fullscreenContent}
              onChange={setFullscreenContent}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Pegue aquí el contenido del anexo con formato completo desde Word, Google Docs, etc. Incluye objetivos, actividades, propiedad intelectual, confidencialidad e imágenes."
              style={{
                height: 'calc(90vh - 140px)',
                backgroundColor: '#ffffff',
              }}
              theme="snow"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
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
                              // ACTUALIZAR estructura de datos para backend
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
                                anexo: datosBasicos.anexo || '' // NUEVO CAMPO UNIFICADO
                              };
                              const requestData = {
                                title: dbData.entidad_nombre,
                                convenio_type_id: 4, // ID del convenio específico según base de datos
                                content_data: dbData,
                                status: 'pendiente'
                              };
                              let response, responseData;
                              // Si tenemos ID desde la URL (modo corrección) o desde convenioData, usar PATCH
                              if (convenioIdFromUrl || convenioData?.id) {
                                const targetId = convenioIdFromUrl || convenioData.id;
                                response = await fetch(`/api/convenios/${targetId}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(requestData),
                                });
                              } else {
                                // Solo crear nuevo convenio si NO hay ID disponible
                                response = await fetch('/api/convenios', {
                                  method: 'POST',
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
      
      <FullscreenEditor />


    </div>
  );
}

export default ConvenioEspecificoForm; 