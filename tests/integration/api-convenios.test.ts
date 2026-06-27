import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockCreateSupabaseAdmin: vi.fn(),
  mockEnsureConvenioFolder: vi.fn(),
  mockUploadFileToOAuthDrive: vi.fn(),
  mockUploadConvenioEspecificoOAuth: vi.fn(),
  mockConvenioCreated: vi.fn(),
  mockRenderDocx: vi.fn(),
  mockCreateDocument: vi.fn(),
  mockPackerToBuffer: vi.fn(),
  mockFsExistsSync: vi.fn(() => true),
  mockFsReadFileSync: vi.fn(() => Buffer.from("template")),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: mocks.mockCreateClient,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.mockCreateSupabaseAdmin,
}));

vi.mock("@/app/lib/convenio-drive", () => ({
  ensureConvenioFolder: mocks.mockEnsureConvenioFolder,
}));

vi.mock("@/app/lib/google-drive", () => ({
  DRIVE_FOLDERS: { PENDING: "pending-folder" },
  uploadFileToDrive: vi.fn(),
  uploadConvenioEspecificoSimple: vi.fn(),
  uploadFileToOAuthDrive: mocks.mockUploadFileToOAuthDrive,
  uploadConvenioEspecificoOAuth: mocks.mockUploadConvenioEspecificoOAuth,
}));

vi.mock("@/app/lib/services/notification-service", () => ({
  NotificationService: {
    convenioCreated: mocks.mockConvenioCreated,
  },
}));

vi.mock("@/app/lib/authz/scope-rules", () => ({
  normalizeAgreementYear: vi.fn(() => ({ valid: true, year: 2026 })),
  validatePracticeHistoricalRule: vi.fn(() => ({ valid: true, error: null })),
}));

vi.mock("@/app/lib/authz/classification-scope", () => ({
  computeConstrainedClassification: vi.fn(() => ({ scope: "all" })),
  validateCreateClassification: vi.fn(() => ({ ok: true })),
}));

vi.mock("@/app/lib/authz/profesor-membership-scope", () => ({
  getPracticeConvenioTypeIds: vi.fn(() => [1, 5]),
  shouldApplyProfesorPracticeOnlyConvenioFilter: vi.fn(async () => false),
}));

vi.mock("@/app/lib/authz/membership-scope", () => ({
  getCareerIdsForMembershipRole: vi.fn(async () => []),
  getProfileIdsWithMembershipInSecretariats: vi.fn(async () => []),
  getSecretariatIdsForSecretario: vi.fn(async () => []),
  hasActiveMembershipRole: vi.fn(async () => true),
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
    existsSync: mocks.mockFsExistsSync,
    readFileSync: mocks.mockFsReadFileSync,
  },
}));

import { POST } from "@/app/api/convenios/route";

function createSupabaseDouble(options?: { role?: string; fullName?: string; userId?: string }) {
  const adminCalls = {
    inserts: [] as any[],
    updates: [] as any[],
  };

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: options?.userId ?? "user-1" } },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: "2026-001", error: null }),
    from(table: string) {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: {
                  full_name: options?.fullName ?? "Admin",
                  role: options?.role ?? "admin",
                  is_approved: true,
                  career_id: null,
                },
                error: null,
              })),
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

      if (table === "profile_memberships") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(async () => ({ data: [], error: null })),
            })),
          })),
        };
      }

      if (table === "activity_log") {
        return {
          insert: vi.fn(async () => ({ error: null })),
        };
      }

      if (table === "convenio_types") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({ data: { template_content: "contenido" }, error: null })),
            })),
          })),
        };
      }

      return {
        select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(async () => ({ data: null, error: null })) })) })),
      };
    },
  };

  const supabaseAdmin = {
    from(table: string) {
      if (table !== "convenios") throw new Error(`unexpected table ${table}`);

      return {
        insert: vi.fn((payload: any) => {
          adminCalls.inserts.push(payload);
          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: { id: "conv-1", ...payload },
                error: null,
              })),
            })),
          };
        }),
        update: vi.fn((payload: any) => {
          adminCalls.updates.push(payload);
          return {
            eq: vi.fn(async () => ({ error: null })),
          };
        }),
      };
    },
  };

  return { supabase, supabaseAdmin, adminCalls };
}

describe("POST /api/convenios", () => {
  let ctx: ReturnType<typeof createSupabaseDouble>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createSupabaseDouble();
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);
    mocks.mockCreateSupabaseAdmin.mockReturnValue(ctx.supabaseAdmin);
    mocks.mockRenderDocx.mockResolvedValue(Buffer.from("generated-doc"));
    mocks.mockEnsureConvenioFolder.mockResolvedValue({
      folderId: "folder-1",
      folderWebViewLink: "https://drive.google.com/drive/folders/folder-1",
      migratedFromFile: false,
    });
    mocks.mockUploadFileToOAuthDrive.mockResolvedValue({
      webViewLink: "https://drive.google.com/file/d/generated-doc/view",
    });
    mocks.mockUploadConvenioEspecificoOAuth.mockResolvedValue({
      webViewLink: "https://drive.google.com/drive/folders/folder-anexos",
    });
  });

  it("stores standard convenios under a dedicated folder URL", async () => {
    const response = await POST(
      new Request("http://localhost/api/convenios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Convenio Marco",
          template_slug: "nuevo-convenio-marco",
          secretariat_id: "sec-1",
          form_data: { entidad_nombre: "Empresa SA" },
          agreement_year: 2026,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.mockEnsureConvenioFolder).toHaveBeenCalledWith({
      convenioTitle: expect.stringContaining("Convenio_Convenio Marco_"),
      parentFolderId: "pending-folder",
      currentDocumentPath: null,
    });
    expect(mocks.mockUploadFileToOAuthDrive).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringContaining("Convenio_Convenio Marco_"),
      "folder-1",
      false,
    );

    const payload = await response.json();
    expect(payload.convenio.document_path).toBe("https://drive.google.com/drive/folders/folder-1");
  });

  it("keeps folder-based storage for convenios created with anexos", async () => {
    const response = await POST(
      new Request("http://localhost/api/convenios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Convenio Específico",
          template_slug: "nuevo-convenio-especifico",
          secretariat_id: "sec-1",
          form_data: { entidad_nombre: "Empresa SA" },
          agreement_year: 2026,
          anexos: [{ name: "anexo.pdf", driveFileId: "drive-anexo-1", mimeType: "application/pdf" }],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.mockUploadConvenioEspecificoOAuth).toHaveBeenCalled();
    expect(mocks.mockUploadFileToOAuthDrive).not.toHaveBeenCalled();

    const payload = await response.json();
    expect(payload.convenio.document_path).toBe("https://drive.google.com/drive/folders/folder-anexos");
  });

  it("stores PPS attachment refs in form_data and uploads them into the convenio folder", async () => {
    const response = await POST(
      new Request("http://localhost/api/convenios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Convenio Particular PPS",
          convenio_type_id: 1,
          convenio_type: "particular",
          template_slug: "nuevo-convenio-particular-de-practica-supervisada",
          secretariat_id: "sec-1",
          agreement_year: 2026,
          content_data: {
            empresa_nombre: "Empresa SA",
            alumno_nombre: "Alumno Test",
          },
          anexos: [
            {
              name: "pps-anexo.pdf",
              driveFileId: "drive-pps-1",
              mimeType: "application/pdf",
              size: 12345,
              webViewLink: "https://drive.google.com/file/d/drive-pps-1/view",
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.mockUploadConvenioEspecificoOAuth).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringContaining("Convenio_Convenio Particular PPS_"),
      [
        expect.objectContaining({
          name: "pps-anexo.pdf",
          driveFileId: "drive-pps-1",
        }),
      ],
      "pending-folder",
    );

    expect(ctx.adminCalls.inserts[0]).toMatchObject({
      convenio_type_id: 1,
      form_data: expect.objectContaining({
        empresa_nombre: "Empresa SA",
        alumno_nombre: "Alumno Test",
        anexos: [
          expect.objectContaining({
            name: "pps-anexo.pdf",
            driveFileId: "drive-pps-1",
          }),
        ],
      }),
    });
  });

  it("maps adenda to type 6, stores acuerdos and uploads anexos to folder flow", async () => {
    const response = await POST(
      new Request("http://localhost/api/convenios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Adenda Test",
          convenio_type: "adenda",
          template_slug: "nuevo-adenda",
          secretariat_id: "sec-1",
          agreement_year: 2026,
          form_data: {
            entidad_nombre: "Entidad Adenda",
            entidad_tipo: "Empresa",
            convenios_previos: [
              {
                tipo: "Convenio Marco",
                fecha: "2026-05-01",
                objeto: "Cooperación institucional",
              },
            ],
            acuerdan: [{ ordinal: "PRIMERA", texto: "Texto de prueba" }],
          },
          anexos: [
            {
              name: "adenda-anexo.pdf",
              driveFileId: "drive-adenda-1",
              mimeType: "application/pdf",
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.mockFsReadFileSync).toHaveBeenCalledWith(expect.stringMatching(/[\\/]templates[\\/]adenda\.docx$/));
    expect(mocks.mockRenderDocx).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({
        entidad_tipo: "Empresa",
        convenios_previos: [
          expect.objectContaining({
            tipo: "Convenio Marco",
            fecha: "2026-05-01",
            objeto: "Cooperación institucional",
          }),
        ],
        acuerdan: [
          expect.objectContaining({
            ordinal: "PRIMERA",
            texto: "Texto de prueba",
          }),
        ],
      }),
    );
    expect(mocks.mockUploadConvenioEspecificoOAuth).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringContaining("Convenio_Adenda Test_"),
      [
        expect.objectContaining({
          name: "adenda-anexo.pdf",
          driveFileId: "drive-adenda-1",
        }),
      ],
      "pending-folder",
    );

    expect(ctx.adminCalls.inserts[0]).toMatchObject({
      convenio_type_id: 6,
      form_data: expect.objectContaining({
        entidad_nombre: "Entidad Adenda",
        entidad_tipo: "Empresa",
        convenios_previos: [
          expect.objectContaining({
            tipo: "Convenio Marco",
            fecha: "2026-05-01",
            objeto: "Cooperación institucional",
          }),
        ],
        acuerdan: [
          expect.objectContaining({
            ordinal: "PRIMERA",
            texto: "Texto de prueba",
          }),
        ],
        anexos: [
          expect.objectContaining({
            driveFileId: "drive-adenda-1",
          }),
        ],
      }),
    });
  });

  it("uses adenda folder flow even when recovered anexo refs arrive only inside form_data", async () => {
    const response = await POST(
      new Request("http://localhost/api/convenios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Adenda Recovered Refs",
          convenio_type: "adenda",
          template_slug: "nuevo-adenda",
          secretariat_id: "sec-1",
          agreement_year: 2026,
          form_data: {
            entidad_nombre: "Entidad Adenda",
            acuerdos: [],
            acuerdan: [{ ordinal: "PRIMERA", texto: "Texto de prueba" }],
            anexos: [
              {
                name: "ANEXO-adenda-anexo.pdf",
                driveFileId: "drive-adenda-2",
                mimeType: "application/pdf",
                size: 2048,
              },
            ],
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.mockUploadConvenioEspecificoOAuth).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringContaining("Convenio_Adenda Recovered Refs_"),
      [
        expect.objectContaining({
          name: "ANEXO-adenda-anexo.pdf",
          driveFileId: "drive-adenda-2",
        }),
      ],
      "pending-folder",
    );
    expect(mocks.mockUploadFileToOAuthDrive).not.toHaveBeenCalled();
    expect(ctx.adminCalls.inserts[0]).toMatchObject({
      convenio_type_id: 6,
      form_data: expect.objectContaining({
        anexos: [
          expect.objectContaining({
            driveFileId: "drive-adenda-2",
          }),
        ],
      }),
    });
  });

  it("submits PPS without attachments using the normal folder flow", async () => {
    const response = await POST(
      new Request("http://localhost/api/convenios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Convenio Particular PPS Sin Anexos",
          convenio_type_id: 1,
          convenio_type: "particular",
          template_slug: "nuevo-convenio-particular-de-practica-supervisada",
          secretariat_id: "sec-1",
          agreement_year: 2026,
          content_data: {
            empresa_nombre: "Empresa SA",
            alumno_nombre: "Alumno Sin Anexo",
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.mockUploadConvenioEspecificoOAuth).not.toHaveBeenCalled();
    expect(mocks.mockEnsureConvenioFolder).toHaveBeenCalledWith({
      convenioTitle: expect.stringContaining("Convenio_Convenio Particular PPS Sin Anexos_"),
      parentFolderId: "pending-folder",
      currentDocumentPath: null,
    });
    expect(mocks.mockUploadFileToOAuthDrive).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringContaining("Convenio_Convenio Particular PPS Sin Anexos_"),
      "folder-1",
      false,
    );

    expect(ctx.adminCalls.inserts[0]).toMatchObject({
      convenio_type_id: 1,
      form_data: expect.not.objectContaining({
        anexos: expect.anything(),
      }),
    });

    const payload = await response.json();
    expect(payload.convenio.document_path).toBe("https://drive.google.com/drive/folders/folder-1");
  });

  it("stores secretary-created convenios under a dedicated folder URL", async () => {
    const ctx = createSupabaseDouble({ role: "user", fullName: "Secretaria SA", userId: "secretary-1" });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = await POST(
      new Request("http://localhost/api/convenios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Convenio Secretaría",
          template_slug: "nuevo-convenio-marco",
          secretariat_id: "sec-1",
          form_data: { entidad_nombre: "Empresa SA" },
          agreement_year: 2026,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.mockEnsureConvenioFolder).toHaveBeenCalledWith({
      convenioTitle: expect.stringContaining("Convenio_Convenio Secretaría_"),
      parentFolderId: "pending-folder",
      currentDocumentPath: null,
    });

    const payload = await response.json();
    expect(payload.convenio.document_path).toBe("https://drive.google.com/drive/folders/folder-1");
  });
});
