import { BuildingIcon, UserIcon, CalendarIcon, FileTextIcon } from "lucide-react";
import { ConvenioMarcoForm } from '@/app/components/forms/convenio-marco/ConvenioMarcoForm';
import ConvenioPracticaMarcoForm from '@/app/components/forms/convenio-practica-marco/ConvenioPracticaMarcoForm';
import ConvenioEspecificoForm from '@/app/components/forms/convenio-especifico/ConvenioEspecificoForm';
import ConvenioParticularForm from '@/app/components/forms/convenio-particular/ConvenioParticularForm';
import AcuerdoColaboracionForm from '@/app/components/forms/acuerdo-colaboracion/AcuerdoColaboracionForm';

export const convenioConfigs = {
  marco: {
    title: "Nuevo Convenio Marco",
    description: "Completá la información del convenio marco paso a paso",
    steps: [
      {
        id: 1,
        title: "Datos de la Entidad",
        description: "Información básica de la entidad",
        icon: <BuildingIcon className="h-5 w-5" />
      },
      {
        id: 2,
        title: "Datos del Representante",
        description: "Información del representante legal",
        icon: <UserIcon className="h-5 w-5" />
      },
      {
        id: 3,
        title: "Fechas del Convenio",
        description: "Vigencia y plazos",
        icon: <CalendarIcon className="h-5 w-5" />
      },
      {
        id: 4,
        title: "Revisión",
        description: "Revisá y enviá tu convenio",
        icon: <FileTextIcon className="h-5 w-5" />
      }
    ],
    FormComponent: ConvenioMarcoForm
  },

  'practica-marco': {
    title: "Nuevo Convenio Marco Práctica Supervisada",
    description: "Completá la información del convenio de práctica supervisada paso a paso",
    steps: [
      {
        id: 1,
        title: "Datos de la Entidad",
        description: "Información básica de la entidad",
        icon: <BuildingIcon className="h-5 w-5" />
      },
      {
        id: 2,
        title: "Datos del Representante",
        description: "Información del representante legal",
        icon: <UserIcon className="h-5 w-5" />
      },
      {
        id: 3,
        title: "Fechas del Convenio",
        description: "Vigencia y plazos",
        icon: <CalendarIcon className="h-5 w-5" />
      },
      {
        id: 4,
        title: "Revisión",
        description: "Revisá y enviá tu convenio",
        icon: <FileTextIcon className="h-5 w-5" />
      }
    ],
    FormComponent: ConvenioPracticaMarcoForm
  },

  especifico: {
    title: "Nuevo Convenio Específico",
    description: "Completá la información del convenio específico paso a paso",
    steps: [
      {
        id: 1,
        title: "Datos de la Entidad",
        description: "Información básica de la entidad",
        icon: <BuildingIcon className="h-5 w-5" />
      },
      {
        id: 2,
        title: "Datos del Representante",
        description: "Información del representante legal",
        icon: <UserIcon className="h-5 w-5" />
      },
      {
        id: 3,
        title: "Detalles del Convenio",
        description: "Información específica del convenio",
        icon: <CalendarIcon className="h-5 w-5" />
      },
      {
        id: 4,
        title: "Revisión",
        description: "Revisá y enviá tu convenio",
        icon: <FileTextIcon className="h-5 w-5" />
      }
    ],
    FormComponent: ConvenioEspecificoForm
  },

  particular: {
    title: "Nuevo Convenio Particular de Práctica Supervisada",
    description: "Completá la información del convenio particular paso a paso",
    steps: [
      {
        id: 1,
        title: "Datos de la Empresa",
        description: "Información de la empresa",
        icon: <BuildingIcon className="h-5 w-5" />
      },
      {
        id: 2,
        title: "Datos del Alumno",
        description: "Información del estudiante",
        icon: <UserIcon className="h-5 w-5" />
      },
      {
        id: 3,
        title: "Detalles de la Práctica",
        description: "Información de la práctica supervisada",
        icon: <CalendarIcon className="h-5 w-5" />
      },
      {
        id: 4,
        title: "Revisión",
        description: "Revisá y enviá tu convenio",
        icon: <FileTextIcon className="h-5 w-5" />
      }
    ],
    FormComponent: ConvenioParticularForm
  },

  acuerdo: {
    title: "Nuevo Acuerdo de Colaboración",
    description: "Completá la información del acuerdo de colaboración paso a paso",
    steps: [
      {
        id: 1,
        title: "Datos de la Entidad",
        description: "Información de la entidad",
        icon: <BuildingIcon className="h-5 w-5" />
      },
      {
        id: 2,
        title: "Datos del Representante",
        description: "Información del representante legal",
        icon: <UserIcon className="h-5 w-5" />
      },
      {
        id: 3,
        title: "Datos de Firma",
        description: "Fecha de firma del acuerdo",
        icon: <CalendarIcon className="h-5 w-5" />
      },
      {
        id: 4,
        title: "Revisión",
        description: "Revisá y enviá tu acuerdo",
        icon: <FileTextIcon className="h-5 w-5" />
      }
    ],
    FormComponent: AcuerdoColaboracionForm
  }
}; 