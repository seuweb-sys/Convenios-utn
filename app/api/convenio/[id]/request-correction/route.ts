import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from 'next/server'
import { sendCorrectionRequestEmail } from '@/app/lib/services/email-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario sea admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { observaciones } = await request.json()
    const convenioId = params.id

    // 1. Actualizar estado del convenio a "revision"
    const { data: convenio, error: updateError } = await supabase
      .from('convenios')
      .update({ 
        status: 'revision',
        updated_at: new Date().toISOString()
      })
      .eq('id', convenioId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error actualizando convenio:', updateError)
      return NextResponse.json({ error: 'Error actualizando convenio' }, { status: 500 })
    }
    console.log('Convenio actualizado:', convenio)

    // 2. Obtener el usuario dueño del convenio
    let userEmail = null;
    let userName = null;
    try {
      // Usar la clave de servicio para inicializar un cliente admin
      const { createClient: createSupabaseAdminClient } = await import('@supabase/supabase-js');
      const adminClient = createSupabaseAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: userAuth, error: userAuthError } = await adminClient.auth.admin.getUserById(convenio.user_id);
      if (userAuthError) {
        console.error('Error obteniendo usuario de auth:', userAuthError);
      } else {
        userEmail = userAuth?.user?.email;
      }
    } catch (e) {
      console.error('Error obteniendo email del usuario:', e);
    }
    // Obtener el nombre del usuario desde profiles (sin email)
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', convenio.user_id)
      .single();
    if (userError) {
      console.error('Error obteniendo perfil del usuario:', userError);
    }
    userName = userProfile?.full_name || 'Usuario';
    console.log('Perfil del usuario dueño:', userProfile)

    // Crear observación en la tabla intermedia
    const { error: observacionError } = await supabase
      .from('observaciones')
      .insert({
        convenio_id: convenioId,
        user_id: user.id,
        content: observaciones,
        created_at: new Date().toISOString(),
        resolved: false
      })

    if (observacionError) {
      console.error('Error creando observación:', observacionError)
      // No fallamos la operación si la observación falla
    }

    // Registrar actividad
    await supabase
      .from('activity_log')
      .insert({
        user_id: user.id,
        action: 'request_correction',
        entity_id: convenioId,
        entity_type: 'convenio',
        details: `Solicitud de corrección: ${observaciones}`,
        created_at: new Date().toISOString()
      })

    // Enviar email de notificación
    if (userEmail) {
      try {
        await sendCorrectionRequestEmail({
          userEmail: userEmail,
          userName: userName,
          convenioTitle: convenio.title,
          convenioId: convenio.id,
          observaciones: observaciones,
          adminName: profile.full_name || 'Administrador'
        })
      } catch (emailError) {
        console.error('Error enviando email:', emailError)
        // No fallamos la operación si el email falla
      }
    } else {
      console.log('No se encontró email para el usuario del convenio')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Corrección solicitada exitosamente',
      convenio 
    })

  } catch (error) {
    console.error('Error en request-correction:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 