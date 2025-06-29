import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Role check
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    // Fetch convenios legacy
    const { data: legacy, error: fetchError } = await supabase
      .from("convenios")
      .select("id, form_data, content_data")
      .is("form_data", null)
      .not("content_data", "is", null);

    if (fetchError) {
      console.error(fetchError);
      return NextResponse.json({ error: "Error al obtener convenios" }, { status: 500 });
    }

    const toMigrate = legacy || [];

    if (toMigrate.length === 0) {
      return NextResponse.json({ message: "Nada que migrar", migrados: 0 });
    }

    // Migrar con batch updates
    const updates = toMigrate.map((c) =>
      supabase.from("convenios").update({ form_data: c.content_data }).eq("id", c.id)
    );

    const results = await Promise.all(updates);

    const errors = results.filter((r) => r.error);

    return NextResponse.json({
      message: "Migración completada",
      total: toMigrate.length,
      errores: errors.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
} 