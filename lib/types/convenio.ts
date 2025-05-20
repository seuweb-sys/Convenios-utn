// Estados posibles de un convenio
export type ConvenioStatus = 'borrador' | 'enviado' | 'revision' | 'aprobado' | 'rechazado' | 'archivado'

// Tipos de convenios disponibles
export interface ConvenioType {
  id: number
  name: string
  description: string
  template_content: Record<string, any>
  fields: Record<string, any>
  active: boolean
  created_at: string
  updated_at: string
  created_by: string
}

// Estructura básica de un convenio
export interface Convenio {
  id: string
  serial_number: string
  title: string
  convenio_type_id: number
  status: ConvenioStatus
  content_data: Record<string, any>
  user_id: string
  reviewer_id: string | null
  created_at: string
  updated_at: string
  submitted_at: string | null
  approved_at: string | null
  archived_at: string | null
  document_path: string | null
}

// Datos necesarios para crear un nuevo convenio
export interface CreateConvenioDTO {
  title: string
  convenio_type_id: number
  content_data: Record<string, any>
}

// Datos que se pueden actualizar en un convenio
export interface UpdateConvenioDTO {
  title?: string
  content_data?: Record<string, any>
  status?: ConvenioStatus
  reviewer_id?: string
}

// Campos comunes para todos los convenios
interface BaseConvenioContent {
  titulo: string
  duracion: string
  fecha_inicio: string
  fecha_fin: string
  objetivos: string[]
  responsables: {
    nombre: string
    cargo: string
    contacto: string
  }[]
}

// Campos específicos para cada tipo
interface ConvenioPracticasContent extends BaseConvenioContent {
  empresa: string
  cantidad_practicantes: number
  area: string
  requisitos: string[]
}

interface ConvenioMarcoContent extends BaseConvenioContent {
  institucion: string
  areas: string[]
  alcance: string
}

interface ConvenioInvestigacionContent extends BaseConvenioContent {
  institucion: string
  proyecto: string
  presupuesto: number
  investigadores: {
    nombre: string
    institucion: string
    rol: string
  }[]
}

interface ConvenioExtensionContent extends BaseConvenioContent {
  organizacion: string
  proyecto: string
  beneficiarios: string
  actividades: string[]
}

// Unión de todos los tipos de contenido
export type ConvenioContent = 
  | ConvenioPracticasContent 
  | ConvenioMarcoContent 
  | ConvenioInvestigacionContent 
  | ConvenioExtensionContent

export interface ConvenioWithRelations extends Convenio {
  type: ConvenioType
  user: {
    id: string
    full_name: string | null
    email: string
  }
  reviewer?: {
    id: string
    full_name: string | null
    email: string
  } | null
}

interface ConvenioTemplate {
  title: string;
  subtitle: string;
  partes: string[];
  considerandos: string[];
  clausulas: {
    titulo: string;
    contenido: string;
  }[];
  cierre: string;
}

interface CampoRequerido {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number';
  required: boolean;
} 