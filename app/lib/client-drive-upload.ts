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

type DriveUploadSession = {
  uploadUrl: string;
  finalizeEndpoint?: string;
  fileName?: string;
  folderId?: string;
  fileSize?: number;
  mimeType?: string;
};

type DriveUploadDeps = {
  createSession?: (input: { file: File; sessionEndpoint: string }) => Promise<DriveUploadSession>;
  uploadChunk?: typeof uploadChunk;
  finalizeUpload?: typeof finalizeDriveUpload;
};

async function createDriveUploadSession({
  file,
  sessionEndpoint,
}: {
  file: File;
  sessionEndpoint: string;
}): Promise<DriveUploadSession> {
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

  return {
    uploadUrl,
    finalizeEndpoint: sessionData?.finalizeEndpoint,
    fileName: sessionData?.fileName,
    folderId: sessionData?.folderId,
    fileSize: typeof sessionData?.fileSize === 'number' ? sessionData.fileSize : undefined,
    mimeType: sessionData?.mimeType,
  };
}

export async function uploadFileToDriveInChunks({
  file,
  sessionEndpoint,
  chunkSize = 5 * 1024 * 1024,
  onProgress,
  deps,
}: {
  file: File;
  sessionEndpoint: string;
  chunkSize?: number;
  onProgress?: (progress: DriveUploadProgress) => void;
  deps?: DriveUploadDeps;
}): Promise<DriveUploadedFile> {
  const createSession = deps?.createSession ?? createDriveUploadSession;
  const uploadChunkWithTransport = deps?.uploadChunk ?? uploadChunk;
  const finalizeUpload = deps?.finalizeUpload ?? finalizeDriveUpload;
  const session = await createSession({ file, sessionEndpoint });
  const { uploadUrl } = session;

  let uploadedBytes = 0;
  let finalGoogleResponse: DriveUploadedFile | null = null;

  while (uploadedBytes < file.size) {
    const nextByte = Math.min(uploadedBytes + chunkSize, file.size);
    const chunk = file.slice(uploadedBytes, nextByte);
    const isFinalChunk = nextByte === file.size;

    try {
      finalGoogleResponse = await uploadChunkWithTransport({
        uploadUrl,
        chunk,
        start: uploadedBytes,
        end: nextByte,
        total: file.size,
        mimeType: file.type,
      });
    } catch (error) {
      if (!isFinalChunk || !session.finalizeEndpoint) {
        throw error;
      }

      finalGoogleResponse = await finalizeUpload({
        finalizeEndpoint: session.finalizeEndpoint,
        fileName: session.fileName ?? file.name,
        fileSize: session.fileSize ?? file.size,
        mimeType: session.mimeType ?? file.type,
        folderId: session.folderId,
      });
    }

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

async function finalizeDriveUpload({
  finalizeEndpoint,
  fileName,
  fileSize,
  mimeType,
  folderId,
}: {
  finalizeEndpoint: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  folderId?: string;
}): Promise<DriveUploadedFile> {
  const response = await fetch(finalizeEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, fileSize, mimeType, folderId }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || 'No se pudo recuperar el archivo subido desde Google Drive');
  }

  if (!data?.id) {
    throw new Error('La recuperación del archivo en Google Drive no devolvió un ID');
  }

  return data as DriveUploadedFile;
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
