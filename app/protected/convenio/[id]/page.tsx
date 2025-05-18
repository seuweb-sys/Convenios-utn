"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useParams } from 'next/navigation';
import { ChevronLeftIcon, FileTextIcon, MaximizeIcon, ZoomInIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Importar el store Zustand
import { useConvenioStore } from "@/stores/convenioStore";

// Componentes compartidos
import Stepper from "@/app/components/shared/stepper";

// Componentes de convenios
import NavigationFooter from "@/app/components/convenios/navigation-footer";
import DocumentoPreview from "@/app/components/convenios/documento-preview";

// Componentes de formularios
import DatosBasicosForm from "@/app/components/forms/datos-basicos-form";
import PartesForm from "@/app/components/forms/partes-form";
import ClausulasForm from "@/app/components/forms/clausulas-form";
import AnexosForm from "@/app/components/forms/anexos-form";
import RevisionForm from "@/app/components/forms/revision-form";

// Definir la interfaz para los datos del formulario
interface FormData {
  // Datos básicos
  titulo?: string;
  fecha?: string;
  duracion?: number;
  'unidad-tiempo'?: string;
  descripcion?: string;
  confidencial?: boolean;
  
  // Partes
  organizacion?: string;
  representante?: string;
  cargo?: string;
  direccion?: string;
  
  // Cláusulas y anexos
  clausulas?: Array<{ id: number; titulo: string; contenido: string }>;
  anexos?: Array<{ id: number; nombre: string; tipo: string; tamano: string; fecha: string }>;
  
  // Revisión
  observaciones?: string;
  
  // Otros
  convenio_type_id?: number;
}

// Componente principal de la página
export default function ConvenioPage() {
  // --- Leer estado directamente del store ---
  const currentStep = useConvenioStore((state) => state.currentStep);
  const formData = useConvenioStore((state) => state.convenioData); // Obtener todos los datos
  const convenioFields = useConvenioStore((state) => state.formFields);
  const isLoading = useConvenioStore((state) => state.isLoading);
  const isInitialized = useConvenioStore((state) => state.isInitialized);

  // --- Acciones del store (obtenidas una vez para evitar re-renders innecesarios) ---
  const initializeStore = useConvenioStore((state) => state.initialize);
  const goToStep = useConvenioStore((state) => state.goToStep);

  // --- Parámetros de Ruta y Búsqueda ---
  const params = useParams<{ id: string }>();
  const paramId = params.id;
  const isCreating = paramId === "nuevo";
  const searchParams = useSearchParams();
  const typeId = searchParams.get('typeId');

  // --- Efecto de Inicialización ---
  useEffect(() => {
    // Parsear IDs a número, manejar errores si no son válidos
    const typeIdNumber = typeId ? parseInt(typeId, 10) : null;
    const convenioIdNumber = !isCreating ? parseInt(paramId, 10) : undefined;

    if (isNaN(convenioIdNumber ?? 0)) {
        console.error("ID de convenio inválido en la URL:", paramId);
        // TODO: Mostrar error al usuario / Redirigir
        return;
    }

    if (isCreating && typeIdNumber === null) {
      console.error("Falta typeId en la URL para crear un nuevo convenio.");
      // TODO: Mostrar error al usuario / Redirigir
      return;
    } else if (isCreating && isNaN(typeIdNumber!)) {
       console.error("typeId inválido en la URL:", typeId);
       // TODO: Mostrar error al usuario / Redirigir
       return;
    }

    // Llamar a initialize solo si typeIdNumber es válido
    if (typeIdNumber !== null && !isNaN(typeIdNumber)) {
         console.log(`ConvenioPage: Calling store.initialize with typeId: ${typeIdNumber}, convenioId: ${convenioIdNumber}`);
         initializeStore(typeIdNumber, convenioIdNumber);
    }
    
    // Opcional: Limpiar el store al desmontar el componente si aplica
    // return () => {
    //   console.log("ConvenioPage: Unmounting, resetting store.");
    //   resetStore(); 
    // };

  }, [paramId, typeId, initializeStore, isCreating]); // Dependencias clave

  // --- Handlers simplificados (llaman acciones del store) ---
  const handleStepChange = (step: number) => {
    goToStep(step);
  };

  // --- Renderizado del Paso Actual ---
  const renderStep = () => {
    // Mostrar carga mientras el store no esté inicializado o esté cargando
    if (!isInitialized || isLoading) {
        return (
            <div className="text-center py-10">
                <span className="loading loading-dots loading-lg"></span> Cargando formulario...
            </div>
        );
    }
    
    // TODO: Manejar estado de error leído del store
    // if (errorLoading) return <div className="text-destructive p-4 bg-destructive/10 rounded-md">{errorLoading}</div>;

    // Asegurarse de que los campos se cargaron (aunque isInitialized debería cubrir esto)
    if (!convenioFields || convenioFields.length === 0) {
        return <div className="text-muted-foreground text-center py-4">No se pudo cargar la estructura del formulario.</div>;
    }
    
    // Filtrar campos para el paso actual
    const fieldsForCurrentStep = convenioFields.filter(field => field.step === currentStep);

    switch (currentStep) {
      case 1:
        // Ya no pasamos fields ni defaultValues, el componente usa el store directamente
        return <DatosBasicosForm />;
      case 2:
        return <PartesForm />;
      case 3:
        return <ClausulasForm />;
      case 4:
        return <AnexosForm />;
      case 5:
        return <RevisionForm />;
      default:
        return <div>Paso desconocido: {currentStep}</div>;
    }
  };

  // --- Renderizado Principal ---
  return (
    <>
      {/* Fondo con patrón de puntos estático */}
      <div className="fixed inset-0 bg-background -z-10 opacity-80">
        <svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>
          <defs>
            <pattern id='pattern' width='40' height='40' patternUnits='userSpaceOnUse'>
              <circle cx='20' cy='20' r='0.5' fill='currentColor' className="text-foreground/30" />
            </pattern>
            <pattern id='pattern2' width='80' height='80' patternUnits='userSpaceOnUse'>
              <circle cx='40' cy='40' r='1' fill='currentColor' className="text-foreground/20" />
            </pattern>
          </defs>
          <rect width='100%' height='100%' fill='url(#pattern)' />
          <rect width='100%' height='100%' fill='url(#pattern2)' />
        </svg>
      </div>
      
      <div className="p-6 max-w-screen-2xl mx-auto">
        {/* Botón de regreso independiente */}
        <div className="mb-6">
          <Link
            href="/protected/"
            className="inline-flex items-center text-sm text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" /> 
            Volver al Inicio
          </Link>
        </div>
        
        {/* Panel de bienvenida con stepper - como en las capturas */}
        <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-lg p-5 mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            {isCreating ? "Nuevo Convenio" : `Editar Convenio #${paramId}`}
          </h1>
          <p className="text-white/60 mb-4">
            Completa la información del convenio paso a paso
          </p>
          
          {/* Stepper tradicional */}
          <Stepper 
            currentStep={currentStep} 
            onStepChange={handleStepChange} 
          />
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Columna izquierda - Formulario */}
          <div className="w-full lg:w-3/5">
            <div className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-lg p-6 mb-6 shadow-sm min-h-[300px]">
              {renderStep()}
              <NavigationFooter />
            </div>
          </div>

          {/* Columna derecha - Vista previa */}
          <div className="w-full lg:w-2/5 sticky top-6">
            <div className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-lg overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                <div className="flex items-center">
                  <FileTextIcon className="h-5 w-5 text-primary mr-2" />
                  <span className="text-sm font-medium">Vista previa</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors flex items-center">
                    <ZoomInIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs">Zoom</span>
                  </button>
                  <button className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors flex items-center">
                    <MaximizeIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs">Pantalla completa</span>
                  </button>
                  <div className="text-xs text-muted-foreground">
                    Página 1 de 2
                  </div>
                </div>
              </div>
              <div className="p-4">
                <DocumentoPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 