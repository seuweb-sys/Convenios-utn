import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockMoveFileToFolderOAuth: vi.fn(),
  mockMoveFolderToFolderOAuth: vi.fn(),
  mockConvenioSentToCorrection: vi.fn(),
  mockSendCorrectionRequestEmail: vi.fn(),
  mockSupabaseAdminGetUserById: vi.fn(),
}));

import { POST as postAction } from "@/app/api/admin/convenios/[id]/actions/route";
import { POST as postObservation } from "@/app/api/admin/convenios/[id]/observaciones/route";
import { POST as postNotify } from "@/app/api/admin/convenios/[id]/notify/route";
import { DRIVE_FOLDERS } from "@/app/lib/google-drive";

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
    convenioSentToCorrection: mocks.mockConvenioSentToCorrection,
  },
}));

vi.mock("@/app/lib/services/email-service", () => ({
  sendCorrectionRequestEmail: mocks.mockSendCorrectionRequestEmail,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        getUserById: mocks.mockSupabaseAdminGetUserById,
      },
    },
  })),
}));

type TableCall = {
  inserts: any[];
  updates: any[];
};

function createSupabaseDouble(options?: { role?: string; ownerEmail?: string | null }) {
  const calls: Record<string, TableCall> = {
    convenios: { inserts: [], updates: [] },
    observaciones: { inserts: [], updates: [] },
    activity_log: { inserts: [], updates: [] },
  };

  const convenioRecord = {
    status: "enviado",
    user_id: "owner-1",
    document_path: "https://drive.google.com/file/d/original-doc/view",
    title: "Convenio de prueba",
    convenio_type_id: 3,
    convenio_types: {
      name: "Convenio Marco",
    },
  };

  const adminProfile = {
    role: options?.role ?? "admin",
    full_name: "Admin Uno",
  };

  const ownerProfile = {
    full_name: "Usuario Dueño",
  };

  mocks.mockSupabaseAdminGetUserById.mockResolvedValue({
    data: {
      user: options?.ownerEmail === null ? null : { email: options?.ownerEmail ?? "owner@example.com" },
    },
  });

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "admin-1" } },
        error: null,
      }),
    },
    from(table: string) {
      return createTableDouble(table);
    },
  };

  function createTableDouble(table: string) {
    let pendingUpdate: any = null;

    const eqChain = (resultFactory: () => Promise<any>) => ({
      eq: vi.fn(() => eqChain(resultFactory)),
      single: vi.fn(resultFactory),
      select: vi.fn(() => ({
        single: vi.fn(resultFactory),
      })),
    });

    if (table === "profiles") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_: string, id: string) => ({
            single: vi.fn(async () => ({
              data: id === "admin-1" ? adminProfile : ownerProfile,
              error: null,
            })),
          })),
        })),
      };
    }

    if (table === "convenios") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({ data: convenioRecord, error: null })),
          })),
        })),
        update: vi.fn((payload: any) => {
          pendingUpdate = payload;
          calls.convenios.updates.push(payload);
          return {
            eq: vi.fn(async () => ({ error: null, data: pendingUpdate })),
          };
        }),
      };
    }

    if (table === "observaciones") {
      return {
        insert: vi.fn((payload: any) => {
          calls.observaciones.inserts.push(payload);
          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({ data: { id: "obs-1", ...payload }, error: null })),
            })),
          };
        }),
      };
    }

    if (table === "activity_log") {
      return {
        insert: vi.fn(async (payload: any) => {
          calls.activity_log.inserts.push(payload);
          return { error: null };
        }),
      };
    }

    return {
      select: vi.fn(() => eqChain(async () => ({ data: null, error: null }))),
      update: vi.fn((payload: any) => {
        calls[table]?.updates.push(payload);
        return { eq: vi.fn(async () => ({ error: null })) };
      }),
      insert: vi.fn(async (payload: any) => {
        calls[table]?.inserts.push(payload);
        return { error: null };
      }),
    };
  }

  return { supabase, calls };
}

describe("admin correction request flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves correction request behavior across action, observation, and notify routes", async () => {
    const ctx = createSupabaseDouble();
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const actionResponse = await postAction(
      new Request("http://localhost/api/admin/convenios/conv-9/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({ action: "correct" }),
      }),
      { params: { id: "conv-9" } },
    );

    const observationResponse = await postObservation(
      new Request("http://localhost/api/admin/convenios/conv-9/observaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observaciones: "Falta completar la cláusula 3" }),
      }) as any,
      { params: { id: "conv-9" } },
    );

    const notifyResponse = await postNotify(
      new Request("http://localhost/api/admin/convenios/conv-9/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Falta completar la cláusula 3" }),
      }) as any,
      { params: { id: "conv-9" } },
    );

    expect(actionResponse.status).toBe(200);
    expect(observationResponse.status).toBe(200);
    expect(notifyResponse.status).toBe(200);
    expect(ctx.calls.convenios.updates[0]).toMatchObject({
      status: "revision",
      reviewer_id: "admin-1",
    });
    expect(mocks.mockMoveFileToFolderOAuth).toHaveBeenCalledWith("original-doc", DRIVE_FOLDERS.ARCHIVED);
    expect(ctx.calls.activity_log.inserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "correct",
          status_from: "enviado",
          status_to: "revision",
        }),
      ]),
    );
    expect(ctx.calls.observaciones.inserts[0]).toMatchObject({
      convenio_id: "conv-9",
      user_id: "admin-1",
      content: "Falta completar la cláusula 3",
      resolved: false,
    });
    expect(mocks.mockConvenioSentToCorrection).toHaveBeenCalledWith(
      "owner-1",
      "Convenio de prueba",
      "conv-9",
    );
    expect(mocks.mockSendCorrectionRequestEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userEmail: "owner@example.com",
        userName: "Usuario Dueño",
        convenioTitle: "Convenio de prueba",
        convenioId: "conv-9",
        observaciones: "Falta completar la cláusula 3",
        adminName: "Admin Uno",
      }),
    );
  });

  it("returns 500 from notify when owner email cannot be resolved", async () => {
    const ctx = createSupabaseDouble({ ownerEmail: null });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = await postNotify(
      new Request("http://localhost/api/admin/convenios/conv-10/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Observación" }),
      }) as any,
      { params: { id: "conv-10" } },
    );

    expect(response.status).toBe(500);
    expect(mocks.mockSendCorrectionRequestEmail).not.toHaveBeenCalled();
  });
});
