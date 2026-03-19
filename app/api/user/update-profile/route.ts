import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { role } = body;

        // Validar role
        const validRoles = ["user", "decano"];
        if (role && !validRoles.includes(role)) {
            return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
        }

        // Actualizar perfil del usuario
        const updates: any = {};
        if (role) updates.role = role;

        const { error: updateError } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", user.id);

        if (updateError) {
            console.error("Error updating profile:", updateError);
            return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in update-profile:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
