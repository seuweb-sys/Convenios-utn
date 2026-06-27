import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockEnsureConvenioFolder: vi.fn(),
  mockUploadFileToOAuthDriveWithMimeType: vi.fn(),
  mockMoveFileToFolderOAuth: vi.fn(),
  mockCreateOAuthDriveResumableUploadSession: vi.fn(),
  mockFindOAuthDriveFileByNameWithRetry: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: mocks.mockCreateClient,
}));

vi.mock("@/app/lib/convenio-drive", () => ({
  ensureConvenioFolder: mocks.mockEnsureConvenioFolder,
}));

vi.mock("@/app/lib/google-drive", () => ({
  DRIVE_FOLDERS: {
    APPROVED: "approved-folder",
  },
  uploadFileToOAuthDriveWithMimeType: mocks.mockUploadFileToOAuthDriveWithMimeType,
  createFolderInOAuthDrive: vi.fn(),
  moveFileToFolderOAuth: mocks.mockMoveFileToFolderOAuth,
  createOAuthDriveResumableUploadSession: mocks.mockCreateOAuthDriveResumableUploadSession,
  findOAuthDriveFileByNameWithRetry: mocks.mockFindOAuthDriveFileByNameWithRetry,
}));

import { POST as postSignedPdf } from "@/app/api/admin/convenios/[id]/signed-pdf/route";
import { POST as postFinalizeUpload } from "@/app/api/admin/convenios/[id]/signed-pdf/finalize-upload/route";
import { POST as postResumableSession } from "@/app/api/admin/convenios/[id]/signed-pdf/resumable-session/route";

function createSupabaseDouble(documentPath: string) {
  const calls = {
    convenios: [] as any[],
  };

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } } }),
    },
    from(table: string) {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({ data: { role: "admin" }, error: null })),
            })),
          })),
        };
      }

      if (table === "convenios") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: {
                  id: "conv-1",
                  title: "Convenio Firmado",
                  document_path: documentPath,
                  convenio_type_id: 2,
                  status: "aprobado",
                },
                error: null,
              })),
            })),
          })),
          update: vi.fn((payload: any) => {
            calls.convenios.push(payload);
            return { eq: vi.fn(async () => ({ error: null })) };
          }),
        };
      }

      return {
        insert: vi.fn(async () => ({ error: null })),
      };
    },
  };

  return { supabase, calls };
}

describe("admin signed PDF folderized storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockEnsureConvenioFolder.mockResolvedValue({
      folderId: "approved-convenio-folder",
      folderWebViewLink: "https://drive.google.com/drive/folders/approved-convenio-folder",
      migratedFromFile: true,
    });
    mocks.mockUploadFileToOAuthDriveWithMimeType.mockResolvedValue({
      webViewLink: "https://drive.google.com/file/d/signed-pdf/view",
    });
    mocks.mockCreateOAuthDriveResumableUploadSession.mockResolvedValue({
      uploadUrl: "https://upload.example.com/session",
      expiresIn: "one-week",
    });
    mocks.mockFindOAuthDriveFileByNameWithRetry.mockResolvedValue({
      id: "signed-pdf-drive-id",
      name: "FIRMADO-Convenio Firmado.pdf",
      mimeType: "application/pdf",
      size: "1024",
      webViewLink: "https://drive.google.com/file/d/signed-pdf-drive-id/view",
      webContentLink: "https://drive.google.com/uc?id=signed-pdf-drive-id",
    });
  });

  it("migrates legacy approved convenios into APPROVED folders before uploading the signed PDF", async () => {
    const ctx = createSupabaseDouble("https://drive.google.com/file/d/legacy-doc/view");
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const formData = new FormData();
    formData.append("file", new File([Buffer.from("pdf")], "firmado.pdf", { type: "application/pdf" }));

    const response = await postSignedPdf(
      new Request("http://localhost/api/admin/convenios/conv-1/signed-pdf", {
        method: "POST",
        body: formData,
      }),
      { params: { id: "conv-1" } },
    );

    expect(response.status).toBe(200);
    expect(mocks.mockEnsureConvenioFolder).toHaveBeenCalledWith({
      convenioTitle: "Convenio_Convenio Firmado_firmado",
      parentFolderId: "approved-folder",
      currentDocumentPath: "https://drive.google.com/file/d/legacy-doc/view",
    });
    expect(mocks.mockUploadFileToOAuthDriveWithMimeType).toHaveBeenCalledWith(
      expect.any(Buffer),
      "FIRMADO-Convenio Firmado.pdf",
      "approved-convenio-folder",
      "application/pdf",
    );
    expect(ctx.calls.convenios[0]).toMatchObject({
      document_path: "https://drive.google.com/drive/folders/approved-convenio-folder",
      signed_pdf_path: "https://drive.google.com/file/d/signed-pdf/view",
      signed_pdf_uploaded_by: "admin-1",
    });
  });

  it("creates resumable sessions against the resolved convenio folder", async () => {
    const ctx = createSupabaseDouble("https://drive.google.com/file/d/legacy-doc/view");
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = await postResumableSession(
      new Request("http://localhost/api/admin/convenios/conv-1/signed-pdf/resumable-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: "firmado.pdf",
          mimeType: "application/pdf",
          fileSize: 1024,
        }),
      }),
      { params: { id: "conv-1" } },
    );

    expect(response.status).toBe(200);
    expect(mocks.mockEnsureConvenioFolder).toHaveBeenCalledWith({
      convenioTitle: "Convenio_Convenio Firmado_firmado",
      parentFolderId: "approved-folder",
      currentDocumentPath: "https://drive.google.com/file/d/legacy-doc/view",
    });
    expect(mocks.mockCreateOAuthDriveResumableUploadSession).toHaveBeenCalledWith({
      fileName: "FIRMADO-Convenio Firmado.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
      folderId: "approved-convenio-folder",
    });
    await expect(response.json()).resolves.toMatchObject({
      uploadUrl: "https://upload.example.com/session",
      folderId: "approved-convenio-folder",
      fileName: "FIRMADO-Convenio Firmado.pdf",
      fileSize: 1024,
      mimeType: "application/pdf",
      finalizeEndpoint: "/api/admin/convenios/conv-1/signed-pdf/finalize-upload",
    });
    expect(ctx.calls.convenios[0]).toMatchObject({
      document_path: "https://drive.google.com/drive/folders/approved-convenio-folder",
    });
  });

  it("looks up finalized signed PDF metadata in Drive after a client-side final chunk failure", async () => {
    const ctx = createSupabaseDouble("https://drive.google.com/file/d/legacy-doc/view");
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = await postFinalizeUpload(
      new Request("http://localhost/api/admin/convenios/conv-1/signed-pdf/finalize-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: "FIRMADO-Convenio Firmado.pdf",
          mimeType: "application/pdf",
          fileSize: 1024,
          folderId: "approved-convenio-folder",
        }),
      }),
      { params: { id: "conv-1" } },
    );

    expect(response.status).toBe(200);
    expect(mocks.mockFindOAuthDriveFileByNameWithRetry).toHaveBeenCalledWith({
      folderId: "approved-convenio-folder",
      fileName: "FIRMADO-Convenio Firmado.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
    });
    await expect(response.json()).resolves.toEqual({
      id: "signed-pdf-drive-id",
      name: "FIRMADO-Convenio Firmado.pdf",
      mimeType: "application/pdf",
      size: "1024",
      webViewLink: "https://drive.google.com/file/d/signed-pdf-drive-id/view",
      webContentLink: "https://drive.google.com/uc?id=signed-pdf-drive-id",
    });
  });

  it("uploads signed PDFs into an existing folderized convenio without remigrating it", async () => {
    mocks.mockEnsureConvenioFolder.mockResolvedValueOnce({
      folderId: "existing-folder",
      folderWebViewLink: "https://drive.google.com/drive/folders/existing-folder",
      migratedFromFile: false,
    });

    const ctx = createSupabaseDouble("https://drive.google.com/drive/folders/existing-folder");
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const formData = new FormData();
    formData.append("file", new File([Buffer.from("pdf")], "firmado.pdf", { type: "application/pdf" }));

    const response = await postSignedPdf(
      new Request("http://localhost/api/admin/convenios/conv-1/signed-pdf", {
        method: "POST",
        body: formData,
      }),
      { params: { id: "conv-1" } },
    );

    expect(response.status).toBe(200);
    expect(mocks.mockEnsureConvenioFolder).toHaveBeenCalledWith({
      convenioTitle: "Convenio_Convenio Firmado_firmado",
      parentFolderId: "approved-folder",
      currentDocumentPath: "https://drive.google.com/drive/folders/existing-folder",
    });
    expect(mocks.mockUploadFileToOAuthDriveWithMimeType).toHaveBeenCalledWith(
      expect.any(Buffer),
      "FIRMADO-Convenio Firmado.pdf",
      "existing-folder",
      "application/pdf",
    );
    expect(ctx.calls.convenios[0]).toMatchObject({
      document_path: "https://drive.google.com/drive/folders/existing-folder",
      signed_pdf_path: "https://drive.google.com/file/d/signed-pdf/view",
    });
  });
});
