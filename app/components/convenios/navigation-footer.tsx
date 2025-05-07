import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, SaveIcon } from "lucide-react";

// Importar el store
import { useConvenioStore } from "@/stores/convenioStore";

export const NavigationFooter = () => {
  // Leer estado y acciones del store
  const currentStep = useConvenioStore((state) => state.currentStep);
  const stepStates = useConvenioStore((state) => state.stepStates);
  const isSaving = useConvenioStore((state) => state.isSaving);
  const formFields = useConvenioStore((state) => state.formFields);
  const goToStep = useConvenioStore((state) => state.goToStep);
  const saveConvenio = useConvenioStore((state) => state.saveConvenio);

  // Calcular totalSteps basado en los campos definidos o el estado de los pasos
  const stepNumbers = Object.keys(stepStates).map(Number);
  const totalSteps = stepNumbers.length > 0 ? Math.max(...stepNumbers) : 0;
  // Alternativa si stepStates no está completamente inicializado al principio:
  // const totalSteps = formFields.length > 0 ? Math.max(...formFields.map(f => f.step)) : 0;
  
  // Determinar si el paso actual es válido
  const isCurrentStepValid = stepStates[currentStep]?.isValid || false;

  // Determinar estados deshabilitados
  const isPreviousDisabled = currentStep <= 1 || isSaving;
  const isNextDisabled = !isCurrentStepValid || isSaving;
  // El botón de guardar podría requerir que todos los pasos sean válidos, 
  // pero la validación final se hará en la acción saveConvenio del store.
  // Aquí solo deshabilitamos si el paso *actual* no es válido o si se está guardando.
  const isSubmitDisabled = !isCurrentStepValid || isSaving;

  const handlePrevious = () => {
    if (!isPreviousDisabled) {
        goToStep(currentStep - 1);
    }
  };

  const handleNext = () => {
      if (!isNextDisabled) {
          goToStep(currentStep + 1);
      }
  };

  const handleSubmit = () => {
     if (!isSubmitDisabled) {
         saveConvenio();
     }
  };

  // No renderizar si no hay pasos definidos
  if (totalSteps === 0) {
      return null; 
  }

  return (
    <div className="flex items-center justify-between border-t border-border/40 mt-8 pt-6">
      <div className="text-sm text-muted-foreground">
        {totalSteps > 0 ? `Paso ${currentStep} de ${totalSteps}` : ''}
      </div>
      
      <div className="flex gap-3">
        {currentStep > 1 && (
          <Button 
            variant="outline" 
            onClick={handlePrevious} // Usar handler local
            className="border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            disabled={isPreviousDisabled} // Usar estado calculado
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" /> 
            Anterior
          </Button>
        )}
        
        {currentStep < totalSteps ? (
          <Button 
            onClick={handleNext} // Usar handler local
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isNextDisabled} // Usar estado calculado
          >
            Siguiente
            <ChevronRightIcon className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} // Usar handler local
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSubmitDisabled} // Usar estado calculado
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar convenio'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default NavigationFooter;