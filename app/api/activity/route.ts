export const dynamic = 'force-dynamic';

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { isPracticeType } from "@/app/lib/authz/scope-rules";
import { shouldApplyProfesorPracticeOnlyConvenioFilter } from "@/app/lib/authz/profesor-membership-scope";
import { formatActivityEntry, type ActivityApiData, type ApiActivityType } from "./activity-format";

export type { ActivityApiData, ApiActivityType } from "./activity-format";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const applyProfesorPracticeOnly =
      profile &&
      (await shouldApplyProfesorPracticeOnlyConvenioFilter(
        supabase,
        user.id,
        profile.role
      ));

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
      const convenioIds = Array.from(new Set(activityData.map(a => a.convenio_id).filter(Boolean)));
      const userIds = Array.from(new Set(activityData.map(a => a.user_id).filter(Boolean)));

      // 5. Fetch manual de convenios y perfiles en paralelo
      const [conveniosResult, profilesResult] = await Promise.all([
        convenioIds.length > 0 ? 
          supabase
            .from('convenios')
            .select('id, title, serial_number, convenio_type_id')
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

      let activityRows = activityData as ActivityLogFromDB[];
      if (applyProfesorPracticeOnly) {
        const convenioById = new Map(
          conveniosData.map((c: { id: string; convenio_type_id?: number | null }) => [c.id, c])
        );
        activityRows = activityRows.filter((activity) => {
          if (!activity.convenio_id) return true;
          const c = convenioById.get(activity.convenio_id);
          if (!c) return false;
          return isPracticeType(Number((c as { convenio_type_id?: number }).convenio_type_id));
        });
      }

      if (activityRows.length === 0) {
        responseData = defaultActivity;
      } else {
      // 6. Formatear los datos con lookup manual
      responseData = activityRows.map(activity => {
        const convenio = conveniosData.find(c => c.id === activity.convenio_id);
        const profile = profilesData.find(p => p.id === activity.user_id);

        return formatActivityEntry(activity, convenio, profile);
      });
      }
    }

    // 7. Devolver datos formateados
    return NextResponse.json(responseData);

  } catch (e: any) {
    console.error("API Route Exception:", e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 
