import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockCreateOAuthDriveResumableUploadSession: vi.fn(),
  mockFindOAuthDriveFileByNameWithRetry: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: mocks.mockCreateClient,
}));

vi.mock("@/app/lib/google-drive", () => ({
  DRIVE_FOLDERS: {
    PENDING: "pending-folder",
  },
  createOAuthDriveResumableUploadSession: mocks.mockCreateOAuthDriveResumableUploadSession,
  findOAuthDriveFileByNameWithRetry: mocks.mockFindOAuthDriveFileByNameWithRetry,
}));

import { POST as postFinalizeUpload } from "@/app/api/uploads/drive/finalize-upload/route";
import { POST as postResumableSession } from "@/app/api/uploads/drive/resumable-session/route";

function createSupabaseDouble(profile: { role: string; is_approved: boolean } = { role: "user", is_approved: true }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    },
    from(table: string) {
      if (table !== "profiles") {
        throw new Error(`unexpected table ${table}`);
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({ data: profile, error: null })),
          })),
        })),
      };
    },
  };
}

describe("generic Drive resumable uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockCreateClient.mockResolvedValue(createSupabaseDouble());
    mocks.mockCreateOAuthDriveResumableUploadSession.mockResolvedValue({
      uploadUrl: "https://upload.example.com/session",
      expiresIn: "one-week",
    });
    mocks.mockFindOAuthDriveFileByNameWithRetry.mockResolvedValue({
      id: "drive-anexo-1",
      name: "ANEXO-adenda-anexo.pdf",
      mimeType: "application/pdf",
      size: "2048",
      webViewLink: "https://drive.google.com/file/d/drive-anexo-1/view",
      webContentLink: "https://drive.google.com/uc?id=drive-anexo-1",
    });
  });

  it("returns finalize metadata for generic resumable upload sessions", async () => {
    const response = await postResumableSession(
      new Request("http://localhost/api/uploads/drive/resumable-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: "adenda-anexo.pdf",
          mimeType: "application/pdf",
          fileSize: 2048,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.mockCreateOAuthDriveResumableUploadSession).toHaveBeenCalledWith({
      fileName: "ANEXO-adenda-anexo.pdf",
      mimeType: "application/pdf",
      fileSize: 2048,
      folderId: "pending-folder",
    });
    await expect(response.json()).resolves.toEqual({
      uploadUrl: "https://upload.example.com/session",
      expiresIn: "one-week",
      fileName: "ANEXO-adenda-anexo.pdf",
      folderId: "pending-folder",
      fileSize: 2048,
      mimeType: "application/pdf",
      finalizeEndpoint: "/api/uploads/drive/finalize-upload",
    });
  });

  it("looks up finalized generic upload metadata in Drive after a client-side final chunk failure", async () => {
    const response = await postFinalizeUpload(
      new Request("http://localhost/api/uploads/drive/finalize-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: "ANEXO-adenda-anexo.pdf",
          mimeType: "application/pdf",
          fileSize: 2048,
          folderId: "pending-folder",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.mockFindOAuthDriveFileByNameWithRetry).toHaveBeenCalledWith({
      folderId: "pending-folder",
      fileName: "ANEXO-adenda-anexo.pdf",
      mimeType: "application/pdf",
      fileSize: 2048,
    });
    await expect(response.json()).resolves.toEqual({
      id: "drive-anexo-1",
      name: "ANEXO-adenda-anexo.pdf",
      mimeType: "application/pdf",
      size: "2048",
      webViewLink: "https://drive.google.com/file/d/drive-anexo-1/view",
      webContentLink: "https://drive.google.com/uc?id=drive-anexo-1",
    });
  });
});
