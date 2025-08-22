"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useSearchParams, useParams } from 'next/navigation';
import { 
  ChevronLeftIcon, 
  CheckIcon,
  AlertCircleIcon,
  EyeIcon,
  SaveIcon,
  XIcon
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { renderAsync } from "docx-preview";

import { 
  BackgroundPattern, 
  SectionContainer 
} from "@/app/components/dashboard";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { cn } from "@/lib/utils";
import { FullScreenPreview } from "@/app/components/convenios/full-screen-preview";
import { useConvenioStore, getFieldsFromStore } from "@/stores/convenioStore";
import { SuccessModal } from '@/app/components/ui/success-modal';

// Tipos
type Step = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "upcoming" | "current" | "complete";
};

type ConvenioConfig = {
  title: string;
  description: string;
  steps: Omit<Step, "status">[];
  FormComponent: React.ComponentType<any>;
};

type ConvenioFormLayoutProps = {
  config: ConvenioConfig;
};

// Componente de esqueleto
const FormSkeleton = () => (
  <div className="space-y-6 animate-pulse p-6">
    <div className="h-8 w-1/2 bg-muted rounded"></div>
    <div className="space-y-4">
      <div className="h-12 bg-muted rounded"></div>
      <div className="h-12 bg-muted rounded"></div>
      <div className="h-12 bg-muted rounded"></div>
    </div>
    <div className="flex justify-between">
      <div className="h-10 w-28 bg-muted rounded"></div>
      <div className="h-10 w-28 bg-muted rounded"></div>
    </div>
  </div>
);

// Función para extraer y mapear datos del store a formato plano para API
const mapConvenioDataToFields = (convenioData: any) => {
  console.log('Datos crudos del store:', convenioData);
  const parte = convenioData.partes?.[0] || {};
  const datosBasicos = convenioData.datosBasicos || {};
  const mappedData = {
    entidad_nombre: parte.nombre || '',
    entidad_tipo: parte.tipo || '',
    entidad_domicilio: parte.domicilio || '',
    entidad_ciudad: parte.ciudad || '',
    entidad_cuit: parte.cuit || '',
    entidad_representante: parte.representanteNombre || '',
    entidad_dni: parte.representanteDni || '',
    entidad_cargo: parte.cargoRepresentante || '',
    dia: datosBasicos.dia || '',
    mes: datosBasicos.mes || ''
  };
  console.log('Datos mapeados para API:', mappedData);
  return mappedData;
};

// Mapeo directo y robusto basado en el tipo de URL (fuera del componente para evitar recreaciones)
const SLUG_MAPPING: { [key: string]: string } = {
  'marco': 'nuevo-convenio-marco',                          // ID: 2
  'practica-marco': 'nuevo-convenio-marco-practica-supervisada', // ID: 5
  'especifico': 'nuevo-convenio-especifico',                // ID: 4
  'particular': 'nuevo-convenio-particular-de-practica-supervisada', // ID: 1
  'acuerdo': 'nuevo-acuerdo-de-colaboracion'                // ID: 3
};

export function ConvenioFormLayout({ config }: ConvenioFormLayoutProps) {
  // Estado para el progreso del formulario
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Obtener parámetros de la URL
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const urlType = searchParams.get('type'); // Mover aquí para que esté disponible
  const convenioIdFromUrl = params.id !== "nuevo" ? params.id : null;

  // Store de Zustand para manejo de estado global
  const { convenioData, updateConvenioData, stepStates } = useConvenioMarcoStore();
  const formFields = useConvenioStore((state) => state.formFields);
  const previewRef = useRef<HTMLDivElement>(null);
  // Referencia al archivo Word adjunto desde convenioData (no desde datosBasicos)
  const anexoWordFile = (convenioData as any)?.anexoWordFile;

  // Simulamos la carga inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Mapear los pasos con status
  const steps: Step[] = config.steps.map(step => ({
    ...step,
    status: currentStep === step.id ? "current" : currentStep > step.id ? "complete" : "upcoming"
  }));

  // Actualizar progreso cuando cambia el paso
  useEffect(() => {
    setProgress((currentStep / steps.length) * 100);
    
    // Actualizar el store global según el paso completado
    if (currentStep > 1 && formState[1]) {
      updateConvenioData('entidad', formState[1]);
    }
    if (currentStep > 2 && formState[2]) {
      updateConvenioData('representante', formState[2]);
    }
    if (currentStep === 3 && formState[3]) {
      updateConvenioData('fechas', formState[3]);
    }
  }, [currentStep, steps.length, formState, updateConvenioData]);

  // Obtener el estado de validación de los pasos
  const allStepsValid = [1,2,3].every(step => stepStates[step]?.isValid);
  const status = convenioData?.status || 'enviado';

  // Función para enviar el convenio (PATCH status a 'enviado')
  const handleEnviarConvenio = useCallback(async () => {
    if (!convenioData?.id) return;
    setIsSending(true);
    try {
      const response = await fetch(`/api/convenios/${convenioData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'enviado' })
      });
      if (!response.ok) throw new Error('Error al enviar el convenio');
      window.location.reload();
    } catch (e) {
      alert('Error al enviar convenio');
    } finally {
      setIsSending(false);
    }
  }, [convenioData?.id]);

  const handleSaveAndContinue = useCallback(async (newStatus: 'borrador' | 'enviado' = 'borrador') => {
    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Generar templateSlug robusto basado en el tipo de convenio
      // Usar el mapeo directo o generar desde el título como fallback
      const templateSlug = SLUG_MAPPING[urlType || ''] || 
                          config.title
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/[^a-z0-9\s-]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/-+/g, '-');

      // 2. Construir el payload
      const finalData = mapConvenioDataToFields(convenioData);
      if (Object.values(finalData).every(v => !v)) {
        throw new Error('No hay datos en el formulario. Por favor completa los campos.');
      }
      // Generar título robusto
      const title = finalData.entidad_nombre || 
                   convenioData.entidad?.nombre || 
                   config.title || 
                   "Nuevo Convenio";

      const convenioPayload = {
        title,
        status: newStatus,
        template_slug: templateSlug, // NUEVO: Enviar el slug en lugar del ID
        convenio_type: urlType, // SÚPER BACKUP: Enviar tipo explícito también
        form_data: finalData, // CORREGIDO: Usar form_data en lugar de content_data
        user_id: convenioData.user_id,
      };



      // 3. Realizar la petición POST o PATCH
      if (!convenioIdFromUrl && !templateSlug) {
        throw new Error('ID o tipo de convenio no definido');
      }
      const response = await fetch(
        convenioIdFromUrl ? `/api/convenios/${convenioIdFromUrl}` : '/api/convenios',
        {
          method: convenioIdFromUrl ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(convenioPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el convenio');
      }

      const savedConvenio = await response.json();
      
      // Actualizar el store de Zustand con el nuevo ID si es un convenio nuevo
      if (!convenioIdFromUrl && savedConvenio.id) {
        useConvenioMarcoStore.setState({ convenioData: { ...convenioData, id: savedConvenio.id } });
      }

      // Si se envió, recargar para ver el estado final
      if (newStatus === 'enviado') {
        setShowSuccess(true);
        setTimeout(() => {
          window.location.href = '/protected';
        }, 3000); // Redirect después de 3s
      } else {
        // Para 'borrador', simplemente avanzamos
        if (currentStep < steps.length) {
          setCurrentStep(currentStep + 1);
        }
      }

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [convenioData, config.title, convenioIdFromUrl, currentStep, steps.length, urlType]);

  const handleFinalSubmit = async () => {
    await handleSaveAndContinue('enviado');
  };

  // Ejemplo de templateContent
  const templateContent = {
    title: config.title,
    subtitle: "Entre {entidad_nombre} y UTN-FRRe",
    partes: [
      "Por una parte, {entidad_nombre}, representada por {entidad_representante}...",
      "Por la otra parte, la UTN-FRRe..."
    ],
    considerandos: [
      "Que ambas partes desean cooperar...",
      "Que existe interés mutuo..."
    ],
    clausulas: [
      { titulo: "Primera", contenido: "El objeto del convenio es..." },
      { titulo: "Segunda", contenido: "La duración será de..." }
    ],
    cierre: "En prueba de conformidad, firman..."
  };

  const fields = getFieldsFromStore(convenioData, formFields);

  useEffect(() => {
    if (isFullScreen && anexoWordFile && previewRef.current) {
      previewRef.current.innerHTML = '';
      const reader = new FileReader();
      reader.onload = function(e) {
        const arrayBuffer = e.target?.result;
        if (arrayBuffer && previewRef.current) {
          renderAsync(arrayBuffer as ArrayBuffer, previewRef.current, undefined, { className: "docx-preview-rendered" });
        }
      };
      reader.readAsArrayBuffer(anexoWordFile.file);
    }
  }, [isFullScreen, anexoWordFile]);

  return (
    <>
      <BackgroundPattern />
      <div className="p-8 w-full relative">
        <Suspense fallback={<div className="h-24 w-full skeleton"></div>}>
          <div className="mb-8 border-b border-border/40 pb-6">
            <div className="flex items-center justify-between mb-2">
              <Link
                href="/protected"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Volver al dashboard
              </Link>
            </div>
            <div className="mt-6">
              <h1 className="text-2xl font-bold">{config.title}</h1>
              <p className="text-muted-foreground mt-1">{config.description}</p>
            </div>
          </div>
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-2">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-lg border shadow-sm animate-in fade-in-50 duration-300">
              {/* Stepper con animaciones */}
              <div className="p-6 border-b border-border/60">
                <div className="flex items-center gap-4">
                  {steps.map((step, idx) => (
                    <React.Fragment key={step.id}>
                      <div className={cn(
                        "flex items-center gap-2 transition-all duration-300",
                        step.status === "current" ? "text-primary font-medium" :
                        step.status === "complete" ? "text-green-500" :
                        "text-muted-foreground"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                          step.status === "current" ? "border-primary bg-primary/10" :
                          step.status === "complete" ? "border-green-500 bg-green-500/10" :
                          "border-muted-foreground/30 bg-background"
                        )}>
                          {step.status === "complete" ? (
                            <CheckIcon className="h-4 w-4" />
                          ) : (
                            <span>{step.id}</span>
                          )}
                        </div>
                        <span className="hidden md:inline text-sm">{step.title}</span>
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={cn(
                          "h-0.5 flex-grow max-w-16 transition-all duration-500",
                          step.status === "complete" ? "bg-green-500" : "bg-muted"
                        )}></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <Progress value={progress} className="h-1 mt-4" />
              </div>

              {/* Error y carga */}
              {error && (
                <div className="mx-6 mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive animate-in slide-in-from-top-4 duration-300">
                  <AlertCircleIcon className="h-5 w-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {loading ? (
                <FormSkeleton />
              ) : (
                <Suspense fallback={<FormSkeleton />}>
                  <config.FormComponent
                    currentStep={currentStep}
                    onStepChange={setCurrentStep}
                    formState={formState}
                    onFormStateChange={setFormState}
                    onError={setError}
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                    convenioIdFromUrl={convenioIdFromUrl}
                    mode={mode}
                    onFinalSubmit={handleFinalSubmit} // Pasamos la función de guardado final
                  />
                </Suspense>
              )}

              {/* Se eliminó la barra de navegación inferior con los botones "Anterior" y "Guardar y Continuar" */}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SectionContainer title="Progreso">
              <div className="space-y-4">
                {steps.map((step) => {
                  const isClickable = step.id < currentStep || step.status === "complete";
                  return (
                    <button
                      key={step.id}
                      type="button"
                      disabled={!isClickable}
                      onClick={() => {
                        if (isClickable) setCurrentStep(step.id);
                      }}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border transition-all duration-300 focus:outline-none",
                        step.status === "current" ? "bg-primary/5 border-primary/20 scale-105 shadow-sm" :
                        step.status === "complete" ? "bg-green-500/5 border-green-500/20" :
                        "bg-card border-border",
                        isClickable ? "cursor-pointer hover:ring-2 hover:ring-primary/30" : "opacity-60 cursor-not-allowed"
                      )}
                      tabIndex={isClickable ? 0 : -1}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          step.status === "current" ? "bg-primary/10" :
                          step.status === "complete" ? "bg-green-500/10" :
                          "bg-muted"
                        )}>
                          {step.status === "complete" ? (
                            <CheckIcon className="h-5 w-5 text-green-500" />
                          ) : (
                            step.icon
                          )}
                        </div>
                        <div>
                          <h3 className={cn(
                            "font-medium",
                            step.status === "current" ? "text-primary" :
                            step.status === "complete" ? "text-green-500" :
                            "text-muted-foreground"
                          )}>
                            {step.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </SectionContainer>
            
            <SectionContainer title="Vista previa Word">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-2 text-sm transition-all",
                    !anexoWordFile ? "opacity-50 cursor-not-allowed" : "border-primary text-primary hover:bg-primary/10"
                  )}
                  disabled={!anexoWordFile}
                  onClick={() => setIsFullScreen(true)}
                  title={anexoWordFile ? "Ver vista previa del Word adjunto" : "Adjunta un Word para habilitar la vista previa"}
                >
                  <EyeIcon className="h-4 w-4" />
                  Vista previa Word
                </Button>
              </div>
            </SectionContainer>
          </div>
        </div>
      </div>
      {isFullScreen && anexoWordFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-100 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-0 relative border border-gray-300">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
              onClick={() => setIsFullScreen(false)}
              title="Cerrar vista previa"
            >
              <XIcon className="h-6 w-6" />
            </button>
            <div className="px-8 pt-8 pb-4">
              <h2 className="text-xl font-bold mb-4 text-primary">Vista previa Word adjunto</h2>
              <div ref={previewRef} id="docx-preview-container" className="w-full min-h-[400px] border rounded bg-white flex items-center justify-center text-gray-400 shadow-inner">
                <span>La vista previa se cargará aquí...</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {showSuccess && (
        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          title="¡Convenio Creado!"
          message="Tu convenio se creó exitosamente. Redirigiendo al dashboard..."
          autoRedirectSeconds={3}
          onRedirect={() => window.location.href = '/protected'}
        />
      )}
    </>
  );
} 