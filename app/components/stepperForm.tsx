"use client";

import React from "react";
import { useConvenioStore } from "@/stores/convenioStore";
import Stepper from "@/app/components/shared/stepper";

interface StepperFormProps {
  children: React.ReactNode;
}

export const StepperForm = ({ children }: StepperFormProps) => {
  // Estado de los pasos desde el store
  const currentStep = useConvenioStore((state) => state.currentStep);
  const goToStep = useConvenioStore((state) => state.goToStep);
  const stepStates = useConvenioStore((state) => state.stepStates);
  
  // Cambiar el paso actual
  const handleStepChange = (newStep: number) => {
    console.log(`StepperForm: Attempting to change from step ${currentStep} to ${newStep}`);
    
    // Si estamos en el paso 2 (partes) o 3 (cláusulas), forzar guardado antes de cambiar
    if (currentStep === 2) {
      // Forzar guardado en el paso 2 (partes)
      const partesNode = document.querySelector("[data-step='2'] button[type='button']") as HTMLButtonElement | null;
      if (partesNode) {
        console.log("StepperForm: Forzando validación del paso 2 antes de cambiar");
        partesNode.click();
      }
    } else if (currentStep === 3) {
      // Forzar guardado en el paso 3 (cláusulas)
      const clausulasNode = document.querySelector("[data-step='3'] button[type='submit']") as HTMLButtonElement | null;
      if (clausulasNode) {
        console.log("StepperForm: Forzando validación del paso 3 antes de cambiar");
        clausulasNode.click();
      }
    }
    
    // Dejar pasar un tick para que se completen los efectos antes de cambiar
    setTimeout(() => {
      goToStep(newStep);
    }, 50);
  };
  
  return (
    <div className="flex flex-col h-full">
      <Stepper currentStep={currentStep} onStepChange={handleStepChange} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default StepperForm; 