import { describe, expect, it, vi } from "vitest";

import { uploadFileToDriveInChunks } from "@/app/lib/client-drive-upload";

describe("uploadFileToDriveInChunks", () => {
  it("uploads PPS attachments directly to Drive and returns metadata-only refs", async () => {
    const file = new File([Buffer.from("1234567812345678")], "pps-anexo.pdf", { type: "application/pdf" });
    const progressEvents: number[] = [];
    const uploadChunk = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "drive-pps-1",
        webViewLink: "https://drive.google.com/file/d/drive-pps-1/view",
        webContentLink: "https://drive.google.com/uc?id=drive-pps-1",
      });

    const uploaded = await uploadFileToDriveInChunks({
      file,
      sessionEndpoint: "/api/uploads/drive/resumable-session",
      chunkSize: 8,
      onProgress: ({ progress }) => progressEvents.push(progress),
      deps: {
        createSession: vi.fn().mockResolvedValue({ uploadUrl: "https://upload.example.com/session" }),
        uploadChunk,
      },
    });

    expect(uploadChunk).toHaveBeenCalledTimes(2);
    expect(uploadChunk).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        uploadUrl: "https://upload.example.com/session",
        start: 0,
        end: 8,
        total: file.size,
        mimeType: "application/pdf",
      }),
    );
    expect(uploadChunk).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        start: 8,
        end: file.size,
      }),
    );
    expect(progressEvents).toEqual([50, 99, 100]);
    expect(uploaded).toEqual({
      id: "drive-pps-1",
      webViewLink: "https://drive.google.com/file/d/drive-pps-1/view",
      webContentLink: "https://drive.google.com/uc?id=drive-pps-1",
    });
  });

  it("recovers signed PDF metadata after the final chunk hits a browser network error", async () => {
    const file = new File([Buffer.from("1234567812345678")], "firmado.pdf", { type: "application/pdf" });
    const progressEvents: number[] = [];
    const uploadChunk = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("Error de red subiendo el archivo a Google Drive"));
    const finalizeUpload = vi.fn().mockResolvedValue({
      id: "drive-signed-1",
      name: "FIRMADO-Convenio Firmado.pdf",
      mimeType: "application/pdf",
      size: String(file.size),
      webViewLink: "https://drive.google.com/file/d/drive-signed-1/view",
      webContentLink: "https://drive.google.com/uc?id=drive-signed-1",
    });

    const uploaded = await uploadFileToDriveInChunks({
      file,
      sessionEndpoint: "/api/admin/convenios/conv-1/signed-pdf/resumable-session",
      chunkSize: 8,
      onProgress: ({ progress }) => progressEvents.push(progress),
      deps: {
        createSession: vi.fn().mockResolvedValue({
          uploadUrl: "https://upload.example.com/session",
          finalizeEndpoint: "/api/admin/convenios/conv-1/signed-pdf/finalize-upload",
          fileName: "FIRMADO-Convenio Firmado.pdf",
          fileSize: file.size,
          folderId: "approved-convenio-folder",
          mimeType: "application/pdf",
        }),
        uploadChunk,
        finalizeUpload,
      },
    });

    expect(finalizeUpload).toHaveBeenCalledWith({
      finalizeEndpoint: "/api/admin/convenios/conv-1/signed-pdf/finalize-upload",
      fileName: "FIRMADO-Convenio Firmado.pdf",
      fileSize: file.size,
      folderId: "approved-convenio-folder",
      mimeType: "application/pdf",
    });
    expect(progressEvents).toEqual([50, 99, 100]);
    expect(uploaded).toEqual({
      id: "drive-signed-1",
      name: "FIRMADO-Convenio Firmado.pdf",
      mimeType: "application/pdf",
      size: String(file.size),
      webViewLink: "https://drive.google.com/file/d/drive-signed-1/view",
      webContentLink: "https://drive.google.com/uc?id=drive-signed-1",
    });
  });

  it("recovers generic anexo metadata after the final chunk hits a browser network error", async () => {
    const file = new File([Buffer.from("1234567812345678")], "adenda-anexo.pdf", { type: "application/pdf" });
    const uploadChunk = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("Error de red subiendo el archivo a Google Drive"));
    const finalizeUpload = vi.fn().mockResolvedValue({
      id: "drive-anexo-1",
      name: "ANEXO-adenda-anexo.pdf",
      mimeType: "application/pdf",
      size: String(file.size),
      webViewLink: "https://drive.google.com/file/d/drive-anexo-1/view",
      webContentLink: "https://drive.google.com/uc?id=drive-anexo-1",
    });

    const uploaded = await uploadFileToDriveInChunks({
      file,
      sessionEndpoint: "/api/uploads/drive/resumable-session",
      chunkSize: 8,
      deps: {
        createSession: vi.fn().mockResolvedValue({
          uploadUrl: "https://upload.example.com/session",
          finalizeEndpoint: "/api/uploads/drive/finalize-upload",
          fileName: "ANEXO-adenda-anexo.pdf",
          fileSize: file.size,
          folderId: "pending-folder",
          mimeType: "application/pdf",
        }),
        uploadChunk,
        finalizeUpload,
      },
    });

    expect(finalizeUpload).toHaveBeenCalledWith({
      finalizeEndpoint: "/api/uploads/drive/finalize-upload",
      fileName: "ANEXO-adenda-anexo.pdf",
      fileSize: file.size,
      folderId: "pending-folder",
      mimeType: "application/pdf",
    });
    expect(uploaded).toEqual({
      id: "drive-anexo-1",
      name: "ANEXO-adenda-anexo.pdf",
      mimeType: "application/pdf",
      size: String(file.size),
      webViewLink: "https://drive.google.com/file/d/drive-anexo-1/view",
      webContentLink: "https://drive.google.com/uc?id=drive-anexo-1",
    });
  });

  it("still rejects final chunk failures when no finalize endpoint is available", async () => {
    const file = new File([Buffer.from("1234567812345678")], "firmado.pdf", { type: "application/pdf" });
    const uploadChunk = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("Error de red subiendo el archivo a Google Drive"));

    await expect(
      uploadFileToDriveInChunks({
        file,
        sessionEndpoint: "/api/admin/convenios/conv-1/signed-pdf/resumable-session",
        chunkSize: 8,
        deps: {
          createSession: vi.fn().mockResolvedValue({ uploadUrl: "https://upload.example.com/session" }),
          uploadChunk,
        },
      })
    ).rejects.toThrow("Error de red subiendo el archivo a Google Drive");
  });
});
