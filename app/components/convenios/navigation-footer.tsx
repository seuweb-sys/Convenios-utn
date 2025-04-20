import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, SaveIcon } from "lucide-react";

interface NavigationFooterProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const NavigationFooter = ({ 
  currentStep, 
  totalSteps, 
  onPrevious, 
  onNext, 
  onSubmit 
}: NavigationFooterProps) => {
  return (
    <div className="flex items-center justify-between border-t border-border/40 mt-8 pt-6">
      <div className="text-sm text-muted-foreground">
        Paso {currentStep} de {totalSteps}
      </div>
      
      <div className="flex gap-3">
        {currentStep > 1 && (
          <Button 
            variant="outline" 
            onClick={onPrevious}
            className="border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" /> 
            Anterior
          </Button>
        )}
        
        {currentStep < totalSteps ? (
          <Button 
            onClick={onNext}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Siguiente
            <ChevronRightIcon className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={onSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            Guardar convenio
          </Button>
        )}
      </div>
    </div>
  );
};

export default NavigationFooter;