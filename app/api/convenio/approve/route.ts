import { NextResponse } from 'next/server';
import { moveFileToFolder, DRIVE_FOLDERS } from '@/app/lib/google-drive';

export async function POST(request: Request) {
  try {
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Mover el archivo a la carpeta de aprobados
    await moveFileToFolder(fileId, DRIVE_FOLDERS.APPROVED);

    return NextResponse.json({
      success: true,
      message: 'Convenio aprobado exitosamente'
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al aprobar el convenio' },
      { status: 500 }
    );
  }
} 