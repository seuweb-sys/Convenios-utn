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
import { resolveConvenioTypeIdByAlias } from "@/app/lib/convenios/type-normalization";

export type ConvenioColor = "blue" | "green" | "amber" | "purple" | "rose" | "cyan" | "orange" | "red";

/**
 * Asigna un icono según el tipo de convenio.
 * Resuelve primero por tipo canónico (id) a través del helper compartido, de
 * modo que "Convenio Marco Práctica Supervisada" (acento o no) reciba el icono
 * de práctica y no el de "marco" genérico. Mantiene fallback por palabras clave.
 */
export function getIconForType(typeName: string): ReactNode {
  // Convertimos a minúsculas y eliminamos espacios para facilitar comparación
  const type = typeName.toLowerCase().trim();
  const typeId = resolveConvenioTypeIdByAlias(typeName);

  if (typeId === 2) {
    return <BuildingIcon className="h-5 w-5" />;
  }
  // Marco PPS y Particular PPS comparten la misma key de icono (práctica).
  if (typeId === 1 || typeId === 5) {
    return <UsersIcon className="h-5 w-5" />;
  }
  if (typeId === 4) {
    return <ClipboardCheckIcon className="h-5 w-5" />;
  }
  if (typeId === 3) {
    return <HeartHandshakeIcon className="h-5 w-5" />;
  }
  if (typeId === 6) {
    return <FilePlusIcon className="h-5 w-5" />;
  }

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
  } else if (type.includes("adenda")) {
    return <FilePlusIcon className="h-5 w-5" />;
  }

  // Icono predeterminado para cualquier otro tipo
  return <FileTextIcon className="h-5 w-5" />;
}

/**
 * Asigna un color según el tipo de convenio.
 * Resuelve primero por tipo canónico (id) para que las variantes acento/no
 * acento colapsen a la misma clave de color antes del fallback por palabras.
 */
export function getColorForType(typeName: string): ConvenioColor {
  const type = typeName.toLowerCase().trim();
  const typeId = resolveConvenioTypeIdByAlias(typeName);

  if (typeId === 2) return "blue";
  if (typeId === 5) return "purple";
  if (typeId === 4) return "orange";
  if (typeId === 1) return "green";
  if (typeId === 3) return "red";
  if (typeId === 6) return "cyan";

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
  } else if (type.includes("adenda")) {
    return "cyan";
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
    case "adenda":
      return <FilePlusIcon {...iconProps} />;
    default:
      // No mostrar warning si es un icono específico que no necesitamos mapear
      if (!["undefined", "null", ""].includes(iconName.toLowerCase())) {
        console.warn(`Icono no encontrado para el nombre: ${iconName}`);
      }
      return <InfoIcon {...iconProps} />; // Icono por defecto si no se encuentra
  }
} 
