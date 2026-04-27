export type DriveUploadProgress = {
  uploadedBytes: number;
  totalBytes: number;
  progress: number;
};

export type DriveUploadedFile = {
  id: string;
  name?: string;
  mimeType?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
};

export async function uploadFileToDriveInChunks({
  file,
  sessionEndpoint,
  chunkSize = 5 * 1024 * 1024,
  onProgress,
}: {
  file: File;
  sessionEndpoint: string;
  chunkSize?: number;
  onProgress?: (progress: DriveUploadProgress) => void;
}): Promise<DriveUploadedFile> {
  const sessionResponse = await fetch(sessionEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    }),
  });

  const sessionData = await sessionResponse.json().catch(() => null);
  if (!sessionResponse.ok) {
    throw new Error(sessionData?.error || 'No se pudo iniciar la subida directa a Drive');
  }

  const uploadUrl = sessionData?.uploadUrl;
  if (!uploadUrl) {
    throw new Error('No se recibio la URL de subida de Google Drive');
  }

  let uploadedBytes = 0;
  let finalGoogleResponse: DriveUploadedFile | null = null;

  while (uploadedBytes < file.size) {
    const nextByte = Math.min(uploadedBytes + chunkSize, file.size);
    const chunk = file.slice(uploadedBytes, nextByte);

    finalGoogleResponse = await uploadChunk({
      uploadUrl,
      chunk,
      start: uploadedBytes,
      end: nextByte,
      total: file.size,
      mimeType: file.type,
    });

    uploadedBytes = nextByte;
    onProgress?.({
      uploadedBytes,
      totalBytes: file.size,
      progress: Math.min(99, Math.round((uploadedBytes / file.size) * 100)),
    });
  }

  if (!finalGoogleResponse?.id) {
    throw new Error('Google Drive no devolvio el ID del archivo subido');
  }

  onProgress?.({ uploadedBytes: file.size, totalBytes: file.size, progress: 100 });
  return finalGoogleResponse;
}

function uploadChunk({
  uploadUrl,
  chunk,
  start,
  end,
  total,
  mimeType,
}: {
  uploadUrl: string;
  chunk: Blob;
  start: number;
  end: number;
  total: number;
  mimeType: string;
}): Promise<DriveUploadedFile | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.setRequestHeader('Content-Range', `bytes ${start}-${end - 1}/${total}`);

    xhr.onload = () => {
      if (xhr.status === 308) {
        resolve(null);
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null);
        } catch {
          reject(new Error('Google Drive termino la subida pero devolvio una respuesta invalida'));
        }
        return;
      }

      reject(new Error(xhr.responseText || `Error subiendo chunk a Google Drive (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error('Error de red subiendo el archivo a Google Drive'));
    xhr.send(chunk);
  });
}
