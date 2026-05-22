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
});
