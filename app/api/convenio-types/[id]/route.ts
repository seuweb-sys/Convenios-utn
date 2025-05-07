import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

// Definir la estructura de un campo individual para mejor tipado
interface FieldDefinitionFromDB { 
  name: string;
  label: string;
  type: string; // Podría ser más específico
  required?: boolean;
  validation?: string;
}

// Asegurarse de que la interfaz exportada incluya 'fields'
export interface ConvenioTypeApiData {
    id: number;
    name: string;
    description: string | null;
    fields: FieldDefinitionFromDB[]; // Añadido: array de definiciones de campos
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // Obtener el ID de los parámetros de ruta
) {
  const supabase = await createClient();

  // Opcional: Validar que el ID sea un número si es necesario
  // const typeId = parseInt(id, 10);
  // if (isNaN(typeId)) {
  //   return NextResponse.json({ error: 'ID de tipo inválido' }, { status: 400 });
  // }

  // Opcional: Verificar autenticación si solo usuarios logueados pueden ver esto
  // const { data: { user }, error: userError } = await supabase.auth.getUser();
  // if (userError || !user) {
  //   return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  // }

  try {
    // Validar que el ID sea un número usando params.id directamente
    const typeId = parseInt(params.id, 10);
    if (isNaN(typeId)) {
      return NextResponse.json({ error: 'ID de tipo inválido' }, { status: 400 });
    }

    // Consultar la tabla convenio_types por ID usando params.id directamente
    const { data, error } = await supabase
      .from('convenio_types')
      .select('id, name, description, fields') // Seleccionar los campos necesarios
      .eq('id', params.id) // Usar params.id aquí
      .eq('active', true) // Asegurarse que el tipo esté activo
      .single(); // Esperamos solo una fila

    if (error) {
      console.error(`API Error fetching convenio type ${params.id}:`, error); // Usar params.id en log
      if (error.code === 'PGRST116') { // Código de error cuando .single() no encuentra fila
          return NextResponse.json({ error: 'Tipo de convenio no encontrado o inactivo' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Error al obtener tipo de convenio', details: error.message }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: 'Tipo de convenio no encontrado o inactivo' }, { status: 404 });
    }
    
    // Devolver los datos (ahora TypeScript sabe que incluye 'fields')
    // Castear a ConvenioTypeApiData para asegurar el tipo de retorno
    return NextResponse.json(data as ConvenioTypeApiData);

  } catch (e: any) {
    console.error("API Route Exception:", e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 