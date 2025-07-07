import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { moveFileToFolder, DRIVE_FOLDERS } from '@/app/lib/google-drive';
import { NotificationService } from '@/app/lib/services/notification-service';

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
    const { action } = await request.json();

    // Obtener el convenio actual
    const { data: convenio } = await supabase
      .from("convenios")
      .select("status, user_id, document_path, title")
      .eq("id", params.id)
      .single();

    if (!convenio) {
      return NextResponse.json(
        { error: "Convenio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el archivo existe en Drive antes de aprobar
    if (action === "approve") {
      if (!convenio.document_path) {
        return NextResponse.json(
          { error: "No se puede aprobar el convenio porque no se encontró el archivo en Drive" },
          { status: 400 }
        );
      }

      // Extraer el ID del archivo de la URL de Drive
      const fileId = convenio.document_path.split('/d/')[1]?.split('/')[0];
      if (!fileId) {
        return NextResponse.json(
          { error: "No se puede aprobar el convenio porque el ID del archivo no es válido" },
          { status: 400 }
        );
      }

      try {
        // Intentar mover el archivo a la carpeta de aprobados
        await moveFileToFolder(fileId, DRIVE_FOLDERS.APPROVED);
      } catch (driveError) {
        console.error("Error al mover el archivo en Drive:", driveError);
        return NextResponse.json(
          { error: "No se puede aprobar el convenio porque no se pudo acceder al archivo en Drive" },
          { status: 400 }
        );
      }
    }

    let newStatus: string;
    let actionDetails: string;
    let targetFolderId: string | null = null;

    switch (action) {
      case "approve":
        newStatus = "aprobado";
        actionDetails = "Convenio aprobado";
        targetFolderId = DRIVE_FOLDERS.APPROVED;
        break;
      case "reject":
        newStatus = "rechazado";
        actionDetails = "Convenio rechazado";
        targetFolderId = DRIVE_FOLDERS.REJECTED;
        break;
      case "correct":
        newStatus = "revision";
        actionDetails = "Corrección solicitada";
        targetFolderId = DRIVE_FOLDERS.ARCHIVED;
        break;
      case "archive":
        newStatus = "archivado";
        actionDetails = "Convenio archivado";
        targetFolderId = DRIVE_FOLDERS.ARCHIVED;
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

    // Mover el archivo en Drive si tenemos el ID del archivo
    if (targetFolderId && convenio.document_path) {
      try {
        // Extraer el ID del archivo de la URL de Drive
        const fileId = convenio.document_path.split('/d/')[1]?.split('/')[0];
        if (fileId) {
          await moveFileToFolder(fileId, targetFolderId);
        }
      } catch (driveError) {
        console.error("Error al mover el archivo en Drive:", driveError);
        // No fallamos si el movimiento en Drive falla
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
        metadata: {},
        ip_address: request.headers.get("x-forwarded-for") || "unknown"
      });

    if (activityError) {
      console.error("Error al registrar la actividad:", activityError);
    }

    // Enviar notificación al usuario
    try {
      const convenioTitle = convenio.title || "Sin título";
      
      switch (action) {
        case "approve":
          await NotificationService.convenioApproved(convenio.user_id, convenioTitle, params.id);
          break;
        case "reject":
          await NotificationService.convenioRejected(convenio.user_id, convenioTitle, params.id);
          break;
        case "correct":
          await NotificationService.convenioSentToCorrection(convenio.user_id, convenioTitle, params.id);
          break;
      }
    } catch (notificationError) {
      console.error("Error al enviar notificación:", notificationError);
      // No fallamos si la notificación falla
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