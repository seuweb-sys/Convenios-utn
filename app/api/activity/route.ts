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

// Estructura de datos de la actividad desde la DB
interface ActivityLogFromDB {
  id: string;
  action: string;
  status_from: string | null;
  status_to: string | null;
  created_at: string;
  convenio_id: string;
  user_id: string;
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
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json({ error: 'Parámetro limit inválido' }, { status: 400 });
    }

    // 3. Consultar actividad básica (sin joins problemáticos)
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

    if (!activityData || activityData.length === 0) {
      responseData = defaultActivity;
    } else {
      // 4. Obtener IDs únicos para hacer fetch manual
      const convenioIds = [...new Set(activityData.map(a => a.convenio_id).filter(Boolean))];
      const userIds = [...new Set(activityData.map(a => a.user_id).filter(Boolean))];

      // 5. Fetch manual de convenios y perfiles en paralelo
      const [conveniosResult, profilesResult] = await Promise.all([
        convenioIds.length > 0 ? 
          supabase
            .from('convenios')
            .select('id, title, serial_number')
            .in('id', convenioIds) : 
          { data: [], error: null },
        userIds.length > 0 ? 
          supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds) : 
          { data: [], error: null }
      ]);

      const conveniosData = conveniosResult.data || [];
      const profilesData = profilesResult.data || [];

      // 6. Formatear los datos con lookup manual
      responseData = (activityData as ActivityLogFromDB[]).map(activity => {
        const convenio = conveniosData.find(c => c.id === activity.convenio_id);
        const profile = profilesData.find(p => p.id === activity.user_id);

        let type: ApiActivityType = "info";
        let iconName = "file";
        let title = "Actividad en convenio";
        let description = "";
        
        const convenioTitle = convenio?.title || "Convenio";
        const convenioSerial = convenio?.serial_number || "Sin número";
        const userName = profile?.full_name || "Usuario";

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
            } else if (activity.status_to === "finalizado") {
              type = "success";
              iconName = "check";
              title = `Convenio finalizado`;
              description = `El convenio "${convenioTitle}" ha sido finalizado`;
            }
            break;
          case "resubmit_convenio":
            title = `Convenio reenviado`;
            description = `Se reenviaron las correcciones de "${convenioTitle}" (N° ${convenioSerial})`;
            iconName = "refresh-ccw";
            type = "info";
            break;
          case "update_status":
            title = `Estado actualizado`;
            description = `El convenio "${convenioTitle}" cambió de ${activity.status_from || "-"} a ${activity.status_to}`;
            iconName = "arrow-right-left";
            break;
          default:
            title = `Actividad en convenio`;
            description = `Ha ocurrido una actividad en "${convenioTitle}" (N° ${convenioSerial})`;
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

    // 7. Devolver datos formateados
    return NextResponse.json(responseData);

  } catch (e: any) {
    console.error("API Route Exception:", e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 