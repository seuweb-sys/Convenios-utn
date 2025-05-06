import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { UpdateConvenioDTO } from "@/lib/types/convenio";

// Obtener un convenio específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Obtener el convenio
    const { data: convenio, error: dbError } = await supabase
      .from('convenios')
      .select(`
        *,
        convenio_types(name),
        user:user_id(id, full_name, email),
        reviewer:reviewer_id(id, full_name, email)
      `)
      .eq('id', params.id)
      .single();

    if (dbError) {
      console.error('Error al obtener el convenio:', dbError);
      return NextResponse.json(
        { error: 'Error al obtener el convenio' },
        { status: 500 }
      );
    }

    if (!convenio) {
      return NextResponse.json(
        { error: 'Convenio no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tenga permiso para ver el convenio
    if (convenio.user_id !== user.id && !user.user_metadata.is_admin) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver este convenio' },
        { status: 403 }
      );
    }

    return NextResponse.json(convenio);
  } catch (error) {
    console.error('Error al obtener el convenio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Actualizar un convenio
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const body: UpdateConvenioDTO = await request.json();

    // Verificar que el convenio exista y el usuario tenga permiso
    const { data: convenio, error: checkError } = await supabase
      .from('convenios')
      .select('user_id, status')
      .eq('id', params.id)
      .single();

    if (checkError || !convenio) {
      return NextResponse.json(
        { error: 'Convenio no encontrado' },
        { status: 404 }
      );
    }

    // Solo el creador o un admin pueden actualizar el convenio
    if (convenio.user_id !== user.id && !user.user_metadata.is_admin) {
      return NextResponse.json(
        { error: 'No tienes permiso para actualizar este convenio' },
        { status: 403 }
      );
    }

    // Si se está cambiando el estado, registrar en activity_log
    if (body.status && body.status !== convenio.status) {
      const { error: logError } = await supabase
        .from('activity_log')
        .insert({
          id: crypto.randomUUID(),
          convenio_id: params.id,
          user_id: user.id,
          action: 'update_status',
          status_from: convenio.status,
          status_to: body.status,
          created_at: new Date().toISOString(),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        });

      if (logError) {
        console.error('Error al registrar cambio de estado:', logError);
      }
    }

    // Actualizar el convenio
    const { data: updatedConvenio, error: updateError } = await supabase
      .from('convenios')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error al actualizar el convenio:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el convenio' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedConvenio);
  } catch (error) {
    console.error('Error al actualizar el convenio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Eliminar un convenio
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Verificar que el convenio exista y el usuario tenga permiso
    const { data: convenio, error: checkError } = await supabase
      .from('convenios')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (checkError || !convenio) {
      return NextResponse.json(
        { error: 'Convenio no encontrado' },
        { status: 404 }
      );
    }

    // Solo el creador o un admin pueden eliminar el convenio
    if (convenio.user_id !== user.id && !user.user_metadata.is_admin) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este convenio' },
        { status: 403 }
      );
    }

    // Eliminar el convenio
    const { error: deleteError } = await supabase
      .from('convenios')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error al eliminar el convenio:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el convenio' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Convenio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el convenio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 