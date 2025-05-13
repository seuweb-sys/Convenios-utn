"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, FileTextIcon, MaximizeIcon, ZoomInIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Componentes compartidos
import Stepper from "@/app/components/shared/stepper";

// Componentes de convenios
import ConvenioHeader from "@/app/components/convenios/convenio-header";
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
export default function ConvenioPage({ params }: { params: Promise<{ id: string }> }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const resolvedParams = React.use(params);
  const convenioId = resolvedParams.id;

  const handleStepChange = (step: number) => {
    if (step >= 1 && step <= 5) {
      setCurrentStep(step);
    }
  };

  const handleFormDataChange = (data: any) => {
    setFormData((prevData) => ({ ...prevData, ...data }));
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Preparar los datos según la estructura de la base de datos
      const convenioData = {
        title: formData.titulo || 'Sin título',
        convenio_type_id: formData.convenio_type_id || 1,
        content_data: {
          // Datos básicos
          datos_basicos: {
            titulo: formData.titulo,
            fecha: formData.fecha,
            duracion: formData.duracion,
            unidad_tiempo: formData['unidad-tiempo'],
            descripcion: formData.descripcion,
            confidencial: formData.confidencial
          },
          // Partes involucradas
          partes: {
            organizacion: formData.organizacion,
            representante: formData.representante,
            cargo: formData.cargo,
            direccion: formData.direccion
          },
          // Cláusulas
          clausulas: formData.clausulas || [],
          // Anexos
          anexos: formData.anexos || [],
          // Datos de revisión
          revision: {
            observaciones: formData.observaciones
          }
        }
      };

      console.log('Enviando datos:', convenioData); // Para debug

      const response = await fetch('/api/convenios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(convenioData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar el convenio');
      }

      const data = await response.json();
      console.log('Convenio guardado:', data);
      
      // Redirigir al dashboard
      window.location.href = '/protected/';
      
    } catch (error) {
      console.error('Error al guardar el convenio:', error);
      alert('Error al guardar el convenio. Por favor, intente nuevamente.');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <DatosBasicosForm onDataChange={handleFormDataChange} />;
      case 2:
        return <PartesForm onDataChange={handleFormDataChange} />;
      case 3:
        return <ClausulasForm onDataChange={handleFormDataChange} />;
      case 4:
        return <AnexosForm onDataChange={handleFormDataChange} />;
      case 5:
        return <RevisionForm onDataChange={handleFormDataChange} formData={formData} />;
      default:
        return <DatosBasicosForm onDataChange={handleFormDataChange} />;
    }
  };

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
            {convenioId === "nuevo" ? "Nuevo Convenio" : `Editar Convenio #${convenioId}`}
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
            {/* Formulario del paso actual */}
            <div className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-lg p-6 mb-6 shadow-sm">
              {renderStep()}
              
              {/* Mini-footer para navegación */}
              <NavigationFooter 
                currentStep={currentStep}
                totalSteps={5}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onSubmit={handleSubmit}
              />
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
                <DocumentoPreview formData={formData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}