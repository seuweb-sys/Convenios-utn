import { create } from 'zustand';
import { ConvenioData, DatosBasicosSchema } from '@/types/convenio'; // Importar tipos y schema base
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
          // ... otros campos para otros pasos
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
                  // Validar datosBasicos usando su schema Zod
                  isStepInitiallyValid = DatosBasicosSchema.safeParse(initialDataWithDefaults.datosBasicos).success;
                  console.log(`Store: Initial validation for step 1: ${isStepInitiallyValid}`);
              }
              // TODO: Añadir lógica de validación inicial para otros pasos (partes, clausulas...)
              // cuando sus schemas Zod estén definidos
          }
          initialStepStates[stepNum] = { isValid: isStepInitiallyValid, isTouched: !!convenioId }; // Marcar como tocado si estamos editando
      }
      set({ stepStates: initialStepStates });
      console.log("Store: Initialized stepStates", initialStepStates);

      set({ isInitialized: true });

    } catch (error) {
      console.error("Error initializing convenio store:", error);
      // TODO: Manejar estado de error (ej: set({ error: 'Mensaje...' }))
    } finally {
      set({ isLoading: false });
    }
  },

  updateConvenioData: (stepKey, data) => {
    set((state) => {
      const currentStepData = state.convenioData[stepKey as keyof ConvenioData] || {};
      const updatedData = { ...currentStepData, ...data };
      return {
        convenioData: {
          ...state.convenioData,
          [stepKey]: updatedData,
        },
      };
    });
    // Corregido: Usar String() para el log
    console.log(`Store: Updated data for ${String(stepKey)}`, get().convenioData);

    // --- Validar y actualizar estado del paso DESPUÉS de actualizar datos ---
    const { currentStep, convenioData } = get();
    let isValid = false;
    // Validar específicamente para el paso actual basado en el stepKey (asumiendo que stepKey se relaciona con el paso)
    if (stepKey === 'datosBasicos' && currentStep === 1) {
        isValid = DatosBasicosSchema.safeParse(convenioData.datosBasicos).success;
    }
    // TODO: Añadir lógica de validación para otros stepKeys/pasos
    // else if (stepKey === 'partes' && currentStep === 2) { ... }

    get().setStepValidity(currentStep, isValid, true); // Marcar como tocado al actualizar
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
    // Optimizado: Log solo si el estado cambia
    // console.log(`Store: Step ${step} validity set to ${isValid}, touched: ${isTouched}`);
  },

  goToStep: (stepNumber) => {
    console.log(`[Store goToStep] Attempting to move to step: ${stepNumber}`); // Log inicial
    const currentState = get();
    console.log(`[Store goToStep] Current state: step=${currentState.currentStep}, stepStates=`, JSON.parse(JSON.stringify(currentState.stepStates))); // Log estado actual
    
    // Corregir cálculo de maxSteps para asegurar que funciona incluso si las claves no son números (aunque deberían serlo)
    const stepKeys = Object.keys(currentState.stepStates).map(k => parseInt(k, 10)).filter(k => !isNaN(k));
    const maxSteps = stepKeys.length > 0 ? Math.max(...stepKeys) : 0;
    console.log(`[Store goToStep] Calculated maxSteps: ${maxSteps}`); // Log maxSteps

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
            if (currentStepValidated) {
                console.log(`[Store goToStep] Moving forward from ${currentState.currentStep} to ${stepNumber}`);
                set({ currentStep: stepNumber });
            } else {
                console.warn(`[Store goToStep] Cannot move forward because step ${currentState.currentStep} is marked as invalid.`);
            }
            return; // Salir después de manejar avance
        }
        
        // ... (lógica opcional de saltar pasos)

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
    const stepsInForm = Array.from(new Set(formFields.map(f => f.step))); // Corregido: Usar Array.from
    let allStepsValid = true;
    for (const stepNum of stepsInForm) {
        if (!stepStates[stepNum]?.isValid) {
            allStepsValid = false;
            console.error(`Store: Cannot save, step ${stepNum} is invalid.`);
            // TODO: Informar al usuario, quizás navegar al primer paso inválido?
            // get().goToStep(stepNum); // Ojo, goToStep tiene su propia lógica de validación
            set({ currentStep: stepNum }); // Forzar navegación al paso inválido
            return;
        }
    }

    if (!allStepsValid) return; // Doble chequeo

    set({ isSaving: true });
    try {
      // Preparar payload final - Aquí podrías aplanar o transformar convenioData si la API espera algo diferente
      const payload: ConvenioData = {
          ...convenioData,
          id: convenioId ?? undefined, // Asegurar que id solo va si existe
          typeId: convenioTypeId! // Sabemos que typeId no será null aquí
          // status: 'borrador', // Podrías definir un estado aquí
      };
      // Eliminar propiedades que no queremos enviar directamente (si las hay)
      // delete payload.algunCampoInterno;

      console.log("Store: Final payload:", payload);

      let response;
      if (convenioId) {
        console.log(`Store: Calling API to UPDATE convenio ${convenioId}`);
        // response = await fetch(`/api/convenios/${convenioId}`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(payload)
        // });
        await new Promise(resolve => setTimeout(resolve, 100)); // Simular API
        response = { ok: true, json: async () => ({ ...payload, updatedAt: new Date().toISOString() }) }; // Simular respuesta ok
      } else {
        console.log("Store: Calling API to CREATE convenio");
        // response = await fetch('/api/convenios', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(payload)
        // });
         await new Promise(resolve => setTimeout(resolve, 100)); // Simular API
         const newId = Math.floor(Math.random() * 1000) + 1;
         response = { ok: true, status: 201, json: async () => ({ ...payload, id: newId, createdAt: new Date().toISOString() }) }; // Simular respuesta ok
      }

      if (!response.ok) {
          // const errorData = await response.json();
          // throw new Error(errorData.error || `Error ${response.status} al guardar`);
          throw new Error(`Error simulado ${response.status || ''} al guardar`);
      }

      const savedConvenio = await response.json();
      console.log("Store: Save successful. Response:", savedConvenio);

      // Actualizar estado con datos guardados (importante para modo edición)
      set({
          convenioData: savedConvenio,
          initialConvenioData: JSON.parse(JSON.stringify(savedConvenio)), // Actualizar base para cambios
          convenioId: savedConvenio.id, // Asegurar que tenemos el ID si era nuevo
          isSaving: false,
          // Podrías resetear stepStates o mantenerlos como válidos
      });

      // TODO: Mostrar notificación de éxito al usuario
      // TODO: Redirigir a la página del convenio editado/creado o al dashboard
      // Ejemplo: router.push(`/protected/convenio/${savedConvenio.id}`);

    } catch (error: any) {
      console.error("Error saving convenio:", error);
      set({ isSaving: false });
      // TODO: Mostrar error al usuario (usando el mensaje de error)
    } /* finally { // No necesitamos finally si el estado se maneja en éxito/error
      set({ isSaving: false });
    } */
  },

  reset: () => set(initialState), // Asegurar que reset también use el nuevo initialState
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