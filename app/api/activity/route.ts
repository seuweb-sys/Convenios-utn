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

    // 3. Consultar actividad
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
        convenios (
          title,
          serial_number
        ),
        profiles:user_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (dbError) {
      console.error("API Error fetching activity:", dbError);
      return NextResponse.json({ error: 'Error al obtener actividad', details: dbError.message }, { status: 500 });
    }

    // 4. Transformar los datos al formato deseado
    const responseData = (data as unknown as ActivityLogFromDB[]).map(activity => ({
      id: activity.id,
      action: activity.action,
      status_from: activity.status_from,
      status_to: activity.status_to,
      created_at: activity.created_at,
      convenio_title: activity.convenios?.title || "Sin título",
      convenio_serial: activity.convenios?.serial_number || "Sin número",
      user_name: activity.profiles?.full_name || "Usuario"
    }));

    return NextResponse.json(responseData);

  } catch (e: any) {
    console.error("API Route Exception:", e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 