import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockMoveFileToFolderOAuth: vi.fn(),
  mockMoveFolderToFolderOAuth: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: mocks.mockCreateClient,
}));

vi.mock("@/app/lib/google-drive", () => ({
  DRIVE_FOLDERS: {
    APPROVED: "approved-folder",
    REJECTED: "rejected-folder",
    ARCHIVED: "archived-folder",
  },
  moveFileToFolder: vi.fn(),
  moveFileToFolderOAuth: mocks.mockMoveFileToFolderOAuth,
  moveFolderToFolderOAuth: mocks.mockMoveFolderToFolderOAuth,
}));

vi.mock("@/app/lib/services/notification-service", () => ({
  NotificationService: {
    convenioApproved: vi.fn(),
    convenioRejected: vi.fn(),
    convenioSentToCorrection: vi.fn(),
  },
}));

import { POST } from "@/app/api/admin/convenios/[id]/actions/route";

function createSupabaseDouble(convenio: { status: string; document_path: string; title: string }) {
  const calls = {
    convenios: [] as any[],
    activityLog: [] as any[],
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
                  user_id: "owner-1",
                  convenio_type_id: 2,
                  ...convenio,
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

      if (table === "activity_log") {
        return {
          insert: vi.fn(async (payload: any) => {
            calls.activityLog.push(payload);
            return { error: null };
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

describe("POST /api/admin/convenios/[id]/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("moves folderized convenios by folder URL when approving", async () => {
    const ctx = createSupabaseDouble({
      status: "enviado",
      document_path: "https://drive.google.com/drive/folders/folder-123?usp=sharing",
      title: "Convenio Folder",
    });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = await POST(
      new Request("http://localhost/api/admin/convenios/conv-1/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      }),
      { params: { id: "conv-1" } },
    );

    expect(response.status).toBe(200);
    expect(mocks.mockMoveFolderToFolderOAuth).toHaveBeenCalledWith("folder-123", "approved-folder");
    expect(mocks.mockMoveFileToFolderOAuth).not.toHaveBeenCalled();
    expect(ctx.calls.convenios[0]).toMatchObject({ status: "aprobado", reviewer_id: "admin-1" });
  });

  it("keeps moving legacy file URLs as single files for correction/archive flows", async () => {
    const ctx = createSupabaseDouble({
      status: "enviado",
      document_path: "https://drive.google.com/file/d/file-456/view",
      title: "Convenio File",
    });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = await POST(
      new Request("http://localhost/api/admin/convenios/conv-2/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      }),
      { params: { id: "conv-2" } },
    );

    expect(response.status).toBe(200);
    expect(mocks.mockMoveFileToFolderOAuth).toHaveBeenCalledWith("file-456", "archived-folder");
    expect(mocks.mockMoveFolderToFolderOAuth).not.toHaveBeenCalled();
    expect(ctx.calls.convenios[0]).toMatchObject({ status: "archivado", reviewer_id: "admin-1" });
  });
});
