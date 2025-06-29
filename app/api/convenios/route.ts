import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { CreateConvenioDTO } from "@/lib/types/convenio";
import { Packer } from 'docx';
import { createDocument } from '@/app/lib/utils/doc-generator';
import { uploadFileToDrive } from '@/app/lib/google-drive';

interface TemplateField {
  key: string;
  value: string;
}

// Definimos la estructura de los datos que esperamos de Supabase
interface ConvenioFromDB {
  id: string;
  title: string;
  status: string;
  created_at: string;
  convenio_type_id: number;
  convenio_types: {
    name: string;
  } | null;
}

// Helper function para mapear convenio_type_id a nombres correctos
function getConvenioTypeName(typeId: number | null, dbName?: string): string {
  const typeMap: Record<number, string> = {
    1: "Convenio Particular de Práctica Supervisada",
    2: "Convenio Marco",
    3: "Acuerdo de Colaboración",
    4: "Convenio Específico",
    5: "Convenio Marco Práctica Supervisada"
  };
  
  if (typeId && typeMap[typeId]) {
    return typeMap[typeId];
  }
  
  return dbName || "Sin tipo";
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

    // 2. Obtener el perfil y el rol
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'No se pudo obtener el perfil del usuario' }, { status: 500 });
    }

    const userRole = profile.role;

    // 3. Obtener el parámetro 'limit' de la URL (opcional)
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');

    const limit = limitParam ? parseInt(limitParam, 10) : 20; // Default 20
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json({ error: 'Parámetro limit inválido' }, { status: 400 });
    }
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ error: 'Parámetro offset inválido' }, { status: 400 });
    }

    // 4. Consulta condicional según el rol
    let query = supabase
      .from('convenios')
      .select(`
        *,
        profiles:user_id (
          full_name,
          role
        ),
        convenio_types(name),
        observaciones (
          id,
          content,
          created_at,
          resolved
        )
      `)
      .order('updated_at', { ascending: false });

    // Filtro por status
    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }

    // Filtro por tipo (acepta id numérico o nombre)
    if (typeParam && typeParam !== 'all') {
      const typeId = parseInt(typeParam, 10);
      if (!isNaN(typeId)) {
        query = query.eq('convenio_type_id', typeId);
      } else {
        query = query.eq('convenio_types.name', typeParam);
      }
    }

    // Paginación
    query = query.range(offset, offset + limit - 1);

    if (userRole === "user") {
      query = query.eq('user_id', user.id);
    }

    const { data, error: dbError } = await query;
    if (dbError) {
      console.error("API Error fetching convenios:", dbError);
      return NextResponse.json({ error: 'Error al obtener convenios', details: dbError.message }, { status: 500 });
    }

    // 5. Si el cliente pide datos completos (?full=true) devolvemos raw data
    const full = searchParams.get('full') === 'true';

    if (full) {
      return NextResponse.json(data);
    }

    // 5.b Transformar los datos al formato resumido (default)
    const responseData = (data as unknown as ConvenioFromDB[]).map(convenio => {
      // Formatear fecha de forma más robusta
      let formattedDate = "Sin fecha";
      try {
        const date = new Date(convenio.created_at);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
          });
        }
      } catch (error) {
        console.error('Error formatting date:', error);
      }

      return {
        id: convenio.id,
        title: convenio.title || "Sin título",
        date: formattedDate,
        type: getConvenioTypeName(convenio.convenio_type_id, convenio.convenio_types?.name),
        status: convenio.status || "Desconocido"
      };
    });

    // 6. Devolver los datos
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
    const body = await request.json() as any; // mantener flexibilidad

    // Permitimos tanto form_data (nuevo) como content_data (compatibilidad)
    const formData = body.form_data || body.content_data;

    if (!body.title || !body.convenio_type_id || !formData) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Obtener el template del tipo de convenio
    const { data: template, error: templateError } = await supabase
      .from('convenio_types')
      .select('template_content')
      .eq('id', body.convenio_type_id)
      .single();

    if (templateError || !template) {
      console.error('Error al obtener template:', templateError);
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Convertir content_data al formato TemplateField[]
    const templateFields: TemplateField[] = Object.entries(formData).map(([key, value]) => ({
      key,
      value: String(value)
    }));

    // Crear el documento
    const doc = createDocument(template.template_content, templateFields);
    const buffer = await Packer.toBuffer(doc);

    // Generar número de serie
    const serialNumber = await generateSerialNumber(supabase);

    // Primero crear el convenio en la base de datos
    const { data: convenio, error: createError } = await supabase
      .from('convenios')
      .insert({
        title: body.title,
        convenio_type_id: body.convenio_type_id,
        form_data: formData,
        status: 'enviado',
        user_id: user.id,
        serial_number: serialNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        document_path: null // Inicialmente null, se actualizará después de subir a Drive
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

    // Si el convenio se creó exitosamente, subir a Drive
    let documentPath = null;
    try {
      const driveResponse = await uploadFileToDrive(
        buffer,
        `Convenio_${body.title}_${new Date().toISOString().split('T')[0]}.docx`
      );
      documentPath = driveResponse.webViewLink;

      // Actualizar el convenio con el path del documento
      const { error: updateError } = await supabase
        .from('convenios')
        .update({ document_path: documentPath })
        .eq('id', convenio.id);

      if (updateError) {
        console.error('Error al actualizar el path del documento:', updateError);
        // No fallamos si la actualización del path falla
      }
    } catch (driveError) {
      console.error('Error al subir a Drive:', driveError);
      // Si falla la subida a Drive, actualizamos el estado del convenio
      const { error: updateError } = await supabase
        .from('convenios')
        .update({ 
          status: 'borrador',
          document_path: null
        })
        .eq('id', convenio.id);

      if (updateError) {
        console.error('Error al actualizar el estado del convenio:', updateError);
      }

      return NextResponse.json(
        { error: "Error al subir el documento a Drive" },
        { status: 500 }
      );
    }

    // Registrar en activity_log
    try {
      await supabase
        .from('activity_log')
        .insert({
          convenio_id: convenio.id,
          user_id: user.id,
          action: 'create',
          status_from: null,
          status_to: 'enviado',
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          metadata: {
            title: body.title,
            type: body.convenio_type_id,
            document_path: documentPath
          }
        });
    } catch (logError) {
      console.error('Error al registrar actividad:', logError);
      // No fallamos si el log falla
    }

    return NextResponse.json({
      success: true,
      convenio: {
        ...convenio,
        document_path: documentPath
      }
    });

  } catch (error) {
    console.error('Error general:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Aquí podrías añadir POST, PUT, DELETE para convenios en el futuro
// export async function POST(request: Request) { ... }