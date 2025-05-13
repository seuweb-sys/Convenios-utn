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
  user_id: string; // Incluimos user_id para el filtro
  convenios: {
    title: string;
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
      console.error("API Error getting user (activity):", userError);
      return NextResponse.json({ error: 'Error de autenticación' }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 2. Obtener parámetro 'limit'
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 3; // Default a 3
    if (isNaN(limit) || limit <= 0) {
        return NextResponse.json({ error: 'Parámetro limit inválido' }, { status: 400 });
    }

    // 3. Consultar actividad reciente
    const { data, error: dbError } = await supabase
      .from('activity_log')
      .select(`
        id,
        action,
        status_from,
        status_to,
        created_at,
        convenio_id,
        user_id,
        convenios(title)
      `)
      .or(`user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (dbError) {
      console.error("API Error fetching recent activity:", dbError);
      return NextResponse.json({ error: 'Error al obtener actividad reciente', details: dbError.message }, { status: 500 });
    }

    let responseData: ActivityApiData[];

    if (!data || data.length === 0) {
        responseData = defaultActivity;
    } else {
        // 4. Formatear los datos directamente en la API
        responseData = (data as unknown as ActivityLogFromDB[]).map(activity => {
          let type: ApiActivityType = "info";
          let iconName = "file"; // Default icon name
          let title = "Actividad en convenio";
          let description = "";
          const convenioTitle = activity.convenios?.title || "Convenio";

          switch(activity.action) {
            case "create":
              title = `Nuevo convenio creado`;
              description = `Se ha creado el convenio "${convenioTitle}"`;
              iconName = "file-plus"; // Ejemplo
              break;
            case "update":
              title = `Convenio actualizado`;
              description = `Se han realizado cambios en "${convenioTitle}"`;
              iconName = "edit"; // Ejemplo
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
              iconName = "info"; // Ejemplo
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