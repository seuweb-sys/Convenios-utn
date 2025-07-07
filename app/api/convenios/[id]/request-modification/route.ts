import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { mensaje, convenio_title } = await request.json();
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el convenio existe y pertenece al usuario
    const { data: convenio, error: convenioError } = await supabase
      .from('convenios')
      .select('id, title, status, user_id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (convenioError || !convenio) {
      return NextResponse.json({ error: "Convenio no encontrado" }, { status: 404 });
    }

    // Solo permitir solicitudes en convenios aprobados
    if (convenio.status !== 'aprobado') {
      return NextResponse.json({ 
        error: "Solo se pueden solicitar modificaciones en convenios aprobados" 
      }, { status: 400 });
    }

    // Obtener información del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Crear la notificación para los administradores
    const { error: notificationError } = await supabase
      .from('activity')
      .insert({
        title: 'Solicitud de Modificación',
        description: `${profile?.full_name || 'Usuario'} solicita modificar el convenio "${convenio_title}"`,
        metadata: {
          convenio_id: params.id,
          convenio_title: convenio_title,
          user_name: profile?.full_name || 'Usuario',
          user_email: profile?.email || user.email,
          mensaje: mensaje,
          tipo: 'solicitud_modificacion'
        },
        user_id: user.id
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      return NextResponse.json({ error: "Error al crear la notificación" }, { status: 500 });
    }

    // Cambiar el estado del convenio a "revision_modificacion"
    const { error: updateError } = await supabase
      .from('convenios')
      .update({ 
        status: 'revision_modificacion',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating convenio status:', updateError);
      return NextResponse.json({ error: "Error al actualizar el estado del convenio" }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Solicitud enviada correctamente",
      status: "revision_modificacion"
    });

  } catch (error) {
    console.error('Error in request-modification API:', error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 