import { create } from 'zustand';
import { ConvenioData, ParteData, validateDatosBasicos, validateParte, validateClausulas } from '@/types/convenio';
import { FieldDefinition } from '@/types/fieldDefinition';

interface StepState {
  isValid: boolean;
  isTouched: boolean;
}

// Estado inicial con estructura específica para convenio marco
const initialState: Omit<ConvenioMarcoState, 'initialize' | 'updateConvenioData' | 'setStepValidity' | 'goToStep' | 'saveConvenio' | 'reset'> = {
  convenioData: {
    datosBasicos: {
      nombre: '',
      objeto: '',
      fechaInicio: '',
      fechaFin: ''
    },
    partes: [{
      tipo: 'empresa',
      nombre: '',
      domicilio: '',
      cuit: '',
      representanteNombre: '',
      representanteDni: '',
      cargoRepresentante: ''
    }],
    clausulas: []
  },
  initialConvenioData: null,
  convenioId: null,
  currentStep: 1,
  stepStates: {},
  formFields: [],
  isLoading: false,
  isSaving: false,
  isInitialized: false,
  updateLogTimestamp: undefined
};

interface ConvenioMarcoState {
  // Datos del convenio
  convenioData: Partial<ConvenioData> & {
    // Campos específicos para convenio particular
    empresa_nombre?: string;
    empresa_cuit?: string;
    empresa_representante_nombre?: string;
    empresa_representante_caracter?: string;
    empresa_direccion_calle?: string;
    empresa_direccion_ciudad?: string;
    empresa_tutor_nombre?: string;
    alumno_carrera?: string;
    alumno_nombre?: string;
    alumno_dni?: string;
    alumno_legajo?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    practica_tematica?: string;
    facultad_docente_tutor_nombre?: string;
    fecha_firma?: string;
    // Campos específicos para acuerdo de colaboración
    entidad_nombre?: string;
    entidad_domicilio?: string;
    entidad_ciudad?: string;
    entidad_cuit?: string;
    entidad_representante?: string;
    entidad_dni?: string;
    entidad_cargo?: string;
    dia?: string;
    mes?: string;
  };
  initialConvenioData: Partial<ConvenioData> | null;
  convenioId: number | null;
  
  // Estado de navegación y formulario
  currentStep: number;
  stepStates: Record<number, StepState>;
  formFields: FieldDefinition[];
  
  // Estado de UI
  isLoading: boolean;
  isSaving: boolean;
  isInitialized: boolean;
  updateLogTimestamp?: number;
  
  // Acciones
  initialize: (convenioId?: number) => Promise<void>;
  updateConvenioData: (section: keyof ConvenioData | string, data: any) => void;
  setStepValidity: (step: number, isValid: boolean, isTouched?: boolean) => void;
  goToStep: (stepNumber: number) => void;
  saveConvenio: () => Promise<void>;
  reset: () => void;
}

// Crear el store
export const useConvenioMarcoStore = create<ConvenioMarcoState>((set, get) => ({
  ...initialState,

  initialize: async (convenioId) => {
    set({ isLoading: true, isInitialized: false, convenioId: convenioId ?? null });
    
    try {
      // Definición de campos específicos para convenio marco
      const fetchedFields: FieldDefinition[] = [
        // Paso 1: Datos Básicos
        { name: 'nombre', label: 'Nombre del Convenio', type: 'text', required: true, step: 1 },
        { name: 'objeto', label: 'Objeto', type: 'textarea', required: true, step: 1 },
        { name: 'fechaInicio', label: 'Fecha de Inicio', type: 'date', required: true, step: 1 },
        { name: 'fechaFin', label: 'Fecha de Fin', type: 'date', required: true, step: 1 },
        
        // Paso 2: Partes del Convenio
        { name: 'tipo', label: 'Tipo de Entidad', type: 'select', required: true, step: 2 },
        { name: 'nombre', label: 'Nombre de la Entidad', type: 'text', required: true, step: 2 },
        { name: 'domicilio', label: 'Domicilio', type: 'text', required: true, step: 2 },
        { name: 'cuit', label: 'CUIT', type: 'text', required: false, step: 2 },
        { name: 'representanteNombre', label: 'Nombre del Representante', type: 'text', required: true, step: 2 },
        { name: 'representanteDni', label: 'DNI del Representante', type: 'text', required: false, step: 2 },
        { name: 'cargoRepresentante', label: 'Cargo del Representante', type: 'text', required: true, step: 2 },
        
        // Paso 3: Cláusulas
        { name: 'clausulas', label: 'Cláusulas del Convenio', type: 'textarea', required: true, step: 3 }
      ];
      
      set({ formFields: fetchedFields });

      if (convenioId) {
        const response = await fetch(`/api/convenios/${convenioId}`);
        if (!response.ok) throw new Error('Error al cargar el convenio');
        const loadedData = await response.json();
        
        // Asegurar estructura de datos completa
        const initialDataWithDefaults = {
          ...initialState.convenioData,
          ...loadedData,
          clausulas: loadedData.clausulas ?? []
        };

        set({ 
          convenioData: initialDataWithDefaults,
          initialConvenioData: JSON.parse(JSON.stringify(initialDataWithDefaults))
        });
      }

      // Inicializar estados de pasos
      const steps = [1, 2, 3]; // Convenio Marco tiene 3 pasos
      const initialStepStates: Record<number, StepState> = {};
      
      for (const stepNum of steps) {
        let isStepInitiallyValid = false;
        
        if (convenioId && get().convenioData) {
          const data = get().convenioData;
          switch(stepNum) {
            case 1:
              isStepInitiallyValid = validateDatosBasicos(data.datosBasicos).valid;
              break;
            case 2:
              // Validar la primera parte (empresa)
              isStepInitiallyValid = data.partes && data.partes.length > 0 ? 
                validateParte(data.partes[0]).valid : false;
              break;
            case 3:
              isStepInitiallyValid = validateClausulas(data.clausulas).valid;
              break;
          }
        }
        
        initialStepStates[stepNum] = { 
          isValid: isStepInitiallyValid, 
          isTouched: !!convenioId 
        };
      }
      
      set({ 
        stepStates: initialStepStates,
        isInitialized: true 
      });

    } catch (error) {
      console.error('Error initializing convenio marco store:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateConvenioData: (section, data) => {
    set((state) => {
      let newData = data;
      let newConvenioData = { ...state.convenioData };
      // Si la sección es 'all', reemplaza todo el convenioData y asegura id y status
      if (section === 'all') {
        newConvenioData = { ...data };
        if (data.id) newConvenioData.id = data.id;
        if (data.status || data.estado) newConvenioData.status = data.status || data.estado;
        return {
          convenioData: newConvenioData,
          updateLogTimestamp: Date.now(),
        };
      }
      // Si la sección es 'partes', solo actualiza partes
      if (section === 'partes') {
        newData = Array.isArray(data) ? data.map(item => ({ ...item })) : [{ ...data }];
        return {
          convenioData: {
            ...state.convenioData,
            partes: newData,
          },
          updateLogTimestamp: Date.now(),
        };
      }
      // Si la sección es 'datosBasicos', solo actualiza datosBasicos
      if (section === 'datosBasicos') {
        newData = { ...data };
        return {
          convenioData: {
            ...state.convenioData,
            datosBasicos: newData,
          },
          updateLogTimestamp: Date.now(),
        };
      }
      // Para cualquier otra sección, comportamiento por defecto
      if (Array.isArray(data)) {
        newData = data.map(item => typeof item === 'object' ? { ...item } : item);
      } else if (typeof data === 'object' && data !== null) {
        newData = { ...data };
      }
      return {
        convenioData: {
          ...state.convenioData,
          [section]: newData,
        },
        updateLogTimestamp: Date.now(),
      };
    });

    const { currentStep, convenioData } = get();
    let isValid = false;

    // Validar según el paso actual
    switch(currentStep) {
      case 1:
        isValid = validateDatosBasicos(convenioData.datosBasicos).valid;
        break;
      case 2:
        // Validar la primera parte (empresa)
        isValid = convenioData.partes && convenioData.partes.length > 0 ? 
          validateParte(convenioData.partes[0]).valid : false;
        break;
      case 3:
        isValid = validateClausulas(convenioData.clausulas).valid;
        break;
    }

    get().setStepValidity(currentStep, isValid, true);
  },

  setStepValidity: (step, isValid, isTouched = true) => {
    set((state) => ({
      stepStates: {
        ...state.stepStates,
        [step]: { isValid, isTouched }
      }
    }));
  },

  goToStep: (stepNumber) => {
    const currentState = get();
    const maxSteps = 3; // Convenio Marco tiene 3 pasos

    if (stepNumber > 0 && stepNumber <= maxSteps) {
      // Permitir ir a pasos anteriores
      if (stepNumber < currentState.currentStep) {
        set({ currentStep: stepNumber });
        return;
      }
      
      // Permitir ir al siguiente paso solo si el actual es válido
      if (stepNumber === currentState.currentStep + 1) {
        const currentStepValidated = currentState.stepStates[currentState.currentStep]?.isValid || false;
        
        if (currentStepValidated) {
          set({ currentStep: stepNumber });
        }
      }
    }
  },

  saveConvenio: async () => {
    const { convenioData, convenioId, stepStates } = get();
    
    // Validar todos los pasos
    for (let step = 1; step <= 3; step++) {
      if (!stepStates[step]?.isValid) {
        set({ currentStep: step });
        throw new Error(`El paso ${step} no es válido`);
      }
    }

    set({ isSaving: true });
    try {
      const payload = {
        title: convenioData.datosBasicos?.nombre || "Sin título",
        content_data: convenioData
      };

      const url = convenioId 
        ? `/api/convenios/${convenioId}`
        : "/api/convenios";
      
      const response = await fetch(url, {
        method: convenioId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar el convenio");
      }

      const savedConvenio = await response.json();
      
      set({
        convenioData: savedConvenio,
        initialConvenioData: JSON.parse(JSON.stringify(savedConvenio)),
        convenioId: savedConvenio.id,
        isSaving: false
      });

    } catch (error) {
      console.error("Error saving convenio:", error);
      set({ isSaving: false });
      throw error;
    }
  },

  reset: () => set(initialState)
}));

// Selector para obtener campos planos
export function getFieldsFromStore(convenioData: Partial<ConvenioData>): Record<string, any> {
  const fields: Record<string, any> = {};
  
  // Datos Básicos
  if (convenioData.datosBasicos) {
    Object.entries(convenioData.datosBasicos).forEach(([key, value]) => {
      fields[`datosBasicos.${key}`] = value;
    });
  }
  
  // Partes (solo la primera parte para convenio marco)
  if (convenioData.partes && convenioData.partes.length > 0) {
    const parte = convenioData.partes[0];
    Object.entries(parte).forEach(([key, value]) => {
      fields[`partes.${key}`] = value;
    });
  }
  
  // Cláusulas
  fields.clausulas = convenioData.clausulas || [];
  
  return fields;
} 