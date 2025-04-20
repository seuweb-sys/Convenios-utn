import React from "react";
import { CheckCircle, Save, ArrowRight, Send, ArrowLeft } from "lucide-react";

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

  // Estados posibles para un paso
  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "active";
    return "pending";
  };

  // Función para manejar la navegación
  const handleNext = () => {
    if (currentStep < steps.length && onStepChange) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1 && onStepChange) {
      onStepChange(currentStep - 1);
    }
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar el progreso
    console.log("Guardando progreso...");
  };

  const handleSubmit = () => {
    // Aquí iría la lógica para enviar el convenio
    console.log("Enviando convenio...");
  };

  return (
    <div className="py-8">
      <div className="flex items-center justify-between">
        {/* Parte izquierda: Stepper */}
        <div className="flex-1 flex items-center">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            
            // Determinar si hay un conector después de este paso
            const hasNextStep = index < steps.length - 1;
            
            return (
              <div key={step.id} className="flex flex-1 items-center">
                {/* Paso actual con su ícono y etiqueta */}
                <div 
                  className="flex flex-col items-center relative z-10 cursor-pointer"
                  onClick={() => onStepChange && onStepChange(step.id)}
                >
                  {/* Círculo del paso */}
                  <div 
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                      ${status === "completed" 
                        ? "bg-emerald-500 text-white" 
                        : status === "active"
                          ? "bg-blue-600 text-white ring-4 ring-blue-200/30"
                          : "bg-gray-200/20 border border-white/20 text-white/60"
                      }
                    `}
                  >
                    {status === "completed" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  
                  {/* Etiqueta del paso */}
                  <div className="text-center">
                    <div className="text-xs font-medium text-white/40 uppercase">
                      PASO {step.id}
                    </div>
                    <div className={`
                      text-sm font-medium transition-colors
                      ${status === "completed" 
                        ? "text-emerald-500" 
                        : status === "active"
                          ? "text-white"
                          : "text-white/60"
                      }
                    `}>
                      {step.label}
                    </div>
                    
                    {/* Estado del paso */}
                    <div className="text-xs mt-1">
                      {status === "completed" && (
                        <span className="text-emerald-500">Completado</span>
                      )}
                      {status === "active" && (
                        <span className="text-blue-400">En progreso</span>
                      )}
                      {status === "pending" && (
                        <span className="text-white/40">Pendiente</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Conector entre pasos */}
                {hasNextStep && (
                  <div className="flex-1 mx-2 relative h-[2px]">
                    {/* Línea base */}
                    <div className="absolute inset-0 bg-white/10"></div>
                    
                    {/* Línea de progreso */}
                    <div 
                      className={`
                        absolute inset-y-0 left-0 transition-all duration-300 ease-in-out
                        ${currentStep > step.id + 1 
                          ? "right-0 bg-emerald-500" 
                          : currentStep > step.id 
                            ? "right-0 bg-gradient-to-r from-emerald-500 to-blue-600" 
                            : "right-full bg-transparent"
                        }
                      `}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Parte derecha: Panel de acciones */}
        <div className="ml-8 flex flex-col items-end">
          <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-white/10 min-w-[220px]">
            <div className="mb-4">
              <h3 className="text-white font-medium mb-1">Acciones</h3>
              <p className="text-white/60 text-xs">
                {currentStep === steps.length 
                  ? "Revisa y envía tu convenio" 
                  : `Completa el paso ${currentStep} de ${steps.length}`}
              </p>
              <div className="mt-2 w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {/* Botón principal */}
              {currentStep === steps.length ? (
                <button 
                  onClick={handleSubmit}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar convenio
                </button>
              ) : (
                <button 
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors w-full"
                >
                  Siguiente paso
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              )}
              
              {/* Botón secundario */}
              <div className="flex gap-2 w-full">
                {currentStep > 1 && (
                  <button 
                    onClick={handlePrevious}
                    className="bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-md flex-1 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </button>
                )}
                
                <button 
                  onClick={handleSave}
                  className="bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-md flex-1 flex items-center justify-center transition-colors"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stepper;