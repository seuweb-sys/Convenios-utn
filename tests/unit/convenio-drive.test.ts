import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createFolderInOAuthDrive: vi.fn(),
  moveFileToFolderOAuth: vi.fn(),
}));

vi.mock("@/app/lib/google-drive", () => ({
  createFolderInOAuthDrive: mocks.createFolderInOAuthDrive,
  moveFileToFolderOAuth: mocks.moveFileToFolderOAuth,
}));

import { ensureConvenioFolder, resolveConvenioDriveAsset } from "@/app/lib/convenio-drive";

describe("convenio drive helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createFolderInOAuthDrive.mockResolvedValue({
      folderId: "folder-123",
      webViewLink: "https://drive.google.com/drive/folders/folder-123",
    });
  });

  it("recognizes legacy file and folder Drive URLs", () => {
    expect(resolveConvenioDriveAsset("https://drive.google.com/file/d/file-123/view?usp=sharing")).toEqual({
      kind: "file",
      itemId: "file-123",
      webViewLink: "https://drive.google.com/file/d/file-123/view?usp=sharing",
    });

    expect(resolveConvenioDriveAsset("https://drive.google.com/drive/folders/folder-456?usp=sharing")).toEqual({
      kind: "folder",
      itemId: "folder-456",
      webViewLink: "https://drive.google.com/drive/folders/folder-456?usp=sharing",
    });
  });

  it("returns null for empty or unsupported URLs", () => {
    expect(resolveConvenioDriveAsset(null)).toBeNull();
    expect(resolveConvenioDriveAsset("https://example.com/not-drive")).toBeNull();
  });

  it("creates a new folder when the convenio has no Drive asset yet", async () => {
    await expect(
      ensureConvenioFolder({
        convenioTitle: "Convenio Nuevo",
        parentFolderId: "pending-folder",
        currentDocumentPath: null,
      }),
    ).resolves.toEqual({
      folderId: "folder-123",
      folderWebViewLink: "https://drive.google.com/drive/folders/folder-123",
      migratedFromFile: false,
    });

    expect(mocks.createFolderInOAuthDrive).toHaveBeenCalledWith("Convenio Nuevo", "pending-folder");
    expect(mocks.moveFileToFolderOAuth).not.toHaveBeenCalled();
  });

  it("migrates a legacy file into a new folder and respects approved targets", async () => {
    await expect(
      ensureConvenioFolder({
        convenioTitle: "Convenio Aprobado",
        parentFolderId: "approved-folder",
        currentDocumentPath: "https://drive.google.com/file/d/legacy-doc/view",
      }),
    ).resolves.toEqual({
      folderId: "folder-123",
      folderWebViewLink: "https://drive.google.com/drive/folders/folder-123",
      migratedFromFile: true,
    });

    expect(mocks.createFolderInOAuthDrive).toHaveBeenCalledWith("Convenio Aprobado", "approved-folder");
    expect(mocks.moveFileToFolderOAuth).toHaveBeenCalledWith("legacy-doc", "folder-123");
  });

  it("reuses an existing folder without creating a new one", async () => {
    await expect(
      ensureConvenioFolder({
        convenioTitle: "Convenio Existente",
        parentFolderId: "pending-folder",
        currentDocumentPath: "https://drive.google.com/drive/folders/existing-folder?usp=sharing",
      }),
    ).resolves.toEqual({
      folderId: "existing-folder",
      folderWebViewLink: "https://drive.google.com/drive/folders/existing-folder?usp=sharing",
      migratedFromFile: false,
    });

    expect(mocks.createFolderInOAuthDrive).not.toHaveBeenCalled();
    expect(mocks.moveFileToFolderOAuth).not.toHaveBeenCalled();
  });
});
