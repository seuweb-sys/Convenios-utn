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
import { BuildingIcon, CalendarIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, FileTextIcon, UploadIcon, XIcon, PaperclipIcon } from "lucide-react";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { Modal } from '@/app/components/ui/modal';
import { SuccessModal } from '@/app/components/ui/success-modal';
import { MultiInstitutionManager } from './MultiInstitutionManager';

// 4 pasos incluyendo anexos
const STEPS = [
  { title: "Instituciones", component: null },
  { title: "Fechas del Convenio", component: null },
  { title: "Anexos", component: null },
  { title: "Revisión", component: null }
];

// Esquema para fechas
const fechasSchema = z.object({
  dia: z.string().min(1, "El día es requerido"),
  mes: z.string().min(1, "El mes es requerido"),
});

interface Institucion {
  nombre: string;
  tipo: string;
  domicilio: string;
  ciudad: string;
  cuit: string;
  representanteNombre: string;
  representanteDni: string;
  cargoRepresentante: string;
}

interface ConvenioMarcoFormProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  formState: Record<string, any>;
  onFormStateChange: (state: Record<string, any>) => void;
  onError: (error: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  convenioIdFromUrl?: string | null;
  mode?: string | null;
  onFinalSubmit: () => Promise<void>;
}

export function ConvenioMarcoForm({
  currentStep,
  onStepChange,
  formState,
  onFormStateChange,
  onError,
  isSubmitting,
  setIsSubmitting,
  convenioIdFromUrl,
  mode,
  onFinalSubmit,
}: ConvenioMarcoFormProps) {
  const router = useRouter();
  const { updateConvenioData, convenioData } = useConvenioMarcoStore();
  const [localStatus, setLocalStatus] = useState(convenioData?.status || 'enviado');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Estado para instituciones
  const [instituciones, setInstituciones] = useState<Institucion[]>(() => {
    const partes = convenioData?.partes || [];
    return (Array.isArray(partes) && partes.length > 0 ? partes : []) as Institucion[];
  });

  // Estado para anexos (DNI, resolución, inscripción ARCA, otros)
  const [anexoFiles, setAnexoFiles] = useState<Array<{id: string, name: string, file: File, buffer: ArrayBuffer, mimeType?: string}>>([]);

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Sincronizar instituciones con el store
  useEffect(() => {
    const partes = convenioData?.partes || [];
    if (Array.isArray(partes) && partes.length > 0) {
      setInstituciones(partes as Institucion[]);
    }
  }, [convenioData?.partes]);

  useEffect(() => {
    setLocalStatus(convenioData?.status || 'enviado');
  }, [convenioData?.status]);

  // Formulario para fechas (paso 2)
  const fechasForm = useForm<z.infer<typeof fechasSchema>>({
    resolver: zodResolver(fechasSchema),
    defaultValues: {
      dia: (convenioData?.datosBasicos as any)?.dia || '',
      mes: (convenioData?.datosBasicos as any)?.mes || '',
    },
    mode: "onChange"
  });

  // Actualizar form cuando cambia convenioData
  useEffect(() => {
    fechasForm.reset({
      dia: (convenioData?.datosBasicos as any)?.dia || '',
      mes: (convenioData?.datosBasicos as any)?.mes || '',
    });
  }, [convenioData?.datosBasicos]);

  const handleInstitucionesChange = (newInstituciones: Institucion[]) => {
    setInstituciones(newInstituciones);
    updateConvenioData('partes', newInstituciones);
  };

  // Funciones para manejar anexos
  const handleAnexosUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/pdf' // .pdf
    ];

    for (let file of Array.from(files)) {
      if (validTypes.includes(file.type)) {
        try {
          const buffer = await file.arrayBuffer();
          const anexo = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            file: file,
            buffer: buffer,
            mimeType: file.type
          };
          setAnexoFiles(prev => [...prev, anexo]);
        } catch (error) {
          console.error('Error procesando archivo:', file.name, error);
          alert(`Error procesando ${file.name}: ${error}`);
        }
      } else {
        alert(`${file.name} no es un archivo válido. Solo se aceptan .docx y .pdf`);
      }
    }
    event.target.value = '';
  };

  const removeAnexoFile = (anexoId: string) => {
    setAnexoFiles(prev => prev.filter(a => a.id !== anexoId));
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validar que haya al menos una institución
      if (instituciones.length === 0) {
        onError("Debe agregar al menos una institución");
        return;
      }
      updateConvenioData('partes', instituciones);
      onStepChange(2);
    } else if (currentStep === 2) {
      // Validar fechas
      const valid = await fechasForm.trigger();
      if (!valid) return;

      const data = fechasForm.getValues();
      updateConvenioData('datosBasicos', {
        ...convenioData?.datosBasicos,
        dia: data.dia,
        mes: data.mes
      });
      onStepChange(3);
    } else if (currentStep === 3) {
      // Pasar anexos al store (opcional, se procesan al enviar)
      updateConvenioData('all', {
        ...convenioData,
        anexosMarco: anexoFiles
      });
      onStepChange(4);
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
                Instituciones del Convenio
              </h2>
              <p className="text-sm text-muted-foreground">
                Agrega las instituciones que formarán parte del convenio marco. Puedes agregar múltiples instituciones.
              </p>
            </div>

            <MultiInstitutionManager
              instituciones={instituciones}
              onInstitucionesChange={handleInstitucionesChange}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-green-500/20 text-green-600">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                Fechas del Convenio
              </h2>
              <p className="text-sm text-muted-foreground">
                Fecha de firma del convenio
              </p>
            </div>

            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dia">Día de Firma *</Label>
                  <select
                    id="dia"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...fechasForm.register("dia")}
                  >
                    <option value="">Seleccionar día</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={String(d)}>{d}</option>
                    ))}
                  </select>
                  {fechasForm.formState.errors.dia && (
                    <p className="text-sm text-red-500">{String(fechasForm.formState.errors.dia.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mes">Mes de Firma *</Label>
                  <select
                    id="mes"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...fechasForm.register("mes")}
                  >
                    <option value="">Seleccionar mes</option>
                    {meses.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  {fechasForm.formState.errors.mes && (
                    <p className="text-sm text-red-500">{String(fechasForm.formState.errors.mes.message)}</p>
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
                  <PaperclipIcon className="h-5 w-5" />
                </div>
                Anexos del Convenio
              </h2>
              <p className="text-sm text-muted-foreground">
                Adjunta documentos complementarios (DNI representante, resolución, inscripción ARCA, otros). Formatos: .docx y .pdf
              </p>
            </div>

            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              {/* Botón para subir archivos */}
              <div className="space-y-3">
                <Label>Documentos anexos (opcional)</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="marco-anexos-upload"
                    accept=".docx,.pdf"
                    multiple
                    onChange={handleAnexosUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('marco-anexos-upload')?.click()}
                    className="flex-1"
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Seleccionar archivos (.docx / .pdf)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Puedes adjuntar: DNI del representante, resolución de designación, inscripción en ARCA, u otros documentos relevantes.
                </p>
              </div>

              {/* Lista de archivos anexos */}
              {anexoFiles.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-sm font-medium">Anexos agregados ({anexoFiles.length}):</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {anexoFiles.map((anexo) => {
                      const isPdf = anexo.mimeType === 'application/pdf' || anexo.name.toLowerCase().endsWith('.pdf');
                      return (
                        <div key={anexo.id} className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                          <div className="flex items-center gap-3">
                            <FileTextIcon className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{anexo.name}</p>
                              <p className="text-xs text-blue-600 dark:text-blue-300">
                                {(anexo.file.size / 1024 / 1024).toFixed(2)} MB • {isPdf ? 'PDF' : 'Word (.docx)'}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAnexoFile(anexo.id)}
                            className="text-xs px-2 py-1 h-7 text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {anexoFiles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <PaperclipIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay anexos adjuntos</p>
                  <p className="text-xs">Los anexos son opcionales</p>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        const datosBasicos = (convenioData?.datosBasicos as any) || {};
        const partes = (convenioData?.partes || []) as Institucion[];

        return (
          <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-purple-500/20 text-purple-600">
                  <CheckIcon className="h-5 w-5" />
                </div>
                Revisión del Convenio
              </h2>
              <p className="text-sm text-muted-foreground">
                Revisa la información antes de enviar
              </p>
            </div>

            <div className="space-y-4">
              {/* Instituciones */}
              <div className="border border-border rounded-lg p-4 bg-card">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <BuildingIcon className="h-4 w-4 text-blue-500" />
                  Instituciones ({partes.length})
                </h3>
                <div className="space-y-3">
                  {partes.map((inst, i) => (
                    <div key={i} className="p-3 bg-muted/30 rounded-md text-sm">
                      <div className="font-medium">{inst.nombre} ({inst.tipo})</div>
                      <div className="text-muted-foreground">CUIT: {inst.cuit} | {inst.ciudad}</div>
                      <div className="text-muted-foreground">Representante: {inst.representanteNombre} - {inst.cargoRepresentante}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fechas */}
              <div className="border border-border rounded-lg p-4 bg-card">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-green-500" />
                  Fecha de Firma
                </h3>
                <div className="text-sm">
                  {datosBasicos.dia} de {datosBasicos.mes}
                </div>
              </div>

              {/* Anexos */}
              {anexoFiles.length > 0 && (
                <div className="border border-border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <PaperclipIcon className="h-4 w-4 text-orange-500" />
                    Anexos ({anexoFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {anexoFiles.map((anexo, i) => {
                      const isPdf = anexo.mimeType === 'application/pdf' || anexo.name.toLowerCase().endsWith('.pdf');
                      return (
                        <div key={anexo.id} className="text-sm p-2 bg-muted/30 rounded-md flex items-center gap-2">
                          <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{anexo.name}</span>
                          <span className="text-xs text-muted-foreground">({isPdf ? 'PDF' : 'DOCX'})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
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

        {currentStep < 4 && (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || (currentStep === 1 && instituciones.length === 0)}
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
                      disabled={isSubmitting}
                      onClick={() => {
                        // Sincronizar explícitamente instituciones y anexos antes de enviar
                        console.log('Forzando sincronización de partes antes de enviar:', instituciones);
                        console.log('Forzando sincronización de anexos antes de enviar:', anexoFiles.length);
                        updateConvenioData('partes', instituciones);
                        updateConvenioData('all', {
                          ...convenioData,
                          partes: instituciones,
                          anexosMarco: anexoFiles
                        });
                        onFinalSubmit();
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
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="¡Convenio Enviado!"
        message="Tu convenio marco ha sido enviado exitosamente y está en espera de revisión."
        redirectText="Volver al Inicio"
        autoRedirectSeconds={5}
        onRedirect={() => {
          setShowSuccessModal(false);
          router.push('/protected');
        }}
      />
    </div>
  );
}