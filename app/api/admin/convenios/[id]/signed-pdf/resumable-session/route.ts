import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import {
  createFolderInOAuthDrive,
  createOAuthDriveResumableUploadSession,
  DRIVE_FOLDERS,
} from '@/app/lib/google-drive';

export const dynamic = 'force-dynamic';

const MAX_SIGNED_PDF_SIZE_BYTES = 50 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

    const { data: convenio, error: convenioError } = await supabase
      .from("convenios")
      .select("id, title, document_path, convenio_type_id, status")
      .eq("id", params.id)
      .single();

    if (convenioError || !convenio) {
      return NextResponse.json({ error: "Convenio no encontrado" }, { status: 404 });
    }

    if (convenio.status !== 'aprobado') {
      return NextResponse.json(
        { error: "Solo se puede subir PDF firmado a convenios aprobados" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null) as {
      fileName?: string;
      mimeType?: string;
      fileSize?: number;
    } | null;

    const fileSize = Number(body?.fileSize);
    if (body?.mimeType !== 'application/pdf') {
      return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 });
    }

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ error: "Tamaño de archivo inválido" }, { status: 400 });
    }

    if (fileSize > MAX_SIGNED_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: "El PDF firmado supera el máximo permitido de 50 MB" },
        { status: 413 }
      );
    }

    let folderId: string | null = null;
    const isConvenioWithFolder = convenio.convenio_type_id === 4 ||
      (convenio.document_path && convenio.document_path.includes('/folders/'));

    if (isConvenioWithFolder && convenio.document_path) {
      folderId = convenio.document_path.split('/folders/')[1]?.split('?')[0] || null;
    }

    if (!folderId) {
      const folderName = `Convenio_${convenio.title || convenio.id}_firmado`;
      const folderResponse = await createFolderInOAuthDrive(folderName, DRIVE_FOLDERS.APPROVED);
      folderId = folderResponse.folderId || null;
    }

    if (!folderId) {
      return NextResponse.json({ error: "No se pudo determinar la carpeta de destino" }, { status: 500 });
    }

    const session = await createOAuthDriveResumableUploadSession({
      fileName: `FIRMADO-${convenio.title || 'convenio'}.pdf`,
      mimeType: 'application/pdf',
      fileSize,
      folderId,
    });

    return NextResponse.json({ ...session, folderId });
  } catch (error) {
    console.error("Error al iniciar subida resumable de PDF firmado:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al iniciar subida de PDF firmado" },
      { status: 500 }
    );
  }
}
