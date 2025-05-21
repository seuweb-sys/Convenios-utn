import { create } from 'zustand';
import { ConvenioMarcoData, validateConvenioMarco } from '@/lib/types/convenio-marco';

interface StepState {
  isValid: boolean;
  isTouched: boolean;
}

interface ConvenioMarcoState {
  // Datos del convenio
  convenioData: Partial<ConvenioMarcoData>;
  initialConvenioData: Partial<ConvenioMarcoData> | null;
  
  // Estado de navegación
  currentStep: number;
  stepStates: Record<number, StepState>;
  
  // Estado de UI
  isLoading: boolean;
  isSaving: boolean;
  isInitialized: boolean;
  
  // Acciones
  initialize: (convenioId?: number) => Promise<void>;
  updateConvenioData: (section: keyof ConvenioMarcoData, data: any) => void;
  setStepValidity: (step: number, isValid: boolean, isTouched?: boolean) => void;
  goToStep: (stepNumber: number) => void;
  saveConvenio: () => Promise<void>;
  reset: () => void;
}

// Estado inicial
const initialState: Omit<ConvenioMarcoState, 'initialize' | 'updateConvenioData' | 'setStepValidity' | 'goToStep' | 'saveConvenio' | 'reset'> = {
  convenioData: {
    entidad: {
      nombre: '',
      tipo: '',
      domicilio: '',
      ciudad: '',
      cuit: ''
    },
    representante: {
      nombre: '',
      dni: '',
      cargo: ''
    },
    fechas: {
      dia: '',
      mes: ''
    }
  },
  initialConvenioData: null,
  currentStep: 1,
  stepStates: {},
  isLoading: false,
  isSaving: false,
  isInitialized: false
};

// Crear el store
export const useConvenioMarcoStore = create<ConvenioMarcoState>((set, get) => ({
  ...initialState,

  initialize: async (convenioId) => {
    set({ isLoading: true });
    try {
      if (convenioId) {
        // Cargar datos existentes
        const response = await fetch(`/api/convenios/${convenioId}`);
        if (!response.ok) throw new Error('Error al cargar el convenio');
        const data = await response.json();
        
        set({
          convenioData: data,
          initialConvenioData: data,
          isInitialized: true
        });
      } else {
        // Inicializar con datos vacíos
        set({
          convenioData: initialState.convenioData,
          initialConvenioData: null,
          isInitialized: true
        });
      }

      // Inicializar estados de pasos
      const initialStepStates: Record<number, StepState> = {
        1: { isValid: false, isTouched: false },
        2: { isValid: false, isTouched: false },
        3: { isValid: false, isTouched: false },
        4: { isValid: false, isTouched: false }
      };
      set({ stepStates: initialStepStates });

    } catch (error) {
      console.error('Error initializing convenio store:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateConvenioData: (section, data) => {
    set((state) => ({
      convenioData: {
        ...state.convenioData,
        [section]: data
      }
    }));

    // Validar el paso actual
    const { currentStep, convenioData } = get();
    const validation = validateConvenioMarco(convenioData as ConvenioMarcoData);
    get().setStepValidity(currentStep, validation.valid, true);
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
    set({ currentStep: stepNumber });
  },

  saveConvenio: async () => {
    set({ isSaving: true });
    try {
      const { convenioData } = get();
      const validation = validateConvenioMarco(convenioData as ConvenioMarcoData);
      
      if (!validation.valid) {
        throw new Error('El convenio no es válido');
      }

      // Aquí iría la lógica para guardar en la API
      console.log('Guardando convenio:', convenioData);
      
    } catch (error) {
      console.error('Error saving convenio:', error);
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  reset: () => set(initialState)
})); 