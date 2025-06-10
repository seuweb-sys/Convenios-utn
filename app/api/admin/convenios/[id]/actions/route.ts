import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Obtener la acción y datos del body
    const { action, observaciones } = await request.json();

    // Obtener el convenio actual
    const { data: convenio } = await supabase
      .from("convenios")
      .select("status, user_id")
      .eq("id", params.id)
      .single();

    if (!convenio) {
      return NextResponse.json(
        { error: "Convenio no encontrado" },
        { status: 404 }
      );
    }

    let newStatus: string;
    let actionDetails: string;

    switch (action) {
      case "approve":
        newStatus = "aceptado";
        actionDetails = "Convenio aceptado";
        break;
      case "reject":
        newStatus = "rechazado";
        actionDetails = "Convenio rechazado";
        break;
      case "correct":
        if (!observaciones) {
          return NextResponse.json(
            { error: "Se requieren observaciones para solicitar corrección" },
            { status: 400 }
          );
        }
        newStatus = "enviado";
        actionDetails = "Corrección solicitada";
        break;
      default:
        return NextResponse.json(
          { error: "Acción no válida" },
          { status: 400 }
        );
    }

    // Actualizar el estado del convenio
    const { error: updateError } = await supabase
      .from("convenios")
      .update({ 
        status: newStatus,
        reviewer_id: user.id,
        ...(action === "approve" && { approved_at: new Date().toISOString() })
      })
      .eq("id", params.id);

    if (updateError) {
      console.error("Error al actualizar el convenio:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar el convenio" },
        { status: 500 }
      );
    }

    // Si hay observaciones, guardarlas
    if (observaciones) {
      const { error: observacionError } = await supabase
        .from("observaciones")
        .insert({
          convenio_id: params.id,
          user_id: user.id,
          content: observaciones,
          resolved: false
        });

      if (observacionError) {
        console.error("Error al guardar las observaciones:", observacionError);
        return NextResponse.json(
          { error: "Error al guardar las observaciones" },
          { status: 500 }
        );
      }
    }

    // Registrar la actividad
    const { error: activityError } = await supabase
      .from("activity_log")
      .insert({
        convenio_id: params.id,
        user_id: user.id,
        action: action,
        status_from: convenio.status,
        status_to: newStatus,
        metadata: { observaciones },
        ip_address: request.headers.get("x-forwarded-for") || "unknown"
      });

    if (activityError) {
      console.error("Error al registrar la actividad:", activityError);
    }

    // TODO: Enviar email al usuario
    const { data: userData } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", convenio.user_id)
      .single();

    if (userData?.email) {
      // TODO: Implementar envío de email
      console.log("Email a enviar:", {
        to: userData.email,
        subject: `Convenio ${actionDetails.toLowerCase()}`,
        text: `Tu convenio ha sido ${actionDetails.toLowerCase()}. ${
          observaciones ? `Observaciones: ${observaciones}` : ""
        }`
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 