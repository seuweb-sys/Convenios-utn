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

    // Verificar el perfil y rol del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'No se pudo obtener el perfil del usuario' },
        { status: 500 }
      );
    }

    const userRole = profile.role;

    // Obtener el convenio
    const { data: convenio, error: dbError } = await supabase
      .from('convenios')
      .select(`
        *,
        convenio_types(name),
        user:user_id(id, full_name),
        reviewer:reviewer_id(id, full_name)
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
    if (
      convenio.user_id !== user.id &&
      userRole !== 'admin' &&
      userRole !== 'profesor'
    ) {
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

    // Verificar el perfil y rol del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'No se pudo obtener el perfil del usuario' },
        { status: 500 }
      );
    }

    const userRole = profile.role;

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
    if (
      convenio.user_id !== user.id &&
      userRole !== 'admin' &&
      userRole !== 'profesor'
    ) {
      return NextResponse.json(
        { error: 'No tienes permiso para actualizar este convenio' },
        { status: 403 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.content_data) {
      updateData.content_data = body.content_data;
    }

    if (body.document_path) {
      updateData.document_path = body.document_path;
    }

    if (body.status) {
      updateData.status = body.status;
      // Si se está enviando el convenio (cambiando a 'enviado'), marcar observaciones como resueltas
      if (body.status === 'enviado' && convenio.status === 'revision') {
        try {
          await supabase
            .from('observaciones')
            .update({ resolved: true, resolved_at: new Date().toISOString() })
            .eq('convenio_id', params.id)
            .eq('resolved', false);
        } catch (observacionError) {
          console.error('Error actualizando observaciones:', observacionError);
          // No fallamos la operación si la actualización de observaciones falla
        }
      }
    }

    // Si se está cambiando el estado, registrar en activity_log
    if (body.status && body.status !== convenio.status) {
      try {
        const action = body.status === 'enviado' && convenio.status === 'revision' 
          ? 'resubmit_convenio' 
          : 'update_status';

        const { error: logError } = await supabase
          .from('activity_log')
          .insert({
            convenio_id: params.id,
            user_id: user.id,
            action,
            status_from: convenio.status,
            status_to: body.status,
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            metadata: {
              note: body.status === 'enviado' && convenio.status === 'revision'
                ? 'Reenvío tras correcciones'
                : undefined
            }
          });

        if (logError) {
          console.error('Error al registrar cambio de estado:', logError);
        }
      } catch (logErr) {
        console.error('Error al registrar actividad:', logErr);
        // Continuamos el flujo aunque falle el registro
      }
    }

    // Actualizar el convenio
    const { data: updatedConvenio, error: updateError } = await supabase
      .from('convenios')
      .update(updateData)
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

    return NextResponse.json({
      success: true,
      message: 'Convenio actualizado exitosamente',
      convenio: updatedConvenio
    });
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

    // Verificar el perfil y rol del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'No se pudo obtener el perfil del usuario' },
        { status: 500 }
      );
    }

    const userRole = profile.role;

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
    if (
      convenio.user_id !== user.id &&
      userRole !== 'admin' &&
      userRole !== 'profesor'
    ) {
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