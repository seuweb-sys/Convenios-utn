import { create } from 'zustand';
import { ConvenioMarcoData, ConvenioMarcoDB, fromDbFormat, toDbFormat } from '@/lib/types/convenio-marco';

interface ConvenioMarcoState {
  convenioData: ConvenioMarcoData;
  dbFormat: ConvenioMarcoDB;
  currentStep: number;
  updateConvenioData: <K extends keyof ConvenioMarcoData>(
    section: K,
    data: ConvenioMarcoData[K]
  ) => void;
  setCurrentStep: (step: number) => void;
  resetStore: () => void;
  getFormattedData: () => ConvenioMarcoDB;
  loadFromDB: (data: ConvenioMarcoDB) => void;
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
    cargo: '',
    dni: ''
  },
  fechas: {
    dia: '',
    mes: ''
  }
};

export const useConvenioMarcoStore = create<ConvenioMarcoState>((set, get) => ({
  convenioData: initialState,
  dbFormat: {
    entidad_nombre: '',
    entidad_tipo: '',
    entidad_domicilio: '',
    entidad_ciudad: '',
    entidad_cuit: '',
    entidad_representante: '',
    entidad_dni: '',
    entidad_cargo: '',
    dia: '',
    mes: ''
  },
  currentStep: 1,
  updateConvenioData: (section, data) =>
    set((state) => {
      const newState = {
        convenioData: {
          ...state.convenioData,
          [section]: data
        }
      };
      
      // Actualizar también el formato DB
      const dbFormat = toDbFormat(newState.convenioData);
      return {
        ...newState,
        dbFormat
      };
    }),
  setCurrentStep: (step) => set({ currentStep: step }),
  resetStore: () => set({ 
    convenioData: initialState,
    currentStep: 1,
    dbFormat: {
      entidad_nombre: '',
      entidad_tipo: '',
      entidad_domicilio: '',
      entidad_ciudad: '',
      entidad_cuit: '',
      entidad_representante: '',
      entidad_dni: '',
      entidad_cargo: '',
      dia: '',
      mes: ''
    }
  }),
  getFormattedData: () => toDbFormat(get().convenioData),
  loadFromDB: (data: ConvenioMarcoDB) => set({
    convenioData: fromDbFormat(data),
    dbFormat: data
  })
})); 