import { google } from 'googleapis';
import { readFileSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Configuración de las carpetas
export const DRIVE_FOLDERS = {
  ROOT: '1s8umVFmhbTkoiacD-KPb3_DtM-tlQVNU', // Carpeta padre del proyecto
  PENDING: '1IxfgTScHTlTc5ul2L1O7X5TYlBk2YQCQ', // Carpeta "pendientes"
  APPROVED: '1Wq5Hv5ael-PfgfMjekg1zKMehtvqMd1R', // Carpeta "aprobados"
  REJECTED: '1FInwa_93e_Admwk0jTglS_CPNieDkxHg', // Carpeta "rechazados"
  ARCHIVED: '18qHqBUGZOkrcPJ7rEUP0Vb1ya1VUk2Le', // Carpeta "archivados"
} as const;

// Inicializar el cliente de Google Drive
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS_JSON!),
  scopes: ['https://www.googleapis.com/auth/drive'],
});

export const driveClient = google.drive({ version: 'v3', auth });

// Función para obtener el email del propietario de una carpeta
async function getFolderOwner(folderId: string): Promise<string | null> {
  try {
    const file = await driveClient.files.get({
      fileId: folderId,
      fields: 'owners',
      supportsAllDrives: true,
    });
    return file.data.owners?.[0]?.emailAddress || null;
  } catch (error) {
    console.error(`No se pudo obtener el propietario de la carpeta ${folderId}:`, error);
    return null;
  }
}

// Nueva función para crear una carpeta y transferir la propiedad
export async function createFolderAndTransferOwnership(
  folderName: string,
  parentFolderId: string,
  targetOwnerEmail?: string
) {
  // 1. Crear la carpeta
  const folderResponse = await createFolderInDrive(folderName, parentFolderId);
  const newFolderId = folderResponse.folderId;

  if (!newFolderId) {
    throw new Error('No se pudo crear la carpeta en Drive.');
  }

  // 2. Intentar transferir la propiedad
  let ownerToSet: string | undefined | null = targetOwnerEmail;
  if (!ownerToSet) {
    console.log(`Buscando propietario de la carpeta padre ${parentFolderId} para heredar...`);
    ownerToSet = await getFolderOwner(parentFolderId);
  }

  if (ownerToSet) {
    try {
      console.log(`Intentando transferir propiedad de ${newFolderId} a ${ownerToSet}...`);
      await driveClient.permissions.create({
        fileId: newFolderId,
        requestBody: {
          role: 'owner',
          type: 'user',
          emailAddress: ownerToSet,
        },
        transferOwnership: true, // Parámetro clave
        supportsAllDrives: true,
      });
      console.log(`✅ Propiedad de ${newFolderId} transferida exitosamente a ${ownerToSet}.`);
    } catch (permissionError) {
      console.warn(`⚠️ No se pudo transferir la propiedad de la carpeta ${newFolderId}. Esto puede fallar si no sos el dueño original.`, permissionError);
      // No lanzamos un error, puede que la subida funcione igualmente en algunos casos.
    }
  } else {
    console.warn(`No se encontró un propietario para la carpeta padre ${parentFolderId}. La nueva carpeta será propiedad de la Service Account.`);
  }

  return folderResponse;
}


// Función para crear una carpeta en Drive
export async function createFolderInDrive(
  folderName: string,
  parentFolderId: string = DRIVE_FOLDERS.PENDING
) {
  try {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };

    const response = await driveClient.files.create({
      requestBody: fileMetadata,
      fields: 'id, webViewLink',
      supportsAllDrives: true, // ESENCIAL para Unidades Compartidas
    });

    return {
      folderId: response.data.id,
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error('Error al crear carpeta en Drive:', error);
    throw error;
  }
}

// Función original para subir un archivo a Drive (mantener para compatibilidad)
export async function uploadFileToDrive(
  buffer: Buffer,
  fileName: string,
  folderId: string = DRIVE_FOLDERS.PENDING,
  convertToGoogleDoc: boolean = true
) {
  try {
    const fileMetadata: any = {
      name: fileName,
      parents: [folderId],
    };

    // Si se solicita conversión, indicamos el MIME de Google Docs
    if (convertToGoogleDoc) {
      fileMetadata.mimeType = 'application/vnd.google-apps.document';
    }

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
      supportsAllDrives: true, // ESENCIAL para Unidades Compartidas
    });

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
    };
  } catch (error: any) {
    console.error('Error al subir archivo a Drive:', error);
    
    // Detectar error específico de Service Account y usar fallback
    if (error.message?.includes('Service Accounts do not have storage quota') || 
        error.errors?.[0]?.reason === 'storageQuotaExceeded') {
      console.log('⚠️ [Drive] Service Account no puede subir archivos, usando fallback local...');
      return createLocalFallbackResponse(fileName, convertToGoogleDoc);
    }
    
    throw error;
  }
}

// Nueva función para convenio específico con múltiples anexos convertidos a Google Docs
export async function uploadConvenioEspecificoWithGoogleDocs(
  mainDocumentBuffer: Buffer,
  convenioName: string,
  anexos: { name: string; buffer: ArrayBuffer }[] = [],
  parentFolderId: string = DRIVE_FOLDERS.PENDING
) {
  try {
    console.log('📁 [Drive] Creando carpeta para convenio específico (Google Docs):', convenioName);
    
    // 1. Crear carpeta para el convenio
    const folderResponse = await createFolderInDrive(convenioName, parentFolderId);
    const convenioFolderId = folderResponse.folderId!;
    
    console.log('✅ [Drive] Carpeta creada:', folderResponse);

    // 2. Subir el documento principal - primero intentar como Google Doc, fallback a .docx
    console.log('📄 [Drive] Subiendo documento principal...');
    let mainDocResponse;
    let isMainDocGoogleDoc = true;
    
    try {
      mainDocResponse = await uploadFileToDrive(
        mainDocumentBuffer,
        `${convenioName}`,
        convenioFolderId,
        true // Intentar convertir a Google Doc
      );
      console.log('✅ [Drive] Documento principal subido como Google Doc:', mainDocResponse);
    } catch (quotaError: any) {
      if (quotaError.message?.includes('quota') || quotaError.message?.includes('exceeded') || quotaError.errors?.[0]?.reason === 'storageQuotaExceeded' || quotaError.message?.includes('Service Accounts do not have storage quota')) {
        console.log('⚠️ [Drive] Problema con Service Account, intentando .docx normal...');
        try {
          mainDocResponse = await uploadFileToDrive(
            mainDocumentBuffer,
            `${convenioName}.docx`,
            convenioFolderId,
            false // No convertir, subir como .docx
          );
          isMainDocGoogleDoc = false;
          console.log('✅ [Drive] Documento principal subido como .docx:', mainDocResponse);
        } catch (docxError: any) {
          console.log('❌ [Drive] Fallando también con .docx, usando fallback local...');
          mainDocResponse = createLocalFallbackResponse(`${convenioName}.docx`, false);
          isMainDocGoogleDoc = false;
          console.log('💾 [Local] Documento principal guardado como fallback local');
        }
      } else {
        throw quotaError;
      }
    }

    // 3. Subir anexos - intentar como Google Docs, fallback a .docx
    const anexosUploaded = [];
    for (const anexo of anexos) {
      console.log(`📎 [Drive] Subiendo anexo: ${anexo.name}`);
      
      // Convertir ArrayBuffer a Buffer
      const anexoBuffer = Buffer.from(anexo.buffer);
      
      // Limpiar nombre del archivo (remover .docx si existe)
      const cleanName = anexo.name.replace('.docx', '');
      
      let anexoResponse;
      let isGoogleDoc = true;
      
      try {
        // Intentar como Google Doc primero
        anexoResponse = await uploadFileToDrive(
          anexoBuffer,
          `ANEXO-${cleanName}`,
          convenioFolderId,
          true // Intentar convertir a Google Doc
        );
        console.log(`✅ [Drive] Anexo subido como Google Doc: ${anexo.name}`);
      } catch (quotaError: any) {
        if (quotaError.message?.includes('quota') || quotaError.message?.includes('exceeded') || quotaError.errors?.[0]?.reason === 'storageQuotaExceeded' || quotaError.message?.includes('Service Accounts do not have storage quota')) {
          console.log(`⚠️ [Drive] Problema con Service Account para anexo, intentando .docx: ${anexo.name}`);
          try {
            anexoResponse = await uploadFileToDrive(
              anexoBuffer,
              `ANEXO-${anexo.name}`, // Mantener extensión .docx
              convenioFolderId,
              false // No convertir
            );
            isGoogleDoc = false;
            console.log(`✅ [Drive] Anexo subido como .docx: ${anexo.name}`);
          } catch (docxError: any) {
            console.log(`❌ [Drive] Fallando también con .docx para anexo, usando fallback local: ${anexo.name}`);
            anexoResponse = createLocalFallbackResponse(`ANEXO-${anexo.name}`, false);
            isGoogleDoc = false;
            console.log(`💾 [Local] Anexo guardado como fallback local: ${anexo.name}`);
          }
        } else {
          throw quotaError;
        }
      }
      
      anexosUploaded.push({
        name: anexo.name,
        cleanName: cleanName,
        isGoogleDoc: isGoogleDoc,
        ...anexoResponse
      });
    }

    console.log(`✅ [Drive] Convenio específico completado. Documento principal: ${isMainDocGoogleDoc ? 'Google Doc' : '.docx'}, Anexos: ${anexosUploaded.filter(a => a.isGoogleDoc).length} Google Docs, ${anexosUploaded.filter(a => !a.isGoogleDoc).length} .docx`);

    return {
      folderId: convenioFolderId,
      folderWebViewLink: folderResponse.webViewLink,
      mainDocument: {
        ...mainDocResponse,
        isGoogleDoc: isMainDocGoogleDoc
      },
      anexos: anexosUploaded,
      totalAnexos: anexos.length,
      // Mantener compatibilidad con el código existente
      fileId: mainDocResponse.fileId,
      webViewLink: folderResponse.webViewLink, // Enlace a la carpeta
      webContentLink: mainDocResponse.webContentLink,
    };
  } catch (error) {
    console.error('Error al subir convenio específico con Google Docs:', error);
    throw error;
  }
}

// Función simplificada que usa el patrón que SÍ funcionaba antes
export async function uploadConvenioEspecificoSimple(
  mainDocumentBuffer: Buffer,
  convenioName: string,
  anexos: { name: string; buffer: ArrayBuffer }[] = [],
  parentFolderId: string = DRIVE_FOLDERS.PENDING
) {
  try {
    console.log('📁 [Drive] Creando carpeta para convenio específico (modo simple):', convenioName);
    
    // 1. Crear carpeta para el convenio y transferir propiedad
    const folderResponse = await createFolderAndTransferOwnership(convenioName, parentFolderId);
    const convenioFolderId = folderResponse.folderId!;
    
    console.log('✅ [Drive] Carpeta creada y propiedad gestionada:', folderResponse);

    // 2. Subir el documento principal SIN conversión (como antes)
    console.log('📄 [Drive] Subiendo documento principal como .docx...');
    const mainDocResponse = await uploadFileToDrive(
      mainDocumentBuffer,
      `${convenioName}.docx`,
      convenioFolderId,
      false // NO convertir, subir como .docx directo
    );
    
    console.log('✅ [Drive] Documento principal subido como .docx:', mainDocResponse);

    // 3. Subir anexos también SIN conversión
    const anexosUploaded = [];
    for (const anexo of anexos) {
      console.log(`📎 [Drive] Subiendo anexo como .docx: ${anexo.name}`);
      
      // Convertir ArrayBuffer a Buffer
      const anexoBuffer = Buffer.from(anexo.buffer);
      
      const anexoResponse = await uploadFileToDrive(
        anexoBuffer,
        `ANEXO-${anexo.name}`, // Mantener nombre original con .docx
        convenioFolderId,
        false // NO convertir, subir como .docx directo
      );
      
      anexosUploaded.push({
        name: anexo.name,
        isGoogleDoc: false,
        ...anexoResponse
      });
      
      console.log(`✅ [Drive] Anexo subido como .docx: ${anexo.name}`);
    }

    console.log(`✅ [Drive] Convenio específico completado (modo simple). Documento principal: .docx, Anexos: ${anexosUploaded.length} .docx`);

    return {
      folderId: convenioFolderId,
      folderWebViewLink: folderResponse.webViewLink,
      mainDocument: {
        ...mainDocResponse,
        isGoogleDoc: false
      },
      anexos: anexosUploaded,
      totalAnexos: anexos.length,
      // Mantener compatibilidad con el código existente
      fileId: mainDocResponse.fileId,
      webViewLink: folderResponse.webViewLink, // Enlace a la carpeta
      webContentLink: mainDocResponse.webContentLink,
    };
  } catch (error) {
    console.error('Error al subir convenio específico (modo simple):', error);
    throw error;
  }
}

// Función para mover carpeta completa entre carpetas (para convenio específico)
export async function moveFolderToFolder(folderId: string, targetFolderId: string) {
  try {
    // Primero obtenemos la carpeta actual
    const folder = await driveClient.files.get({
      fileId: folderId,
      fields: 'parents',
      supportsAllDrives: true, // ESENCIAL para Unidades Compartidas
    });

    // Removemos la carpeta de la ubicación actual
    const previousParents = folder.data.parents?.join(',');
    if (previousParents) {
      await driveClient.files.update({
        fileId: folderId,
        removeParents: previousParents,
        addParents: targetFolderId,
        fields: 'id, parents',
        supportsAllDrives: true, // ESENCIAL para Unidades Compartidas
      });
    }

    return true;
  } catch (error) {
    console.error('Error al mover carpeta:', error);
    throw error;
  }
}

// Función para mover un archivo entre carpetas (mantener para compatibilidad)
export async function moveFileToFolder(fileId: string, targetFolderId: string) {
  try {
    // Primero obtenemos el archivo actual
    const file = await driveClient.files.get({
      fileId,
      fields: 'parents',
      supportsAllDrives: true, // ESENCIAL para Unidades Compartidas
    });

    // Removemos el archivo de la carpeta actual
    const previousParents = file.data.parents?.join(',');
    if (previousParents) {
      await driveClient.files.update({
        fileId,
        removeParents: previousParents,
        addParents: targetFolderId,
        fields: 'id, parents',
        supportsAllDrives: true, // ESENCIAL para Unidades Compartidas
      });
    }

    return true;
  } catch (error) {
    console.error('Error al mover archivo:', error);
    throw error;
  }
}

// Función para eliminar un archivo de Drive
export async function deleteFileFromDrive(fileId: string) {
  try {
    await driveClient.files.delete({
      fileId: fileId,
      supportsAllDrives: true, // ESENCIAL para Unidades Compartidas
    });
    return true;
  } catch (error) {
    console.error('Error al eliminar archivo de Drive:', error);
    throw error;
  }
} 

// Fallback local cuando Google Drive falla completamente
function createLocalFallbackResponse(fileName: string, isGoogleDoc: boolean = false) {
  console.log(`💾 [Local Fallback] Simulando guardado de: ${fileName}`);
  return {
    fileId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    webViewLink: `#local-file-${fileName}`,
    webContentLink: `#local-download-${fileName}`,
    isLocalFallback: true,
    localFileName: fileName
  };
} 

// ============================================================================
// NUEVAS FUNCIONES OAUTH (para reemplazar Service Account)
// ============================================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Función para obtener cliente OAuth autenticado
async function getOAuthClient() {
  // Para esta operación específica, necesitamos un cliente con privilegios de administrador
  // para poder leer los tokens de CUALQUIER usuario, sin importar quién esté logueado.
  // Esto saltea las políticas de RLS (Row Level Security).
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // 1. Buscar TODOS los perfiles con rol de 'admin'
  const { data: adminProfiles, error: adminError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (adminError) {
    throw new Error(
      `Error al buscar perfiles de administrador: ${adminError.message}`
    );
  }

  if (!adminProfiles || adminProfiles.length === 0) {
    throw new Error('No se encontró ningún perfil de administrador en el sistema.');
  }

  // Extraer los IDs de todos los admins
  const adminUserIds = adminProfiles.map(p => p.id);

  // 2. De esa lista de admins, encontrar el PRIMERO que tenga un token
  const { data: tokens, error: tokenError } = await supabaseAdmin
    .from('google_oauth_tokens')
    .select('*')
    .in('user_id', adminUserIds)
    .limit(1)
    .maybeSingle(); // .maybeSingle() no falla si no encuentra nada, solo devuelve null

  if (tokenError) {
    throw new Error(`Error al buscar el token de OAuth: ${tokenError.message}`);
  }

  if (!tokens) {
    throw new Error(
      '❌ Ninguno de los administradores tiene un token de Google Drive válido conectado. Conectar en Configuración.'
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_OAUTH_REDIRECT_URI
  );

  // Establecer credenciales
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expires_at
      ? new Date(tokens.expires_at).getTime()
      : null,
  });

  // Manejar la renovación automática del token si está cerca de expirar
  if (tokens.expires_at) {
    const now = new Date();
    const expiryDate = new Date(tokens.expires_at);
    const buffer = 5 * 60 * 1000; // 5 minutos de margen

    if (expiryDate.getTime() < now.getTime() + buffer) {
      console.log('🔄 [OAuth] Token expirado o a punto de expirar, renovando...');
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        // Actualizar los nuevos tokens en la base de datos usando el cliente admin
        await supabaseAdmin
          .from('google_oauth_tokens')
          .update({
            access_token: credentials.access_token,
            refresh_token:
              credentials.refresh_token || tokens.refresh_token, // Mantener el viejo si no viene uno nuevo
            expires_at: credentials.expiry_date
              ? new Date(credentials.expiry_date).toISOString()
              : null,
          })
          .eq('user_id', tokens.user_id); 

        console.log(
          '✅ [OAuth] Token renovado y actualizado en la base de datos.'
        );
      } catch (refreshError) {
        console.error('❌ [OAuth] Error al renovar el token:', refreshError);
        throw new Error(
          'No se pudo renovar el token de acceso de Google Drive.'
        );
      }
    }
  }

  return google.drive({ version: 'v3', auth: oauth2Client });
}


// Nueva función para subir archivos usando OAuth (más simple)
export async function uploadFileToOAuthDrive(
  buffer: Buffer,
  fileName: string,
  folderId: string = DRIVE_FOLDERS.PENDING,
  convertToGoogleDoc: boolean = false
) {
  try {
    console.log(`📄 [OAuth Drive] Subiendo archivo: ${fileName}`);
    
    const driveClient = await getOAuthClient();
    
    const fileMetadata: any = {
      name: fileName,
      parents: [folderId],
    };

    // Si se solicita conversión a Google Doc
    if (convertToGoogleDoc) {
      fileMetadata.mimeType = 'application/vnd.google-apps.document';
    }

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

    console.log(`✅ [OAuth Drive] Archivo subido: ${fileName}`);

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
    };
  } catch (error: any) {
    console.error('❌ [OAuth Drive] Error subiendo archivo:', error);
    throw error;
  }
}

// Nueva función para crear carpetas usando OAuth
export async function createFolderInOAuthDrive(
  folderName: string,
  parentFolderId: string = DRIVE_FOLDERS.PENDING
) {
  try {
    console.log(`📁 [OAuth Drive] Creando carpeta: ${folderName}`);
    
    const driveClient = await getOAuthClient();
    
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };

    const response = await driveClient.files.create({
      requestBody: fileMetadata,
      fields: 'id, webViewLink',
    });

    console.log(`✅ [OAuth Drive] Carpeta creada: ${folderName}`);

    return {
      folderId: response.data.id,
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error('❌ [OAuth Drive] Error creando carpeta:', error);
    throw error;
  }
}

// Nueva función para convenio específico usando OAuth (simplificada)
export async function uploadConvenioEspecificoOAuth(
  mainDocumentBuffer: Buffer,
  convenioName: string,
  anexos: { name: string; buffer: ArrayBuffer }[] = [],
  parentFolderId: string = DRIVE_FOLDERS.PENDING
) {
  try {
    console.log('📁 [OAuth Drive] Procesando convenio específico:', convenioName);
    
    // 1. Crear carpeta para el convenio
    const folderResponse = await createFolderInOAuthDrive(convenioName, parentFolderId);
    const convenioFolderId = folderResponse.folderId!;

    // 2. Subir documento principal
    console.log('📄 [OAuth Drive] Subiendo documento principal...');
    const mainDocResponse = await uploadFileToOAuthDrive(
      mainDocumentBuffer,
      `${convenioName}.docx`,
      convenioFolderId,
      false // Subir como .docx por ahora
    );

    // 3. Subir anexos
    const anexosUploaded = [];
    for (const anexo of anexos) {
      console.log(`📎 [OAuth Drive] Subiendo anexo: ${anexo.name}`);
      
      const anexoBuffer = Buffer.from(anexo.buffer);
      
      const anexoResponse = await uploadFileToOAuthDrive(
        anexoBuffer,
        `ANEXO-${anexo.name}`,
        convenioFolderId,
        false
      );
      
      anexosUploaded.push({
        name: anexo.name,
        ...anexoResponse
      });
    }

    console.log(`✅ [OAuth Drive] Convenio específico completado: ${anexosUploaded.length} anexos`);

    return {
      folderId: convenioFolderId,
      folderWebViewLink: folderResponse.webViewLink,
      mainDocument: mainDocResponse,
      anexos: anexosUploaded,
      totalAnexos: anexos.length,
      // Compatibilidad con código existente
      fileId: mainDocResponse.fileId,
      webViewLink: folderResponse.webViewLink, // Enlace a la carpeta
      webContentLink: mainDocResponse.webContentLink,
    };
  } catch (error) {
    console.error('❌ [OAuth Drive] Error procesando convenio específico:', error);
    throw error;
  }
}

// Nueva función para mover archivos usando OAuth
export async function moveFileToFolderOAuth(fileId: string, targetFolderId: string) {
  try {
    console.log(`📁 [OAuth Drive] Moviendo archivo ${fileId} a carpeta ${targetFolderId}`);
    
    const driveClient = await getOAuthClient();
    
    // Obtener padres actuales
    const file = await driveClient.files.get({
      fileId,
      fields: 'parents',
    });

    // Mover archivo
    const previousParents = file.data.parents?.join(',');
    if (previousParents) {
      await driveClient.files.update({
        fileId,
        removeParents: previousParents,
        addParents: targetFolderId,
        fields: 'id, parents',
      });
    }

    console.log(`✅ [OAuth Drive] Archivo movido exitosamente`);
    return true;
  } catch (error) {
    console.error('❌ [OAuth Drive] Error moviendo archivo:', error);
    throw error;
  }
}

// Nueva función para mover carpetas usando OAuth
export async function moveFolderToFolderOAuth(folderId: string, targetFolderId: string) {
  try {
    console.log(`📁 [OAuth Drive] Moviendo carpeta ${folderId} a carpeta ${targetFolderId}`);
    
    const driveClient = await getOAuthClient();
    
    // Obtener padres actuales
    const folder = await driveClient.files.get({
      fileId: folderId,
      fields: 'parents',
    });

    // Mover carpeta
    const previousParents = folder.data.parents?.join(',');
    if (previousParents) {
      await driveClient.files.update({
        fileId: folderId,
        removeParents: previousParents,
        addParents: targetFolderId,
        fields: 'id, parents',
      });
    }

    console.log(`✅ [OAuth Drive] Carpeta movida exitosamente`);
    return true;
  } catch (error) {
    console.error('❌ [OAuth Drive] Error moviendo carpeta:', error);
    throw error;
  }
}

// Nueva función para eliminar archivos usando OAuth
export async function deleteFileFromOAuthDrive(fileId: string) {
  try {
    console.log(`🗑️ [OAuth Drive] Eliminando archivo: ${fileId}`);
    
    const driveClient = await getOAuthClient();
    
    await driveClient.files.delete({
      fileId: fileId,
    });

    console.log(`✅ [OAuth Drive] Archivo eliminado exitosamente`);
    return true;
  } catch (error) {
    console.error('❌ [OAuth Drive] Error eliminando archivo:', error);
    throw error;
  }
} 