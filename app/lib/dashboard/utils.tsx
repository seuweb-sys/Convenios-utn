import { ReactNode } from "react";
import { 
  BuildingIcon, 
  UsersIcon, 
  ClipboardCheckIcon,
  FileTextIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  ClockIcon,
  CheckIcon,
  AlertCircleIcon,
  FilePlusIcon,
  EditIcon,
  InfoIcon
} from "lucide-react";

export type ConvenioColor = "blue" | "green" | "amber" | "purple" | "rose" | "cyan";

/**
 * Asigna un icono según el tipo de convenio
 */
export function getIconForType(typeName: string): ReactNode {
  // Convertimos a minúsculas y eliminamos espacios para facilitar comparación
  const type = typeName.toLowerCase().trim();
  
  if (type.includes("marco")) {
    return <BuildingIcon className="h-5 w-5" />;
  } else if (type.includes("práctica") || type.includes("practica") || type.includes("pasantía") || type.includes("pasantia")) {
    return <UsersIcon className="h-5 w-5" />;
  } else if (type.includes("específico") || type.includes("especifico")) {
    return <ClipboardCheckIcon className="h-5 w-5" />;
  } else if (type.includes("académico") || type.includes("academico") || type.includes("educativo")) {
    return <GraduationCapIcon className="h-5 w-5" />;
  } else if (type.includes("colaboración") || type.includes("colaboracion")) {
    return <HeartHandshakeIcon className="h-5 w-5" />;
  }
  
  // Icono predeterminado para cualquier otro tipo
  return <FileTextIcon className="h-5 w-5" />;
}

/**
 * Asigna un color según el tipo de convenio
 */
export function getColorForType(typeName: string): ConvenioColor {
  const type = typeName.toLowerCase().trim();
  
  if (type.includes("marco")) {
    return "blue";
  } else if (type.includes("práctica") || type.includes("practica") || type.includes("pasantía") || type.includes("pasantia")) {
    return "green";
  } else if (type.includes("específico") || type.includes("especifico")) {
    return "amber";
  } else if (type.includes("académico") || type.includes("academico") || type.includes("educativo")) {
    return "purple";
  } else if (type.includes("colaboración") || type.includes("colaboracion")) {
    return "rose";
  }
  
  // Color predeterminado para cualquier otro tipo
  return "cyan";
}

/**
 * Formatea una fecha para mostrar hace cuánto tiempo ocurrió
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "Hace un momento";
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
  }
  
  if (diffInDays < 30) {
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `Hace ${diffInWeeks} semana${diffInWeeks !== 1 ? 's' : ''}`;
  }
  
  // Para fechas más antiguas, mostramos la fecha exacta
  return date.toLocaleDateString('es-AR');
}

/**
 * Devuelve el componente de icono React correspondiente a un nombre.
 * @param iconName - El nombre del icono (ej: 'file', 'check').
 * @returns El componente ReactNode del icono o un icono por defecto.
 */
export function getIconByName(iconName: string): ReactNode {
  const iconProps = { className: "h-4 w-4" }; // Propiedades comunes para los iconos

  switch (iconName?.toLowerCase()) {
    case "file":
    case "info": // Agrupamos info con file por defecto
      return <FileTextIcon {...iconProps} />;
    case "clock":
      return <ClockIcon {...iconProps} />;
    case "check":
      return <CheckIcon {...iconProps} />;
    case "alert-circle":
      return <AlertCircleIcon {...iconProps} />;
    case "file-plus": // Icono para 'create'
      return <FilePlusIcon {...iconProps} />;
    case "edit": // Icono para 'update'
      return <EditIcon {...iconProps} />;
    // Añade más casos según los iconName definidos en la API de actividad
    default:
      console.warn(`Icono no encontrado para el nombre: ${iconName}`);
      return <InfoIcon {...iconProps} />; // Icono por defecto si no se encuentra
  }
} 