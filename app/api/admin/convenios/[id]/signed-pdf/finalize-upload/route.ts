import { NextResponse } from "next/server";

import { ensureConvenioFolder } from "@/app/lib/convenio-drive";
import { DRIVE_FOLDERS, findOAuthDriveFileByName } from "@/app/lib/google-drive";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

const MAX_SIGNED_PDF_SIZE_BYTES = 50 * 1024 * 1024;
const LOOKUP_RETRY_DELAYS_MS = [0, 150, 300, 600] as const;

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
      folderId?: string;
    } | null;

    const expectedFileName = `FIRMADO-${convenio.title || 'convenio'}.pdf`;
    const fileName = body?.fileName?.trim();
    const mimeType = body?.mimeType?.trim();
    const fileSize = Number(body?.fileSize);

    if (fileName !== expectedFileName) {
      return NextResponse.json({ error: "Nombre de archivo inválido" }, { status: 400 });
    }

    if (mimeType !== 'application/pdf') {
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

    const folder = await ensureConvenioFolder({
      convenioTitle: `Convenio_${convenio.title || convenio.id}_firmado`,
      parentFolderId: DRIVE_FOLDERS.APPROVED,
      currentDocumentPath: convenio.document_path,
    });

    if (body?.folderId && body.folderId !== folder.folderId) {
      return NextResponse.json({ error: "Carpeta de destino inválida" }, { status: 400 });
    }

    if (folder.migratedFromFile) {
      await supabase
        .from("convenios")
        .update({ document_path: folder.folderWebViewLink })
        .eq("id", params.id);
    }

    for (const delayMs of LOOKUP_RETRY_DELAYS_MS) {
      if (delayMs > 0) {
        await sleep(delayMs);
      }

      const uploadedFile = await findOAuthDriveFileByName({
        folderId: folder.folderId,
        fileName,
        mimeType,
        fileSize,
      });

      if (uploadedFile?.id) {
        return NextResponse.json(uploadedFile);
      }
    }

    return NextResponse.json(
      { error: "No se pudo recuperar el archivo subido desde Google Drive" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error al finalizar subida directa de PDF firmado:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al recuperar el PDF firmado desde Google Drive" },
      { status: 500 }
    );
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
