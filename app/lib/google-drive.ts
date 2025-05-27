import { google } from 'googleapis';
import { readFileSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Configuración de las carpetas
export const DRIVE_FOLDERS = {
  ROOT: '1od2SuLoJPgxS5OTyps_UhCEvhvhWT3mz', // Carpeta padre del proyecto
  PENDING: '1IwXiatPJ-j98oC7XKrd9xK7VF52fVNaJ', // Carpeta "pendientes"
  APPROVED: '19BAZjx93AsHZ45s3U6afISMQJy5zdzPm', // Carpeta "aprobados"
  REJECTED: '16JY2aSOp57qn7Ow4BBRZqqq1xK_kv7PQ', // Carpeta "rechazados"
} as const;

// Inicializar el cliente de Google Drive
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'credentials', process.env.GOOGLE_DRIVE_CREDENTIALS_FILE || ''),
  scopes: ['https://www.googleapis.com/auth/drive'],
});

export const driveClient = google.drive({ version: 'v3', auth });

// Función para subir un archivo a Drive
export async function uploadFileToDrive(
  buffer: Buffer,
  fileName: string,
  folderId: string = DRIVE_FOLDERS.PENDING
) {
  try {
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    // Convertir el buffer a un stream
    const stream = Readable.from(buffer);

    const media = {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: stream,
    };

    const response = await driveClient.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink, webContentLink',
    });

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
    };
  } catch (error) {
    console.error('Error al subir archivo a Drive:', error);
    throw error;
  }
}

// Función para mover un archivo entre carpetas
export async function moveFileToFolder(fileId: string, targetFolderId: string) {
  try {
    // Primero obtenemos el archivo actual
    const file = await driveClient.files.get({
      fileId,
      fields: 'parents',
    });

    // Removemos el archivo de la carpeta actual
    const previousParents = file.data.parents?.join(',');
    if (previousParents) {
      await driveClient.files.update({
        fileId,
        removeParents: previousParents,
        addParents: targetFolderId,
        fields: 'id, parents',
      });
    }

    return true;
  } catch (error) {
    console.error('Error al mover archivo:', error);
    throw error;
  }
} 