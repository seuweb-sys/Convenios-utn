import { create } from 'zustand';
import { ConvenioData, validateDatosBasicos, validateParte, validateClausulas } from '@/types/convenio'; // Importar tipos y schema base
import { FieldDefinition } from '@/types/fieldDefinition';

// Interfaz para el estado de un paso individual
interface StepState {
  isValid: boolean;
  isTouched: boolean;
}

// Interfaz para el estado completo del store
interface ConvenioState {
  convenioData: Partial<ConvenioData>;
  initialConvenioData: Partial<ConvenioData> | null;
  convenioTypeId: number | null;
  convenioId: number | null;
  currentStep: number;
  stepStates: Record<number, StepState>;
  formFields: FieldDefinition[];
  isLoading: boolean;
  isSaving: boolean;
  isInitialized: boolean;
  updateLogTimestamp?: number;

  // Acciones
  initialize: (typeId: number, convenioId?: number) => Promise<void>;
  updateConvenioData: (stepKey: keyof ConvenioData | string, data: any) => void;
  setStepValidity: (step: number, isValid: boolean, isTouched?: boolean) => void;
  goToStep: (stepNumber: number) => void;
  saveConvenio: () => Promise<void>;
  reset: () => void;
}

// Estado inicial con tipos de datos más definidos
const initialState: Omit<ConvenioState, 'initialize' | 'updateConvenioData' | 'setStepValidity' | 'goToStep' | 'saveConvenio' | 'reset'> = {
  convenioData: {
      // Asegurar que las propiedades de array/objeto esperadas existan
      datosBasicos: undefined, // O un objeto vacío si tiene sentido: {} 
      partes: [], 
      clausulas: [], 
      anexos: [],
      // otros campos podrían inicializarse como undefined o valores por defecto
  },
  initialConvenioData: null,
  convenioTypeId: null,
  convenioId: null,
  currentStep: 1,
  stepStates: {},
  formFields: [],
  isLoading: false,
  isSaving: false,
  isInitialized: false,
  updateLogTimestamp: undefined,
};

// Crear el store
export const useConvenioStore = create<ConvenioState>((set, get) => ({
  ...initialState,

  // --- ACCIONES ---

  initialize: async (typeId, convenioId) => {
    // Reiniciar el estado con initialState para asegurar la estructura correcta
    set({ ...initialState, isLoading: true, isInitialized: false, convenioTypeId: typeId, convenioId: convenioId ?? null });
    console.log(`Store: Initializing for typeId: ${typeId}, convenioId: ${convenioId}`);
    try {
      // --- 1. Fetch formFields (simulado por ahora) ---
      // En una app real, harías fetch(`/api/convenio-types/${typeId}`)
      const fetchedFields: FieldDefinition[] = [
          // Simulación para Datos Básicos (Paso 1)
          { name: 'nombre', label: 'Nombre del Convenio', type: 'text', required: true, step: 1, placeholder: 'Ej: Convenio Marco de Colaboración' },
          { name: 'objeto', label: 'Objeto', type: 'textarea', required: true, step: 1, placeholder: 'Describa el propósito del convenio...' },
          { name: 'fechaInicio', label: 'Fecha de Inicio', type: 'date', required: true, step: 1 },
          { name: 'fechaFin', label: 'Fecha de Fin', type: 'date', required: true, step: 1 },
          // Simulación para Partes (Paso 2) - Placeholder
          { name: 'partesInfo', label: 'Información de las Partes', type: 'text', step: 2 },
          // Simulación para Cláusulas (Paso 3) - Placeholder
          { name: 'clausulasTexto', label: 'Texto de Cláusulas', type: 'textarea', step: 3 },
          // Simulación para Anexos (Paso 4)
          { name: 'anexosInfo', label: 'Información de Anexos', type: 'text', step: 4 },
          // Paso 5: Revisión
          { name: 'revision', label: 'Revisión y Confirmación', type: 'text', step: 5, placeholder: 'Revisa todos los datos antes de guardar.' },
      ];
      set({ formFields: fetchedFields });
      console.log("Store: Fetched/Simulated formFields", fetchedFields);

      // --- 2. Si hay convenioId, fetch convenioData (simulado) ---
      let loadedData: Partial<ConvenioData> = {};
      if (convenioId) {
          console.log(`Store: Fetching data for existing convenio ${convenioId}`);
          // Simulación: fetch(`/api/convenios/${convenioId}`)
          await new Promise(resolve => setTimeout(resolve, 50)); // Simular delay de red
          loadedData = {
              id: convenioId,
              typeId: typeId,
              datosBasicos: {
                  nombre: `Convenio Editado ${convenioId}`,
                  objeto: 'Objeto cargado para edición.',
                  fechaInicio: '2024-01-15',
                  fechaFin: '2025-01-14'
              },
              // ... otros datos de partes, cláusulas, etc.
          };
          console.log("Store: Fetched/Simulated loadedData", loadedData);
      }
      
      // Fusionar datos cargados con la estructura inicial asegurando arrays
      const initialDataWithDefaults = {
           ...initialState.convenioData, // Asegura que todos los campos existen
           ...loadedData,             // Sobrescribe con datos cargados
           partes: loadedData.partes ?? [], // Asegura array partes
           clausulas: loadedData.clausulas ?? [], // Asegura array clausulas
           anexos: loadedData.anexos ?? [], // Asegura array anexos
           // Asegurar otros arrays/objetos si es necesario
      };

      set({ 
          convenioData: initialDataWithDefaults, 
          initialConvenioData: JSON.parse(JSON.stringify(initialDataWithDefaults)) // Guardar copia profunda
      }); 

      // --- 3. Inicializar stepStates basado en campos y datos cargados ---
      const steps = Array.from(new Set(fetchedFields.map(f => f.step))); // Corregido: Usar Array.from para iterar Set
      const initialStepStates: Record<number, StepState> = {};
      for (const stepNum of steps) {
          let isStepInitiallyValid = false;
          if (convenioId && initialDataWithDefaults) {
              // Intentar validar datos iniciales para este paso
              if (stepNum === 1 && initialDataWithDefaults.datosBasicos) {
                  // Validar datosBasicos con nuestra función de validación
                  isStepInitiallyValid = validateDatosBasicos(initialDataWithDefaults.datosBasicos).valid;
                  console.log(`Store: Initial validation for step 1: ${isStepInitiallyValid}`);
              }
              // Validación para otros pasos según sea necesario
          }
          
          // El paso 5 (revisión) siempre se considera válido
          if (stepNum === 5) {
              isStepInitiallyValid = true;
          }
          
          initialStepStates[stepNum] = { isValid: isStepInitiallyValid, isTouched: !!convenioId }; // Marcar como tocado si estamos editando
      }
      set({ stepStates: initialStepStates });
      console.log("Store: Initialized stepStates", initialStepStates);

      set({ isInitialized: true });

    } catch (error) {
      console.error("Error initializing convenio store:", error);
      // Manejar estado de error si es necesario
    } finally {
      set({ isLoading: false });
    }
  },

  updateConvenioData: (stepKey, data) => {
    set((state) => {
      // Asegurar que siempre guardamos nuevos objetos/arrays sin referencias a los originales
      let newData = data;
      
      // Si es un array, crear un nuevo array con nuevos objetos para cada elemento
      if (Array.isArray(data)) {
        newData = data.map(item => {
          if (typeof item === 'object' && item !== null) {
            return { ...item };
          }
          return item;
        });
      } 
      // Si es un objeto, crear un nuevo objeto
      else if (typeof data === 'object' && data !== null) {
        newData = { ...data };
      }
      
      // Actualizar el estado con nuevos objetos
      return {
        convenioData: {
          ...state.convenioData,
          [stepKey]: newData,
        },
        // Agregar timestamp para forzar re-renders en componentes que observan este store
        updateLogTimestamp: Date.now(),
      };
    });

    // --- Validación ---
    // Solo registrar una vez la actualización de datos, sin diagnóstico completo
    // Usando log condicional con marca de tiempo para limitar frecuencia
    const now = Date.now();
    const lastLogTime = get().updateLogTimestamp || 0; // Valor por defecto seguro
    
    if (now - lastLogTime > 1000) {
      console.log(`Store: Updated data for ${String(stepKey)}`);
      set({ updateLogTimestamp: now });
    }

    // --- Validar y actualizar estado del paso SOLO si es el paso actual ---
    const { currentStep, convenioData, stepStates } = get();
    
    // Evitar validación excesiva - solo validar si estamos en el paso correspondiente
    // y los datos son para este paso
    const isCurrentStepData = 
      //(stepKey === 'datosBasicos' && currentStep === 1) || // Ya no validamos automáticamente el paso 1
      //(stepKey === 'partes' && currentStep === 2) ||       // Ya no validamos automáticamente el paso 2
      (stepKey === 'clausulas' && currentStep === 3);       // Solo validamos automáticamente el paso 3 (aunque incluso este usa validación explícita)
    
    // Si no es el paso actual, no validamos
    if (!isCurrentStepData) return;
    
    // Para pasos que ya fueron validados previamente con éxito, respetamos esa validación
    if (stepStates[currentStep]?.isValid) {
      console.log(`El paso ${currentStep} ya fue validado, manteniendo estado válido`);
      return;
    }
    
    let isValid = false;
    
    // Validar según el tipo de datos (stepKey)
    // Eliminamos la validación automática para datosBasicos
    // Eliminamos la validación automática para partes
    if (stepKey === 'clausulas' && currentStep === 3) {
        // Comprobar si el paso ya fue marcado como válido previamente
        // Si ya está marcado como válido, respetamos esa validación
        if (stepStates[3]?.isValid) {
            console.log("El paso de cláusulas ya fue validado, manteniendo estado válido");
            isValid = true;
        } else {
            // Validar cláusulas con nuestra función
            if (convenioData.clausulas) {
                // Agregamos logs para diagnosticar
                console.log("Validando cláusulas:", JSON.stringify(convenioData.clausulas));
                
                // Verificación básica manual para evitar errores de formato
                if (Array.isArray(convenioData.clausulas) && convenioData.clausulas.length > 0) {
                    // Comprobar si al menos una cláusula tiene texto
                    const hayAlgunaClausulaConTexto = convenioData.clausulas.some(
                        clausula => clausula && clausula.texto && clausula.texto.trim() !== ''
                    );
                    
                    if (hayAlgunaClausulaConTexto) {
                        isValid = true;
                        console.log("Validación manual: cláusulas válidas");
                    } else {
                        isValid = false;
                        console.log("Validación manual: ninguna cláusula tiene texto");
                    }
                } else {
                    isValid = false;
                    console.log("Validación manual: formato incorrecto o array vacío");
                }
                
                // Usar la función validateClausulas pero no dependemos de ella para avanzar
                try {
                    const clausulasValidation = validateClausulas(convenioData.clausulas);
                    console.log("Validación formal: ", clausulasValidation);
                    // No sobreescribimos isValid aquí, solo loggeamos
            } catch (error) {
                    console.error("Error al validar cláusulas:", error);
                }
            }
        }
    }
    
    // Si estamos en el paso correspondiente a los datos actualizados, actualizamos su validez
    // Cambiamos este bloque para no incluir los pasos 1 y 2
    if (stepKey === 'clausulas' && currentStep === 3) {
        get().setStepValidity(currentStep, isValid, true);
    }
  },

  setStepValidity: (step, isValid, isTouched = true) => {
    set((state) => {
      // Evitar sobreescribir si el estado ya es el deseado
      if (state.stepStates[step]?.isValid === isValid && state.stepStates[step]?.isTouched === isTouched) {
        return state;
      }
      return {
        stepStates: {
          ...state.stepStates,
          [step]: { isValid, isTouched },
        },
      };
    });
  },

  goToStep: (stepNumber) => {
    console.log(`[Store goToStep] Attempting to move to step: ${stepNumber}`); // Log inicial
    const currentState = get();
    console.log(`[Store goToStep] Current state: step=${currentState.currentStep}, stepStates=`, JSON.parse(JSON.stringify(currentState.stepStates))); // Log estado actual
    
    // Forzar el número total de pasos a 5, sin depender de stepStates ni formFields
    const maxSteps = 5;
    console.log(`[Store goToStep] Using fixed maxSteps: ${maxSteps}`); // Log maxSteps

    if (stepNumber > 0 && stepNumber <= maxSteps ) {
        // Permitir ir a pasos anteriores siempre
        if (stepNumber < currentState.currentStep) {
             console.log(`[Store goToStep] Moving back from ${currentState.currentStep} to ${stepNumber}`);
             set({ currentStep: stepNumber });
             return;
        }
        // Permitir ir al siguiente paso solo si el actual es válido
        if (stepNumber === currentState.currentStep + 1) {
            const currentStepValidated = currentState.stepStates[currentState.currentStep]?.isValid || false;
            console.log(`[Store goToStep] Checking validity of current step (${currentState.currentStep}): ${currentStepValidated}`); // Log validez paso actual
            
            // Asegurar que el paso 4 siempre existe y es válido para poder pasar del paso 3 al 4
            if (currentState.currentStep === 3 && stepNumber === 4) {
                // Si el paso 4 no existe o no está inicializado, crearlo como válido
                if (!currentState.stepStates[4]) {
                    console.log(`[Store goToStep] Initializing step 4 (review) as valid`);
                    get().setStepValidity(4, true, true);
                }
            }
            
            if (currentStepValidated) {
                console.log(`[Store goToStep] Moving forward from ${currentState.currentStep} to ${stepNumber}`);
                set({ currentStep: stepNumber });
            } else {
                console.warn(`[Store goToStep] Cannot move forward because step ${currentState.currentStep} is marked as invalid.`);
            }
            return; // Salir después de manejar avance
        }
        
        // Si no es anterior, ni el siguiente válido, no permitir
         console.warn(`[Store goToStep] Invalid step transition requested from ${currentState.currentStep} to ${stepNumber}. Conditions not met.`);
    } else {
        console.warn(`[Store goToStep] Requested step ${stepNumber} is out of bounds (1-${maxSteps}).`);
    }
  },

  saveConvenio: async () => {
    const { convenioData, convenioId, convenioTypeId, stepStates, formFields } = get();
    console.log("Store: Attempting to save convenio...");

    // Validar que TODOS los pasos definidos por los formFields sean válidos
    const stepsInForm = Array.from(new Set(formFields.map(f => f.step))); 
    let allStepsValid = true;
    for (const stepNum of stepsInForm) {
        if (!stepStates[stepNum]?.isValid) {
            allStepsValid = false;
            console.error(`Store: Cannot save, step ${stepNum} is invalid.`);
            // Navegar al paso inválido
            set({ currentStep: stepNum }); 
            return;
        }
    }

    if (!allStepsValid) return; // Doble chequeo

    set({ isSaving: true });
    try {
      // Preparar payload final
      const payload = {
        title: convenioData.datosBasicos?.nombre || "Sin título",
        convenio_type_id: convenioTypeId!,
        template_slug: 'nuevo-convenio-marco',
        form_data: {
          datos_basicos: convenioData.datosBasicos,
          partes: convenioData.partes,
          clausulas: convenioData.clausulas,
          anexos: convenioData.anexos,
          revision: convenioData.revision,
        },
        status: 'enviado'
      };

      let response, savedConvenio;
      if (convenioId) {
        // UPDATE (PATCH)
        response = await fetch(`/api/convenios/${convenioId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // CREATE (POST)
        response = await fetch("/api/convenios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar el convenio");
      }

      savedConvenio = await response.json();
      console.log("Store: Save successful. Response:", savedConvenio);

      // Actualizar estado con datos guardados
      set({
        convenioData: savedConvenio,
        initialConvenioData: JSON.parse(JSON.stringify(savedConvenio)), 
        convenioId: savedConvenio.id, 
        isSaving: false,
      });

      // (Opcional) Redirigir o mostrar feedback de éxito aquí

    } catch (error: any) {
      console.error("Error saving convenio:", error);
      set({ isSaving: false });
      // (Opcional) Mostrar feedback de error al usuario
    }
  },

  reset: () => set(initialState), 
}));

// --- TIPOS (Definiciones básicas, ajustar según necesidad) ---
// Estos deberían vivir en archivos dedicados, por ejemplo @/types/

// Placeholder para la estructura de datos del convenio completo
// Debe coincidir con cómo quieres agrupar los datos de cada paso
// interface ConvenioData {
//   datosBasicos?: { /* campos de datos basicos */ };
//   partes?: { /* campos de partes */ };
//   clausulas?: { /* campos de clausulas */ };
//   anexos?: { /* campos de anexos */ };
//   // ...otros pasos
// }

// Placeholder para la definición de un campo (similar a como viene de la API)
// interface FieldDefinition {
//   name: string;
//   label: string;
//   type: string;
//   required?: boolean;
//   step: number; // Añadir a qué paso pertenece podría ser útil
//   // ...otras propiedades de validación o UI
// }

// NOTA: Asegúrate de crear/ajustar los tipos `ConvenioData` y `FieldDefinition`
// en archivos apropiados (ej: /types/convenio.ts, /types/fieldDefinition.ts)
// e importarlos aquí correctamente. 

// Selector para obtener los fields planos a partir de formFields y convenioData
export function getFieldsFromStore(convenioData: any, formFields: FieldDefinition[]): Record<string, string> {
  return Object.fromEntries(
    formFields.map(f => [
      f.name,
      // Busca el valor en todas las secciones posibles
      convenioData.datosBasicos?.[f.name] ??
      convenioData.partes?.[f.name] ??
      convenioData.clausulas?.[f.name] ??
      convenioData.anexos?.[f.name] ??
      convenioData[f.name] ??
      ""
    ])
  );
} 