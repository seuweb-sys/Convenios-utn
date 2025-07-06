import { create } from 'zustand';
import { FieldDefinition } from '@/types/fieldDefinition';

// Tipo para el estado de cada paso
interface StepState {
  isValid: boolean;
  isTouched: boolean;
}

// Tipo básico de datos del convenio (será extendido dinámicamente)
interface ConvenioData {
  [key: string]: any;
}

// Estado inicial con estructura genérica para TODOS los tipos de convenio
const initialState: Omit<ConvenioMarcoState, 'initialize' | 'updateConvenioData' | 'setStepValidity' | 'goToStep' | 'saveConvenio' | 'reset'> = {
  convenioData: {
    // Estructura completamente flexible - se adaptará según el tipo de convenio
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
  // Datos del convenio - ahora completamente genérico para TODOS los tipos
  convenioData: Partial<ConvenioData> & {
    // Campos comunes
    id?: string;
    status?: string;
    title?: string;
    
    // Campos para Convenio Marco
    datosBasicos?: {
      nombre?: string;
      objeto?: string;
      fechaInicio?: string;
      fechaFin?: string;
    };
    partes?: Array<{
      tipo?: string;
      nombre?: string;
      domicilio?: string;
      cuit?: string;
      representanteNombre?: string;
      representanteDni?: string;
      cargoRepresentante?: string;
    }>;
    clausulas?: any[];
    
    // Campos para Convenio Particular de Práctica Supervisada
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
    practica_duracion?: string;
    facultad_docente_tutor_nombre?: string;
    fecha_firma?: string;
    practica_fecha_firma?: string;
    
    // Campos para Acuerdo de Colaboración
    entidad_nombre?: string;
    entidad_domicilio?: string;
    entidad_ciudad?: string;
    entidad_cuit?: string;
    entidad_representante?: string;
    entidad_dni?: string;
    entidad_cargo?: string;
    dia?: string;
    mes?: string;
    
    // Campos para Convenio Marco Práctica Supervisada
    entidad_tipo?: string;
    entidad_rubro?: string;
    representante_nombre?: string;
    representante_cargo?: string;
    representante_dni?: string;
    
    // Campos adicionales que pueden aparecer
    [key: string]: any;
  };
  initialConvenioData: Partial<ConvenioData> | null;
  convenioId: string | null;
  
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
  initialize: (convenioId?: string | number) => Promise<void>;
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
    set({ isLoading: true, isInitialized: false, convenioId: convenioId ? String(convenioId) : null });
    
    try {
      // Definición de campos genérica para todos los tipos de convenio
      const fetchedFields: FieldDefinition[] = [
        // Los campos específicos se definirán dinámicamente según el tipo de convenio
        // Por ahora, campos básicos que todos pueden tener
        { name: 'title', label: 'Título', type: 'text', required: true, step: 1 },
        { name: 'status', label: 'Estado', type: 'text', required: false, step: 1 }
      ];
      
      set({ formFields: fetchedFields });

      // Si hay convenioId, cargar los datos del convenio existente
      if (convenioId) {
        const response = await fetch(`/api/convenios/${convenioId}`);
        if (!response.ok) throw new Error('Error al cargar el convenio');
        const loadedData = await response.json();
        
        console.log('Raw data from API:', loadedData);
        
        // Priorizar form_data, luego content_data
        const sourceData = loadedData.form_data || loadedData.content_data || {};
        
        console.log('Source data from API:', sourceData);
        
        // Mapeo genérico que funciona para TODOS los tipos de convenio
        let mappedData: any = {};
        
        // Mapeo genérico que funciona para TODOS los tipos de convenio
        mappedData = {
          id: loadedData.id,
          status: loadedData.status,
          title: loadedData.title,
          // Copiar todos los campos directamente desde sourceData
          ...sourceData,
          // Asegurar campos específicos por tipo
        };
        
        // Mapeo específico para Acuerdo de Colaboración
        if (sourceData.entidad_nombre && !sourceData.empresa_nombre) {
          mappedData = {
            ...mappedData,
            entidad_nombre: sourceData.entidad_nombre,
            entidad_domicilio: sourceData.entidad_domicilio,
            entidad_ciudad: sourceData.entidad_ciudad,
            entidad_cuit: sourceData.entidad_cuit,
            entidad_representante: sourceData.entidad_representante,
            entidad_dni: sourceData.entidad_dni,
            entidad_cargo: sourceData.entidad_cargo,
            dia: sourceData.dia,
            mes: sourceData.mes,
          };
        }
        
        // Mapeo específico para Convenio Particular
        if (sourceData.empresa_nombre || sourceData.alumno_nombre) {
          mappedData = {
            ...mappedData,
            empresa_nombre: sourceData.empresa_nombre,
            empresa_cuit: sourceData.empresa_cuit,
            empresa_representante_nombre: sourceData.empresa_representante_nombre,
            empresa_representante_caracter: sourceData.empresa_representante_caracter,
            empresa_direccion_calle: sourceData.empresa_direccion_calle,
            empresa_direccion_ciudad: sourceData.empresa_direccion_ciudad,
            empresa_tutor_nombre: sourceData.empresa_tutor_nombre,
            alumno_carrera: sourceData.alumno_carrera,
            alumno_nombre: sourceData.alumno_nombre,
            alumno_dni: sourceData.alumno_dni,
            alumno_legajo: sourceData.alumno_legajo,
            fecha_inicio: sourceData.fecha_inicio,
            fecha_fin: sourceData.fecha_fin,
            practica_tematica: sourceData.practica_tematica,
            practica_duracion: sourceData.practica_duracion,
            facultad_docente_tutor_nombre: sourceData.facultad_docente_tutor_nombre,
            fecha_firma: sourceData.fecha_firma || sourceData.practica_fecha_firma,
            practica_fecha_firma: sourceData.practica_fecha_firma || sourceData.fecha_firma,
            dia: sourceData.dia,
            mes: sourceData.mes,
          };
        }
        
        // Mapeo específico para Convenio Marco Práctica Supervisada
        if (sourceData.entidad_nombre && sourceData.entidad_rubro) {
          mappedData = {
            ...mappedData,
            entidad_nombre: sourceData.entidad_nombre,
            entidad_tipo: sourceData.entidad_tipo,
            entidad_domicilio: sourceData.entidad_domicilio,
            entidad_ciudad: sourceData.entidad_ciudad,
            entidad_cuit: sourceData.entidad_cuit,
            entidad_rubro: sourceData.entidad_rubro,
            // Mapear correctamente los campos del representante desde la BD
            representante_nombre: sourceData.entidad_representante,
            representante_cargo: sourceData.entidad_cargo,
            representante_dni: sourceData.entidad_dni,
            dia: sourceData.dia,
            mes: sourceData.mes,
          };
        }
        
        // Mapeo para Convenio Marco y otros tipos tradicionales
        if (sourceData.datosBasicos || sourceData.datos_basicos) {
          mappedData = {
            ...mappedData,
            datosBasicos: sourceData.datosBasicos || sourceData.datos_basicos || {},
            partes: sourceData.partes || [],
            clausulas: sourceData.clausulas || []
          };
        }
        
        console.log('Mapped data for store:', mappedData);
        
        // Asegurar estructura de datos completa con valores por defecto seguros
        const initialDataWithDefaults = {
          ...mappedData
        };

        set({ 
          convenioData: initialDataWithDefaults,
          initialConvenioData: JSON.parse(JSON.stringify(initialDataWithDefaults))
        });
      }

      // Inicializar estados de pasos de forma genérica
      const steps = [1, 2, 3, 4]; // Máximo 4 pasos para cualquier convenio
      const initialStepStates: Record<number, StepState> = {};
      
      for (const stepNum of steps) {
        // Por ahora, marcar como válidos si hay datos cargados
        const isStepInitiallyValid = !!convenioId && Object.keys(get().convenioData).length > 0;
        
        initialStepStates[stepNum] = { 
          isValid: isStepInitiallyValid, 
          isTouched: !!convenioId 
        };
      }
      
      set({ 
        stepStates: initialStepStates, 
        isLoading: false, 
        isInitialized: true 
      });

    } catch (error) {
      console.error("Error initializing store:", error);
      set({ isLoading: false, isInitialized: false });
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

    // Validación genérica basada en si hay datos en la sección actualizada
    const { currentStep, convenioData } = get();
    const hasRelevantData = section === 'all' || Object.keys(data).length > 0;
    
    get().setStepValidity(currentStep, hasRelevantData, true);
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
    const maxSteps = 4; // Máximo 4 pasos para cualquier convenio

    if (stepNumber > 0 && stepNumber <= maxSteps) {
      set({ currentStep: stepNumber });
    }
  },

  saveConvenio: async () => {
    const { convenioData, convenioId, stepStates } = get();
    
    // Validación genérica - verificar que al menos tengamos algunos datos
    const hasData = Object.keys(convenioData).length > 0;
    if (!hasData) {
      throw new Error('No hay datos para guardar');
    }

    set({ isSaving: true });
    try {
      const payload = {
        title: convenioData.title || convenioData.empresa_nombre || convenioData.entidad_nombre || "Sin título",
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