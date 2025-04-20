import { createClient } from "@/utils/supabase/server";
import { formatTimeAgo } from "./utils";
import { FileTextIcon, ClockIcon, CheckIcon, AlertCircleIcon } from "lucide-react";
import { ReactNode } from "react";

export type ActivityType = "info" | "success" | "warning" | "error";

export interface ActivityData {
  title: string;
  description: string;
  time: string;
  type: ActivityType;
  icon: ReactNode;
}

export async function getRecentActivity(limit: number = 3): Promise<ActivityData[]> {
  const supabase = await createClient();
  
  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }
  
  // Consultar actividad reciente
  const { data, error } = await supabase
    .from('activity_log')
    .select(`
      id,
      action,
      status_from,
      status_to,
      created_at,
      convenio_id,
      convenios(title)
    `)
    .or(`user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
  
  // Si no hay actividad, devolvemos datos de ejemplo
  if (!data || data.length === 0) {
    return [
      {
        title: "Bienvenido al sistema de convenios",
        description: "Aquí verás la actividad reciente relacionada con tus convenios.",
        time: "Ahora",
        type: "info" as ActivityType,
        icon: <FileTextIcon className="h-4 w-4" />
      }
    ];
  }
  
  // Transformar los datos para el componente
  return data.map(activity => {
    // Determinar tipo y mensaje según la acción
    return formatActivity(activity);
  });
}

interface ActivityLogItem {
  id: string;
  action: string;
  status_from: string | null;
  status_to: string | null;
  created_at: string;
  convenio_id: string;
  convenios: {
    title: string;
  } | null;
}

function formatActivity(activity: any): ActivityData {
  // Valores predeterminados
  let type: ActivityType = "info";
  let icon = <FileTextIcon className="h-4 w-4" />;
  let title = "Actividad en convenio";
  let description = "";
  
  // Título del convenio o texto por defecto
  const convenioTitle = activity.convenios?.title || "Convenio";
  
  switch(activity.action) {
    case "create":
      title = `Nuevo convenio creado`;
      description = `Se ha creado el convenio "${convenioTitle}"`;
      break;
      
    case "update":
      title = `Convenio actualizado`;
      description = `Se han realizado cambios en "${convenioTitle}"`;
      break;
      
    case "status_change":
      if (activity.status_to === "aprobado") {
        type = "success";
        icon = <CheckIcon className="h-4 w-4" />;
        title = `Convenio aprobado`;
        description = `El convenio "${convenioTitle}" ha sido aprobado`;
      } else if (activity.status_to === "rechazado") {
        type = "error";
        icon = <AlertCircleIcon className="h-4 w-4" />;
        title = `Convenio rechazado`;
        description = `El convenio "${convenioTitle}" ha sido rechazado`;
      } else if (activity.status_to === "revision") {
        title = `Convenio enviado a revisión`;
        description = `El convenio "${convenioTitle}" está siendo revisado`;
        icon = <ClockIcon className="h-4 w-4" />;
      }
      break;
      
    default:
      title = `Actividad en convenio`;
      description = `Ha ocurrido una actividad en "${convenioTitle}"`;
      break;
  }
  
  return {
    title,
    description,
    time: formatTimeAgo(activity.created_at),
    type,
    icon
  };
} 