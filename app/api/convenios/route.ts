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

    // Obtener y validar el body
    const body = await request.json() as CreateConvenioDTO;
    
    if (!body.title || !body.convenio_type_id || !body.content_data) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Generar número de serie
    const { data: lastConvenio } = await supabase
      .from('convenios')
      .select('serial_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentYear = new Date().getFullYear();
    let serialNumber = `${currentYear}-001`;
    
    if (lastConvenio?.serial_number) {
      const [year, number] = lastConvenio.serial_number.split('-');
      if (year === currentYear.toString()) {
        const nextNumber = (parseInt(number) + 1).toString().padStart(3, '0');
        serialNumber = `${year}-${nextNumber}`;
      }
    }

    // Crear el convenio
    const { data: convenio, error: createError } = await supabase
      .from('convenios')
      .insert({
        serial_number: serialNumber,
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
        { error: "Error al crear el convenio" },
        { status: 500 }
      );
    }

    // Registrar en activity_log
    const { error: logError } = await supabase
      .from('activity_log')
      .insert({
        id: crypto.randomUUID(),
        convenio_id: convenio.id,
        user_id: user.id,
        action: 'create',
        status_from: null,
        status_to: 'borrador',
        created_at: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

    if (logError) {
      console.error('Error al registrar actividad:', logError);
      // No retornamos error aquí ya que el convenio ya fue creado
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