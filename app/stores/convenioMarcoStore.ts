import { create } from 'zustand';
import { ConvenioMarcoData } from '@/lib/types/convenio-marco';

interface ConvenioMarcoState {
  convenioData: ConvenioMarcoData;
  currentStep: number;
  updateConvenioData: <K extends keyof ConvenioMarcoData>(
    section: K,
    data: ConvenioMarcoData[K]
  ) => void;
  setCurrentStep: (step: number) => void;
  resetStore: () => void;
}

const initialState: ConvenioMarcoData = {
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
};

export const useConvenioMarcoStore = create<ConvenioMarcoState>((set) => ({
  convenioData: initialState,
  currentStep: 0,
  updateConvenioData: (section, data) =>
    set((state) => ({
      convenioData: {
        ...state.convenioData,
        [section]: data
      }
    })),
  setCurrentStep: (step) => set({ currentStep: step }),
  resetStore: () => set({ convenioData: initialState, currentStep: 0 })
})); 