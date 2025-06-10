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

export type ConvenioColor = "blue" | "green" | "amber" | "purple" | "rose" | "cyan" | "orange" | "red";

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
  
  // Mapeo específico por nombre exacto primero
  if (type === "convenio marco") {
    return "blue";
  } else if (type === "convenio marco práctica supervisada" || type === "convenio marco practica supervisada") {
    return "purple";
  } else if (type === "convenio específico" || type === "convenio especifico") {
    return "orange";
  } else if (type === "convenio particular de práctica supervisada" || type === "convenio particular de practica supervisada") {
    return "green";
  } else if (type === "acuerdo de colaboración" || type === "acuerdo de colaboracion") {
    return "red";
  }
  
  // Fallback por palabras clave
  if (type.includes("marco")) {
    return "blue";
  } else if (type.includes("práctica") || type.includes("practica") || type.includes("pasantía") || type.includes("pasantia")) {
    return "green";
  } else if (type.includes("específico") || type.includes("especifico")) {
    return "orange";
  } else if (type.includes("académico") || type.includes("academico") || type.includes("educativo")) {
    return "purple";
  } else if (type.includes("colaboración") || type.includes("colaboracion")) {
    return "red";
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
export function getIconByName(iconName: string | undefined | null): ReactNode {
  const iconProps = { className: "h-4 w-4" }; // Propiedades comunes para los iconos

  // Manejar valores nulos, undefined o vacíos
  if (!iconName || iconName.trim() === "") {
    return <InfoIcon {...iconProps} />;
  }

  switch (iconName.toLowerCase().trim()) {
    case "file":
    case "info": 
      return <FileTextIcon {...iconProps} />;
    case "clock":
    case "created":
    case "nuevo":
      return <ClockIcon {...iconProps} />;
    case "check":
    case "aceptado":
    case "finalizado":
      return <CheckIcon {...iconProps} />;
    case "alert-circle":
    case "warning":
    case "observado":
      return <AlertCircleIcon {...iconProps} />;
    case "file-plus":
    case "create":
      return <FilePlusIcon {...iconProps} />;
    case "edit":
    case "update":
      return <EditIcon {...iconProps} />;
    // Mapeo para convenio types
    case "marco":
      return <BuildingIcon {...iconProps} />;
    case "graduation-cap":
    case "practicas":
      return <UsersIcon {...iconProps} />;
    case "especifico":
      return <ClipboardCheckIcon {...iconProps} />;
    case "colaboracion":
      return <HeartHandshakeIcon {...iconProps} />;
    default:
      // No mostrar warning si es un icono específico que no necesitamos mapear
      if (!["undefined", "null", ""].includes(iconName.toLowerCase())) {
        console.warn(`Icono no encontrado para el nombre: ${iconName}`);
      }
      return <InfoIcon {...iconProps} />; // Icono por defecto si no se encuentra
  }
} 