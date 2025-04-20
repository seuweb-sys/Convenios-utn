import React from "react";

interface StepperProps {
  currentStep: number;
  onStepChange?: (step: number) => void;
}

export const Stepper = ({ currentStep, onStepChange }: StepperProps) => {
  const steps = [
    { id: 1, label: "Datos básicos" },
    { id: 2, label: "Partes" },
    { id: 3, label: "Cláusulas" },
    { id: 4, label: "Anexos" },
    { id: 5, label: "Revisión" },
  ];

  return (
    <div className="relative py-8">
      {/* Línea base continua (gris) */}
      <div className="absolute h-[2px] bg-white/20 left-0 right-0 top-[18px]"></div>
      
      {/* Línea de progreso (azul) */}
      <div 
        className="absolute h-[2px] bg-blue-500 left-0 top-[18px] transition-all duration-300"
        style={{ 
          width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
        }}
      ></div>

      {/* Pasos con círculos */}
      <div className="flex justify-between relative">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className="flex flex-col items-center"
            onClick={() => onStepChange && onStepChange(step.id)}
          >
            <div 
              className={`
                w-7 h-7 rounded-full flex items-center justify-center mb-2 transition-colors
                ${currentStep > step.id 
                  ? 'bg-blue-500 text-white' 
                  : currentStep === step.id 
                    ? 'bg-blue-500 text-white'
                    : 'bg-black/10 border border-white/20 text-white/60'
                }
              `}
            >
              {currentStep > step.id ? (
                <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-xs font-medium">{step.id}</span>
              )}
            </div>
            <span className={`text-xs ${currentStep === step.id ? 'text-white' : 'text-white/60'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stepper;