import { createFolderInOAuthDrive, moveFileToFolderOAuth } from "@/app/lib/google-drive";

export type DriveAssetKind = "file" | "folder";

export type ConvenioDriveAsset = {
  kind: DriveAssetKind;
  itemId: string;
  webViewLink: string;
};

type EnsureConvenioFolderArgs = {
  convenioTitle: string;
  parentFolderId: string;
  currentDocumentPath?: string | null;
};

const FOLDER_URL_REGEX = /\/folders\/([^/?]+)/i;
const FILE_URL_REGEX = /\/d\/([^/?]+)/i;

export function resolveConvenioDriveAsset(documentPath?: string | null): ConvenioDriveAsset | null {
  if (!documentPath) return null;

  const folderMatch = documentPath.match(FOLDER_URL_REGEX);
  if (folderMatch?.[1]) {
    return {
      kind: "folder",
      itemId: folderMatch[1],
      webViewLink: documentPath,
    };
  }

  const fileMatch = documentPath.match(FILE_URL_REGEX);
  if (fileMatch?.[1]) {
    return {
      kind: "file",
      itemId: fileMatch[1],
      webViewLink: documentPath,
    };
  }

  return null;
}

export async function ensureConvenioFolder({
  convenioTitle,
  parentFolderId,
  currentDocumentPath,
}: EnsureConvenioFolderArgs): Promise<{
  folderId: string;
  folderWebViewLink: string;
  migratedFromFile: boolean;
}> {
  const currentAsset = resolveConvenioDriveAsset(currentDocumentPath);

  if (currentAsset?.kind === "folder") {
    return {
      folderId: currentAsset.itemId,
      folderWebViewLink: currentAsset.webViewLink,
      migratedFromFile: false,
    };
  }

  const folderResponse = await createFolderInOAuthDrive(convenioTitle, parentFolderId);

  if (!folderResponse.folderId || !folderResponse.webViewLink) {
    throw new Error("No se pudo crear la carpeta del convenio en Google Drive");
  }

  if (currentAsset?.kind === "file") {
    await moveFileToFolderOAuth(currentAsset.itemId, folderResponse.folderId);
  }

  return {
    folderId: folderResponse.folderId,
    folderWebViewLink: folderResponse.webViewLink,
    migratedFromFile: currentAsset?.kind === "file",
  };
}
