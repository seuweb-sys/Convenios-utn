import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { uploadFileToOAuthDriveWithMimeType, createFolderInOAuthDrive, DRIVE_FOLDERS } from '@/app/lib/google-drive';

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
        { error: "Solo administradores pueden subir PDFs firmados" },
        { status: 403 }
      );
    }

    // Obtener el convenio
    const { data: convenio, error: convenioError } = await supabase
      .from("convenios")
      .select("id, title, document_path, convenio_type_id, status")
      .eq("id", params.id)
      .single();

    if (convenioError || !convenio) {
      return NextResponse.json(
        { error: "Convenio no encontrado" },
        { status: 404 }
      );
    }

    // El convenio debe estar aprobado para subir PDF firmado
    if (convenio.status !== 'aprobado') {
      return NextResponse.json(
        { error: "Solo se puede subir PDF firmado a convenios aprobados" },
        { status: 400 }
      );
    }

    // Obtener el archivo del request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Verificar que sea un PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: "Solo se aceptan archivos PDF" },
        { status: 400 }
      );
    }

    // Convertir el archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`📄 [Signed PDF] Subiendo PDF firmado para convenio ${params.id}`);

    let signedPdfPath = null;

    // Determinar dónde subir el PDF
    // Si el convenio tiene una carpeta (específico o marco con anexos), subir ahí
    // Si no, crear una carpeta en "aprobados" y subir ahí
    
    const isConvenioWithFolder = convenio.convenio_type_id === 4 || 
      (convenio.document_path && convenio.document_path.includes('/folders/'));

    if (isConvenioWithFolder && convenio.document_path) {
      // Extraer el ID de la carpeta del link
      const folderId = convenio.document_path.split('/folders/')[1]?.split('?')[0];
      
      if (folderId) {
        console.log(`📁 [Signed PDF] Subiendo a carpeta existente: ${folderId}`);
        
        const response = await uploadFileToOAuthDriveWithMimeType(
          buffer,
          `FIRMADO-${convenio.title || 'convenio'}.pdf`,
          folderId,
          'application/pdf'
        );
        
        signedPdfPath = response.webViewLink;
      }
    }

    // Si no pudimos subir a una carpeta existente, crear una nueva en aprobados
    if (!signedPdfPath) {
      console.log(`📁 [Signed PDF] Creando carpeta para el PDF firmado`);
      
      // Crear carpeta para el convenio si no existe
      const folderName = `Convenio_${convenio.title || convenio.id}_firmado`;
      const folderResponse = await createFolderInOAuthDrive(folderName, DRIVE_FOLDERS.APPROVED);
      
      const response = await uploadFileToOAuthDriveWithMimeType(
        buffer,
        `FIRMADO-${convenio.title || 'convenio'}.pdf`,
        folderResponse.folderId!,
        'application/pdf'
      );
      
      signedPdfPath = response.webViewLink;
    }

    console.log(`✅ [Signed PDF] PDF firmado subido: ${signedPdfPath}`);

    // Actualizar el convenio con la información del PDF firmado
    const { error: updateError } = await supabase
      .from("convenios")
      .update({
        signed_pdf_path: signedPdfPath,
        signed_pdf_uploaded_at: new Date().toISOString(),
        signed_pdf_uploaded_by: user.id
      })
      .eq("id", params.id);

    if (updateError) {
      console.error("Error al actualizar convenio con PDF firmado:", updateError);
      return NextResponse.json(
        { error: "Error al guardar información del PDF firmado" },
        { status: 500 }
      );
    }

    // Registrar en activity_log
    try {
      await supabase
        .from("activity_log")
        .insert({
          convenio_id: params.id,
          user_id: user.id,
          action: 'upload_signed_pdf',
          status_from: convenio.status,
          status_to: convenio.status,
          metadata: {
            signed_pdf_path: signedPdfPath,
            file_name: file.name,
            file_size: file.size
          },
          ip_address: request.headers.get("x-forwarded-for") || "unknown"
        });
    } catch (logError) {
      console.error("Error al registrar actividad:", logError);
      // No fallamos si el log falla
    }

    return NextResponse.json({
      success: true,
      signed_pdf_path: signedPdfPath
    });

  } catch (error) {
    console.error("Error al subir PDF firmado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET para obtener la info del PDF firmado
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { data: convenio, error } = await supabase
      .from("convenios")
      .select("signed_pdf_path, signed_pdf_uploaded_at, signed_pdf_uploaded_by")
      .eq("id", params.id)
      .single();

    if (error || !convenio) {
      return NextResponse.json(
        { error: "Convenio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      signed_pdf_path: convenio.signed_pdf_path,
      signed_pdf_uploaded_at: convenio.signed_pdf_uploaded_at,
      signed_pdf_uploaded_by: convenio.signed_pdf_uploaded_by
    });

  } catch (error) {
    console.error("Error al obtener info del PDF firmado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
