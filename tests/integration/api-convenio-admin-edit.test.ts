import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockMoveFileToFolderOAuth: vi.fn(),
  mockMoveFolderToFolderOAuth: vi.fn(),
  mockEnsureConvenioFolder: vi.fn(),
  mockUploadFileToOAuthDrive: vi.fn(),
  mockUploadConvenioEspecificoOAuth: vi.fn(),
  mockDeleteFileFromOAuthDrive: vi.fn(),
  mockDeleteFileFromDrive: vi.fn(),
  mockConvenioResubmitted: vi.fn(),
  mockRenderDocx: vi.fn(),
  mockCreateDocument: vi.fn(),
  mockPackerToBuffer: vi.fn(),
}));

import { DRIVE_FOLDERS } from "@/app/lib/google-drive";
import { GET, PATCH } from "@/app/api/convenios/[id]/route";

vi.mock("@/utils/supabase/server", () => ({
  createClient: mocks.mockCreateClient,
}));

vi.mock("@/app/lib/google-drive", () => ({
  DRIVE_FOLDERS: {
    PENDING: "pending-folder",
    ARCHIVED: "archived-folder",
  },
  moveFileToFolderOAuth: mocks.mockMoveFileToFolderOAuth,
  moveFolderToFolderOAuth: mocks.mockMoveFolderToFolderOAuth,
  uploadFileToOAuthDrive: mocks.mockUploadFileToOAuthDrive,
  uploadConvenioEspecificoOAuth: mocks.mockUploadConvenioEspecificoOAuth,
  deleteFileFromOAuthDrive: mocks.mockDeleteFileFromOAuthDrive,
  deleteFileFromDrive: mocks.mockDeleteFileFromDrive,
}));

vi.mock("@/app/lib/convenio-drive", () => ({
  ensureConvenioFolder: mocks.mockEnsureConvenioFolder,
  resolveConvenioDriveAsset: vi.fn((documentPath: string | null) => {
    if (!documentPath) return null;
    if (documentPath.includes("/folders/")) {
      return {
        kind: "folder",
        itemId: documentPath.split("/folders/")[1]?.split("?")[0],
        webViewLink: documentPath,
      };
    }

    if (documentPath.includes("/d/")) {
      return {
        kind: "file",
        itemId: documentPath.split("/d/")[1]?.split("/")[0],
        webViewLink: documentPath,
      };
    }

    return null;
  }),
}));

vi.mock("@/app/lib/services/notification-service", () => ({
  NotificationService: {
    convenioResubmitted: mocks.mockConvenioResubmitted,
  },
}));

vi.mock("@/app/lib/authz/profesor-membership-scope", () => ({
  shouldApplyProfesorPracticeOnlyConvenioFilter: vi.fn(async () => false),
}));

vi.mock("@/app/lib/authz/classification-scope", () => ({
  computeConstrainedClassification: vi.fn(() => ({ kind: "full" })),
  validateCreateClassification: vi.fn(() => ({ ok: true })),
}));

vi.mock("@/app/lib/utils/docx-templater", () => ({
  renderDocx: mocks.mockRenderDocx,
}));

vi.mock("@/app/lib/utils/doc-generator", () => ({
  createDocument: mocks.mockCreateDocument,
}));

vi.mock("docx", () => ({
  Packer: {
    toBuffer: mocks.mockPackerToBuffer,
  },
}));

vi.mock("fs", () => ({
  default: {
    readdirSync: vi.fn(() => ["template.docx"]),
    readFileSync: vi.fn(() => Buffer.from("template")),
  },
}));

type TableCall = {
  inserts: any[];
  updates: any[];
};

function createSupabaseDouble(options: {
  role?: string;
  userId?: string;
  convenioStatus: string;
  documentPath: string | null;
  signedPdfPath?: string | null;
  convenioTypeId?: number;
  memberships?: any[];
  formData?: Record<string, any>;
}) {
  const calls: Record<string, TableCall> = {
    convenios: { inserts: [], updates: [] },
    observaciones: { inserts: [], updates: [] },
    activity_log: { inserts: [], updates: [] },
  };

  const convenioRecord = {
    user_id: "owner-1",
    status: options.convenioStatus,
    title: "Convenio Test",
    convenio_type_id: options.convenioTypeId ?? 3,
    secretariat_id: "sec-1",
    career_id: null,
    org_unit_id: null,
    agreement_year: 2026,
    form_data: options.formData ?? {},
    document_path: options.documentPath,
    signed_pdf_path: options.signedPdfPath ?? null,
    signed_pdf_uploaded_at: options.signedPdfPath ? "2026-05-10T10:00:00.000Z" : null,
    signed_pdf_uploaded_by: options.signedPdfPath ? "admin-1" : null,
  };

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: options.userId ?? "admin-1" } },
        error: null,
      }),
    },
    from(table: string) {
      return createTableDouble(table);
    },
  };

  function createTableDouble(table: string) {
    let mode: "select" | "update" | "insert" | null = null;
    let pendingUpdate: any = null;
    let pendingInsert: any = null;

    const api = {
      select: vi.fn(() => {
        mode = "select";
        return api;
      }),
      update: vi.fn((payload: any) => {
        mode = "update";
        pendingUpdate = payload;
        calls[table]?.updates.push(payload);
        return api;
      }),
      insert: vi.fn((payload: any) => {
        mode = "insert";
        pendingInsert = payload;
        calls[table]?.inserts.push(payload);
        return Promise.resolve({ error: null });
      }),
      eq: vi.fn(() => api),
      in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      limit: vi.fn(() => api),
      maybeSingle: vi.fn(async () => ({ data: { id: "sa-id" }, error: null })),
      single: vi.fn(async () => {
        if (table === "profiles") {
          return { data: { role: options.role ?? "admin", is_approved: true }, error: null };
        }
        if (table === "convenios" && mode === "select") {
          return { data: convenioRecord, error: null };
        }
        if (table === "convenio_types") {
          return { data: { name: "template", template_content: "template body" }, error: null };
        }
        if (table === "convenios" && mode === "update") {
          return {
            data: {
              document_path: pendingUpdate.document_path ?? convenioRecord.document_path,
              convenio_type_id: convenioRecord.convenio_type_id,
            },
            error: null,
          };
        }

        return { data: null, error: null };
      }),
      then: undefined,
    };

    if (table === "profile_memberships") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: options.memberships ?? [], error: null })),
          })),
        })),
      };
    }

    if (table === "secretariats") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: { id: "sa-id" }, error: null })),
            })),
          })),
        })),
      };
    }

    return api;
  }

  return { supabase, calls };
}

describe("PATCH /api/convenios/[id] admin direct edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockRenderDocx.mockResolvedValue(Buffer.from("generated-doc"));
    mocks.mockEnsureConvenioFolder.mockResolvedValue({
      folderId: "new-folder",
      folderWebViewLink: "https://drive.google.com/drive/folders/new-folder",
      migratedFromFile: false,
    });
    mocks.mockUploadFileToOAuthDrive.mockResolvedValue({
      webViewLink: "https://drive.google.com/file/d/new-doc/view",
    });
    mocks.mockUploadConvenioEspecificoOAuth.mockResolvedValue({
      webViewLink: "https://drive.google.com/folders/new-folder",
    });
    mocks.mockPackerToBuffer.mockResolvedValue(Buffer.from("generated-doc"));
  });

  it("archives approved documents, regenerates them, and records explicit admin audit metadata", async () => {
    const ctx = createSupabaseDouble({
      convenioStatus: "aprobado",
      documentPath: "https://drive.google.com/file/d/old-doc/view",
      signedPdfPath: "https://drive.google.com/file/d/signed-doc/view",
    });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = await PATCH(
      new Request("http://localhost/api/convenios/conv-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({
          title: "Convenio Test",
          status: "enviado",
          form_data: { entidad_nombre: "Empresa SA", dia: "10", mes: "Mayo" },
          edit_context: {
            source: "admin_direct",
            approved_reset_confirmed: true,
          },
        }),
      }),
      { params: { id: "conv-1" } },
    );

    expect(response.status).toBe(200);
    expect(mocks.mockMoveFileToFolderOAuth).toHaveBeenCalledWith("old-doc", DRIVE_FOLDERS.ARCHIVED);
    expect(mocks.mockEnsureConvenioFolder).toHaveBeenCalledWith({
      convenioTitle: expect.stringContaining("Convenio_Convenio Test_"),
      parentFolderId: DRIVE_FOLDERS.PENDING,
      currentDocumentPath: null,
    });
    expect(mocks.mockUploadFileToOAuthDrive).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringContaining("Convenio_Convenio Test_"),
      "new-folder",
      false,
    );
    expect(ctx.calls.convenios.updates[0]).toMatchObject({
      status: "enviado",
      document_path: "https://drive.google.com/drive/folders/new-folder",
      signed_pdf_path: null,
      signed_pdf_uploaded_at: null,
      signed_pdf_uploaded_by: null,
    });
    expect(ctx.calls.convenios.updates[0]).not.toHaveProperty("user_id");
    expect(ctx.calls.activity_log.inserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "update_status",
          status_from: "aprobado",
          status_to: "enviado",
        }),
        expect.objectContaining({
          action: "admin_direct_edit_regenerated",
          metadata: expect.objectContaining({
            origin: "admin-edit",
            previous_status: "aprobado",
            previous_document_path: "https://drive.google.com/file/d/old-doc/view",
            archived_document_path: "https://drive.google.com/file/d/old-doc/view",
            new_document_path: "https://drive.google.com/drive/folders/new-folder",
            status_reset_to: "enviado",
            signed_pdf_cleared: true,
          }),
        }),
      ]),
    );
    expect(mocks.mockConvenioResubmitted).not.toHaveBeenCalled();
  });

  it("regenerates non-approved admin direct edits without falling back to applicant resubmission", async () => {
    const ctx = createSupabaseDouble({
      convenioStatus: "revision",
      documentPath: "https://drive.google.com/file/d/revision-admin-doc/view",
    });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = await PATCH(
      new Request("http://localhost/api/convenios/conv-3", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({
          title: "Convenio Test",
          status: "enviado",
          form_data: { entidad_nombre: "Empresa SA", dia: "11", mes: "Junio" },
          edit_context: {
            source: "admin_direct",
          },
        }),
      }),
      { params: { id: "conv-3" } },
    );

    expect(response.status).toBe(200);
    expect(mocks.mockDeleteFileFromOAuthDrive).toHaveBeenCalledWith("revision-admin-doc");
    expect(mocks.mockEnsureConvenioFolder).toHaveBeenCalledWith({
      convenioTitle: expect.stringContaining("Convenio_Convenio Test_"),
      parentFolderId: DRIVE_FOLDERS.PENDING,
      currentDocumentPath: null,
    });
    expect(ctx.calls.convenios.updates[0]).toMatchObject({
      status: "enviado",
      document_path: "https://drive.google.com/drive/folders/new-folder",
    });
    expect(ctx.calls.convenios.updates[0]).not.toHaveProperty("user_id");
    expect(ctx.calls.observaciones.updates[0]).toMatchObject({ resolved: true });
    expect(ctx.calls.activity_log.inserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "update_status",
          status_from: "revision",
          status_to: "enviado",
        }),
        expect.objectContaining({
          action: "admin_direct_edit_regenerated",
          metadata: expect.objectContaining({
            origin: "admin-edit",
            previous_status: "revision",
            previous_document_path: "https://drive.google.com/file/d/revision-admin-doc/view",
            archived_document_path: null,
            new_document_path: "https://drive.google.com/drive/folders/new-folder",
            status_reset_to: "enviado",
            signed_pdf_cleared: false,
          }),
        }),
      ]),
    );
    expect(ctx.calls.activity_log.inserts).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "resubmit_convenio" }),
      ]),
    );
    expect(mocks.mockConvenioResubmitted).not.toHaveBeenCalled();
  });

  it("preserves applicant correction resubmission behavior", async () => {
    const ctx = createSupabaseDouble({
      convenioStatus: "revision",
      documentPath: "https://drive.google.com/file/d/revision-doc/view",
    });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = await PATCH(
      new Request("http://localhost/api/convenios/conv-2", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({
          title: "Convenio Test",
          status: "enviado",
          form_data: { entidad_nombre: "Empresa SA", dia: "10", mes: "Mayo" },
        }),
      }),
      { params: { id: "conv-2" } },
    );

    expect(response.status).toBe(200);
    expect(mocks.mockDeleteFileFromOAuthDrive).toHaveBeenCalledWith("revision-doc");
    expect(mocks.mockUploadFileToOAuthDrive).toHaveBeenCalled();
    expect(ctx.calls.observaciones.updates[0]).toMatchObject({ resolved: true });
    expect(ctx.calls.activity_log.inserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "resubmit_convenio",
          status_from: "revision",
          status_to: "enviado",
        }),
      ]),
    );
    expect(mocks.mockConvenioResubmitted).toHaveBeenCalledWith("admin-1", "Convenio Test", "conv-2");
  });

  it("preserves PPS attachment refs on admin regeneration when attachments were not changed", async () => {
    const existingAnexos = [
      {
        name: "pps-anexo.pdf",
        driveFileId: "drive-pps-1",
        mimeType: "application/pdf",
        webViewLink: "https://drive.google.com/file/d/drive-pps-1/view",
      },
    ];
    const ctx = createSupabaseDouble({
      convenioStatus: "revision",
      convenioTypeId: 1,
      documentPath: "https://drive.google.com/drive/folders/revision-folder",
      formData: {
        empresa_nombre: "Empresa SA",
        alumno_nombre: "Alumno Test",
        anexos: existingAnexos,
      },
    });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = await PATCH(
      new Request("http://localhost/api/convenios/conv-pps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({
          title: "Convenio Test",
          status: "enviado",
          form_data: {
            empresa_nombre: "Empresa SA",
            alumno_nombre: "Alumno Test",
          },
          edit_context: {
            source: "admin_direct",
          },
        }),
      }),
      { params: { id: "conv-pps" } },
    );

    expect(response.status).toBe(200);
    expect(mocks.mockUploadConvenioEspecificoOAuth).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringContaining("Convenio_Convenio Test_"),
      existingAnexos,
      DRIVE_FOLDERS.PENDING,
    );
    expect(ctx.calls.convenios.updates[0]?.form_data?.empresa_nombre).toBe("Empresa SA");
    expect(ctx.calls.convenios.updates[0]?.form_data?.alumno_nombre).toBe("Alumno Test");
    expect(ctx.calls.convenios.updates[0]?.form_data?.anexos).toEqual(existingAnexos);
  });

  it("returns untouched legacy convenios without migrating their single-file document path", async () => {
    const ctx = createSupabaseDouble({
      convenioStatus: "revision",
      documentPath: "https://drive.google.com/file/d/legacy-untouched/view",
      role: "user",
      userId: "secretary-1",
    });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = await GET(
      new Request("http://localhost/api/convenios/conv-legacy"),
      { params: { id: "conv-legacy" } },
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.document_path).toBe("https://drive.google.com/file/d/legacy-untouched/view");
    expect(mocks.mockMoveFileToFolderOAuth).not.toHaveBeenCalled();
    expect(mocks.mockMoveFolderToFolderOAuth).not.toHaveBeenCalled();
    expect(mocks.mockEnsureConvenioFolder).not.toHaveBeenCalled();
  });

  it("moves secretary resubmissions with folder URLs back to pending as folders", async () => {
    const ctx = createSupabaseDouble({
      convenioStatus: "revision",
      documentPath: "https://drive.google.com/drive/folders/revision-folder?usp=sharing",
      role: "user",
      userId: "owner-1",
      memberships: [{ membership_role: "secretario", secretariat_id: "sec-1", career_id: null, org_unit_id: null, is_active: true }],
    });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = await PATCH(
      new Request("http://localhost/api/convenios/conv-secretary-folder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({
          status: "enviado",
        }),
      }),
      { params: { id: "conv-secretary-folder" } },
    );

    expect(response.status).toBe(200);
    expect(mocks.mockMoveFolderToFolderOAuth).toHaveBeenCalledWith("revision-folder", DRIVE_FOLDERS.PENDING);
    expect(mocks.mockMoveFileToFolderOAuth).not.toHaveBeenCalled();
    expect(mocks.mockEnsureConvenioFolder).not.toHaveBeenCalled();
  });

  it("moves secretary resubmissions with legacy file URLs back to pending as single files", async () => {
    const ctx = createSupabaseDouble({
      convenioStatus: "revision",
      documentPath: "https://drive.google.com/file/d/revision-file/view",
      role: "user",
      userId: "owner-1",
      memberships: [{ membership_role: "secretario", secretariat_id: "sec-1", career_id: null, org_unit_id: null, is_active: true }],
    });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = await PATCH(
      new Request("http://localhost/api/convenios/conv-secretary-file", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({
          status: "enviado",
        }),
      }),
      { params: { id: "conv-secretary-file" } },
    );

    expect(response.status).toBe(200);
    expect(mocks.mockMoveFileToFolderOAuth).toHaveBeenCalledWith("revision-file", DRIVE_FOLDERS.PENDING);
    expect(mocks.mockMoveFolderToFolderOAuth).not.toHaveBeenCalled();
    expect(mocks.mockEnsureConvenioFolder).not.toHaveBeenCalled();
  });
});
