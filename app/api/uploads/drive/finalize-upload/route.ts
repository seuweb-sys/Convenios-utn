import { NextResponse } from 'next/server';

import {
  DRIVE_FOLDERS,
  findOAuthDriveFileByNameWithRetry,
} from '@/app/lib/google-drive';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'No se pudo obtener el perfil del usuario' }, { status: 500 });
    }

    if (!profile.is_approved && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Usuario no aprobado' }, { status: 403 });
    }

    if (profile.role === 'decano') {
      return NextResponse.json({ error: 'El decano tiene permisos de solo lectura' }, { status: 403 });
    }

    const body = await request.json().catch(() => null) as {
      fileName?: string;
      mimeType?: string;
      fileSize?: number;
      folderId?: string;
    } | null;

    const fileName = body?.fileName?.trim();
    const mimeType = body?.mimeType?.trim();
    const fileSize = Number(body?.fileSize);

    if (!fileName || !mimeType || !Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ error: 'Datos de archivo inválidos' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json({ error: 'Solo se aceptan archivos .docx y .pdf' }, { status: 400 });
    }

    if (!fileName.startsWith('ANEXO-')) {
      return NextResponse.json({ error: 'Nombre de archivo inválido' }, { status: 400 });
    }

    if (fileSize > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'El archivo supera el máximo permitido de 50 MB' },
        { status: 413 }
      );
    }

    if (body?.folderId && body.folderId !== DRIVE_FOLDERS.PENDING) {
      return NextResponse.json({ error: 'Carpeta de destino inválida' }, { status: 400 });
    }

    const uploadedFile = await findOAuthDriveFileByNameWithRetry({
      folderId: DRIVE_FOLDERS.PENDING,
      fileName,
      mimeType,
      fileSize,
    });

    if (!uploadedFile?.id) {
      return NextResponse.json(
        { error: 'No se pudo recuperar el archivo subido desde Google Drive' },
        { status: 404 }
      );
    }

    return NextResponse.json(uploadedFile);
  } catch (error) {
    console.error('Error al finalizar subida directa de anexo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al recuperar el archivo subido desde Google Drive' },
      { status: 500 }
    );
  }
}
