import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener datos adicionales del usuario de la tabla de perfiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error al obtener perfil:', profileError);
      // Si no hay perfil, devolver solo los datos básicos del usuario
      return NextResponse.json({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      });
    }

    // Combinar datos de auth y perfil
    return NextResponse.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      ...profile
    });

  } catch (error) {
    console.error('Error en el endpoint de usuario:', error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 