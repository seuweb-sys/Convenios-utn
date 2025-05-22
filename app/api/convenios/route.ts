import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { CreateConvenioDTO } from "@/lib/types/convenio";

// Definimos la estructura de los datos que esperamos de Supabase
interface ConvenioFromDB {
  id: string;
  title: string;
  status: string;
  created_at: string;
  convenio_types: {
    name: string;
  } | null;
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
        convenio_types!inner(name)
      `)
      .eq('user_id', user.id) // Filtrar por el ID del usuario autenticado
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (dbError) {
      console.error("API Error fetching user convenios:", dbError);
      return NextResponse.json({ error: 'Error al obtener convenios', details: dbError.message }, { status: 500 });
    }

    // 4. Transformar los datos al formato deseado por la API
    const responseData = (data as unknown as ConvenioFromDB[]).map(convenio => ({
      id: convenio.id,
      title: convenio.title || "Sin título",
      date: new Date(convenio.created_at).toLocaleDateString('es-AR'),
      type: convenio.convenio_types?.name || "Sin tipo",
      status: convenio.status || "Desconocido"
    }));

    // 5. Devolver los datos
    return NextResponse.json(responseData);

  } catch (e: any) {
    console.error("API Route Exception:", e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para generar número de serie
async function generateSerialNumber(supabase: any) {
  // Obtener el año actual
  const currentYear = new Date().getFullYear();
  
  // Buscar el último número de serie del año actual
  const { data: lastConvenio } = await supabase
    .from('convenios')
    .select('serial_number')
    .like('serial_number', `${currentYear}-%`)
    .order('serial_number', { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1;
  
  if (lastConvenio?.serial_number) {
    const [year, number] = lastConvenio.serial_number.split('-');
    if (year === currentYear.toString()) {
      nextNumber = parseInt(number) + 1;
    }
  }

  // Formatear el número con ceros a la izquierda
  return `${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener el perfil del usuario para el nombre
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error al obtener perfil del usuario:', profileError);
    }

    // Obtener y validar el body
    const body = await request.json() as CreateConvenioDTO;
    
    if (!body.title || !body.convenio_type_id || !body.content_data) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Crear el convenio (el serial_number lo genera el trigger)
    const { data: convenio, error: createError } = await supabase
      .from('convenios')
      .insert({
        title: body.title,
        convenio_type_id: body.convenio_type_id,
        content_data: body.content_data,
        status: 'borrador',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error al crear convenio:', createError);
      return NextResponse.json(
        { error: "Error al crear el convenio", details: createError.message },
        { status: 500 }
      );
    }

    // Registrar en activity_log - Simplificado sin buscar columnas
    try {
      const activityData = {
        id: crypto.randomUUID(),
        convenio_id: convenio.id,
        user_id: user.id,
        action: 'create',
        status_from: null,
        status_to: 'borrador',
        created_at: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      };
      
      const { error: logError } = await supabase
        .from('activity_log')
        .insert(activityData);

      if (logError) {
        console.error('Error al registrar actividad:', logError);
        // No retornamos error aquí ya que el convenio ya fue creado
      }
    } catch (logErr) {
      console.error("Error en el registro de actividad:", logErr);
      // Continuamos incluso si hay error en el registro de actividad
    }

    return NextResponse.json(convenio);

  } catch (error) {
    console.error('Error en el endpoint de convenios:', error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Aquí podrías añadir POST, PUT, DELETE para convenios en el futuro
// export async function POST(request: Request) { ... }