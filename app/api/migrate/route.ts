import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticación de admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que el usuario es admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Solo administradores pueden ejecutar migraciones" },
        { status: 403 }
      );
    }

    // 1. Obtener convenios con status 'borrador'
    const { data: conveniosBorrador, error: fetchError } = await supabase
      .from('convenios')
      .select('id, title, status, created_at')
      .eq('status', 'borrador');

    if (fetchError) {
      console.error('Error al obtener convenios:', fetchError);
      return NextResponse.json(
        { error: 'Error al obtener convenios' },
        { status: 500 }
      );
    }

    const totalBorradores = conveniosBorrador?.length || 0;

    if (totalBorradores === 0) {
      return NextResponse.json({
        message: 'No hay convenios en estado borrador para migrar',
        conveniosMigrados: 0
      });
    }

    // 2. Actualizar status de 'borrador' a 'enviado'
    const { error: updateError } = await supabase
      .from('convenios')
      .update({ 
        status: 'enviado',
        submitted_at: new Date().toISOString()
      })
      .eq('status', 'borrador');

    if (updateError) {
      console.error('Error al actualizar convenios:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar convenios' },
        { status: 500 }
      );
    }

    // 3. Crear activity_log para cada migración
    const activityLogs = conveniosBorrador.map(convenio => ({
      id: crypto.randomUUID(),
      convenio_id: convenio.id,
      user_id: user.id,
      action: 'migrate_status',
      status_from: 'borrador',
      status_to: 'enviado',
      created_at: new Date().toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      metadata: { migration: true, automated: true }
    }));

    const { error: logError } = await supabase
      .from('activity_log')
      .insert(activityLogs);

    if (logError) {
      console.error('Error al registrar actividad:', logError);
      // No falla la migración si no se puede loggear
    }

    // 4. Verificar resultados
    const { data: stats } = await supabase
      .from('convenios')
      .select('status')
      .in('status', ['enviado', 'aceptado', 'rechazado']);

    const statusCounts = stats?.reduce((acc: any, conv) => {
      acc[conv.status] = (acc[conv.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      message: 'Migración completada exitosamente',
      conveniosMigrados: totalBorradores,
      estadisticas: statusCounts,
      detalles: conveniosBorrador.map(c => ({ 
        id: c.id, 
        title: c.title,
        statusAnterior: 'borrador',
        statusNuevo: 'enviado'
      }))
    });

  } catch (error) {
    console.error('Error en migración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 