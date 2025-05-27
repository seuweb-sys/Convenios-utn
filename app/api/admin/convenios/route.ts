import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar si el usuario es admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener todos los convenios con información relacionada
    const { data: convenios, error } = await supabase
      .from("convenios")
      .select(`
        *,
        profiles:user_id (
          full_name,
          role
        ),
        convenio_types (
          name
        ),
        observaciones (
          id,
          content,
          created_at,
          resolved
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener convenios:", error);
      return NextResponse.json(
        { error: "Error al obtener convenios" },
        { status: 500 }
      );
    }

    return NextResponse.json(convenios);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 