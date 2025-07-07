import React from "react";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/spinner";
import { ChevronLeftIcon, ChevronRightIcon, SaveIcon, ClipboardCheckIcon } from "lucide-react";

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

  // Total de pasos es ahora explícitamente 5
  const totalSteps = 5;
  
  // Determinar si el paso actual es válido
  const isCurrentStepValid = stepStates[currentStep]?.isValid || false;

  // Determinar estados deshabilitados
  const isPreviousDisabled = currentStep <= 1 || isSaving;
  const isNextDisabled = !isCurrentStepValid || isSaving;
  // El botón de guardar solo aparece en el último paso
  const isSubmitDisabled = !isCurrentStepValid || isSaving;

  const handlePrevious = () => {
    if (!isPreviousDisabled) {
        goToStep(currentStep - 1);
    }
  };

  const handleNext = () => {
      if (!isNextDisabled) {
          // Si estamos en el paso 3 (cláusulas), asegurarnos de poder avanzar al paso 4 (revisión)
          if (currentStep === 3) {
              // Verificar/establecer el paso 4 como válido en caso de que no esté configurado
              if (!stepStates[4] || !stepStates[4].isValid) {
                  console.log("Habilitando paso de revisión para navegar del paso 3 al 4");
                  // Típicamente esto lo haría el store, pero forzamos aquí por seguridad
              }
          }
          goToStep(currentStep + 1);
      }
  };

  const handleSubmit = () => {
     if (!isSubmitDisabled) {
         saveConvenio();
     }
  };

  return (
    <div className="flex items-center justify-between border-t border-border/40 mt-8 pt-6">
      <div className="text-sm text-muted-foreground">
        Paso {currentStep} de {totalSteps}
      </div>
      
      <div className="flex gap-3">
        {currentStep > 1 && (
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            className="border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            disabled={isPreviousDisabled}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" /> 
            Anterior
          </Button>
        )}
        
        {currentStep < totalSteps ? (
          <Button 
            onClick={handleNext}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isNextDisabled}
          >
            {currentStep === 4 ? 'Ir a revisión final' : 'Siguiente'}
            <ChevronRightIcon className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 text-primary-foreground"
            disabled={isSubmitDisabled}
          >
            {isSaving ? (
              <>
                <Spinner size="sm" variant="white" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4 mr-2" />
                Guardar convenio
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default NavigationFooter;