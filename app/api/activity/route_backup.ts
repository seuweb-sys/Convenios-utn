import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { formatTimeAgo } from "@/app/lib/dashboard/utils"; // Reutilizamos la función de formato de tiempo

// Tipos para la respuesta de la API
export type ApiActivityType = "info" | "success" | "warning" | "error";

export interface ActivityApiData {
  title: string;
  description: string;
  time: string;
  type: ApiActivityType;
  iconName: string; // Nombre del icono (ej: 'file', 'check', 'alert')
}

// Estructura de datos esperada de Supabase
interface ActivityLogFromDB {
  id: string;
  action: string;
  status_from: string | null;
  status_to: string | null;
  created_at: string;
  convenio_id: string;
  user_id: string;
  // Supabase devuelve objetos únicos para relaciones 1:1, no arrays
  convenios: {
    title: string;
    serial_number: string;
  } | null;
  profiles: {
    full_name: string;
  } | null;
}

// Datos de fallback si no hay actividad
const defaultActivity: ActivityApiData[] = [
  {
    title: "Bienvenido al sistema de convenios",
    description: "Aquí verás la actividad reciente relacionada con tus convenios.",
    time: "Ahora",
    type: "info",
    iconName: "file" // Mapear a FileTextIcon en el frontend
  }
];

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 1. Obtener y VALIDAR el usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("API Error getting user:", userError);
      return NextResponse.json({ error: 'Error de autenticación' }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 2. Obtener parámetro 'limit'
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50; // Default a 50

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json({ error: 'Parámetro limit inválido' }, { status: 400 });
    }

    // 3. Consultar actividad con JOINs manuales
    const { data: activityData, error: dbError } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (dbError) {
      console.error("API Error fetching activity:", dbError);
      return NextResponse.json({ error: 'Error al obtener actividad', details: dbError.message }, { status: 500 });
    }

    let responseData: ActivityApiData[];

    if (!data || data.length === 0) {
      responseData = defaultActivity;
    } else {
      // 4. Formatear los datos directamente en la API
      responseData = (data as unknown as ActivityLogFromDB[]).map(activity => {
        // Armá el título y descripción según la acción
        let type: ApiActivityType = "info";
        let iconName = "file";
        let title = "Actividad en convenio";
        let description = "";
        const convenioTitle = activity.convenios?.title || "Convenio";
        const convenioSerial = activity.convenios?.serial_number || "Sin número";
        const userName = activity.profiles?.full_name || "Usuario";

        switch(activity.action) {
          case "create":
            title = `Nuevo convenio creado`;
            description = `Se ha creado el convenio "${convenioTitle}" (N° ${convenioSerial})`;
            iconName = "file-plus";
            break;
          case "update":
            title = `Convenio actualizado`;
            description = `Se han realizado cambios en "${convenioTitle}" (N° ${convenioSerial})`;
            iconName = "edit";
            break;
          case "status_change":
            if (activity.status_to === "aprobado") {
              type = "success";
              iconName = "check";
              title = `Convenio aprobado`;
              description = `El convenio "${convenioTitle}" ha sido aprobado`;
            } else if (activity.status_to === "rechazado") {
              type = "error";
              iconName = "alert-circle";
              title = `Convenio rechazado`;
              description = `El convenio "${convenioTitle}" ha sido rechazado`;
            } else if (activity.status_to === "revision") {
              title = `Convenio enviado a revisión`;
              description = `El convenio "${convenioTitle}" está siendo revisado`;
              iconName = "clock";
            }
            break;
          default:
            title = `Actividad en convenio`;
            description = `Ha ocurrido una actividad en "${convenioTitle}"`;
            iconName = "info";
            break;
        }

        return {
          title,
          description,
          time: formatTimeAgo(activity.created_at),
          type,
          iconName
        };
      });
    }

    // 5. Devolver datos formateados
    return NextResponse.json(responseData);

  } catch (e: any) {
    console.error("API Route Exception:", e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 