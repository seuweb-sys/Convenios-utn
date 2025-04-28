import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

// Interfaz para los datos que devolverá esta API
// Similar a UserConvenioData, pero podemos ajustar si es necesario
export interface ConvenioApiData {
  id: string;
  title: string;
  date: string; // Formateada como string
  type: string;
  status: string;
}

// Definimos la estructura de los datos que esperamos de Supabase
// Esto ayuda a TypeScript a entender el join
interface ConvenioFromDB {
  id: string;
  title: string;
  status: string;
  created_at: string;
  convenio_types: { name: string } | null; // Puede ser null si el join falla o no existe
}

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

    // 2. Obtener el parámetro 'limit' de la URL (opcional)
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 4; // Default a 4 si no se provee

    if (isNaN(limit) || limit <= 0) {
        return NextResponse.json({ error: 'Parámetro limit inválido' }, { status: 400 });
    }

    // 3. Realizar la consulta a Supabase
    const { data, error: dbError } = await supabase
      .from('convenios')
      .select(`
        id,
        title,
        status,
        created_at,
        convenio_types(name)
      `)
      .eq('user_id', user.id) // Filtrar por el ID del usuario autenticado
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (dbError) {
      console.error("API Error fetching user convenios:", dbError);
      return NextResponse.json({ error: 'Error al obtener convenios', details: dbError.message }, { status: 500 });
    }

    // 4. Transformar los datos al formato deseado por la API
    const responseData: ConvenioApiData[] = (data as ConvenioFromDB[] || []).map(convenio => ({
      id: convenio.id,
      title: convenio.title || "Sin título",
      date: new Date(convenio.created_at).toLocaleDateString('es-AR'), // Formatear fecha aquí
      type: convenio.convenio_types?.name || "Sin tipo", // Manejar posible null
      status: convenio.status || "Desconocido"
    }));

    // 5. Devolver los datos
    return NextResponse.json(responseData);

  } catch (e: any) {
    console.error("API Route Exception:", e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Aquí podrías añadir POST, PUT, DELETE para convenios en el futuro
// export async function POST(request: Request) { ... } 