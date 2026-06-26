import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

import { DELETE, PATCH } from "@/app/api/admin/memberships/[id]/route";
import { POST } from "@/app/api/admin/memberships/route";

vi.mock("@/utils/supabase/server", () => ({
  createClient: mocks.mockCreateClient,
}));

function createMembershipAdminSupabaseDouble(options?: {
  targetProfileRole?: string;
  targetMembershipActive?: boolean;
  siblingMemberships?: Array<{ id: string; is_active: boolean }>;
  secretariatCodeById?: Record<string, string>;
}) {
  const calls = {
    profileMembershipInserts: [] as any[],
    auditInserts: [] as any[],
    activityInserts: [] as any[],
    deletes: [] as string[],
  };

  const targetMembership = {
    id: "membership-1",
    profile_id: "profile-2",
    membership_role: "secretario",
    secretariat_id: "sa-id",
    career_id: null,
    org_unit_id: null,
    is_active: options?.targetMembershipActive ?? true,
  };

  const siblingMemberships = options?.siblingMemberships ?? [{ id: "membership-1", is_active: true }];
  const secretariatCodeById = options?.secretariatCodeById ?? { "sa-id": "SA", "cyt-id": "CYT" };

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "admin-1" } },
        error: null,
      }),
    },
    from(table: string) {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_: string, id: string) => ({
              single: vi.fn(async () => ({
                data:
                  id === "admin-1"
                    ? { role: "admin" }
                    : { role: options?.targetProfileRole ?? "user" },
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === "secretariats") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_: string, id: string) => ({
              single: vi.fn(async () => {
                const code = secretariatCodeById[id];
                return code ? { data: { code }, error: null } : { data: null, error: { message: "missing" } };
              }),
            })),
          })),
        };
      }

      if (table === "profile_memberships") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((column: string, value: string) => {
              if (column === "id") {
                return {
                  single: vi.fn(async () => ({ data: targetMembership, error: null })),
                };
              }

              if (column === "profile_id") {
                return Promise.resolve({ data: siblingMemberships, error: null });
              }

              return { single: vi.fn(async () => ({ data: null, error: null })) };
            }),
          })),
          insert: vi.fn((payload: any) => {
            calls.profileMembershipInserts.push(payload);
            return {
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { id: "created-membership", ...payload }, error: null })),
              })),
            };
          }),
          update: vi.fn((payload: any) => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { id: "membership-1", ...payload }, error: null })),
              })),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(async (_: string, id: string) => {
              calls.deletes.push(id);
              return { error: null };
            }),
          })),
        };
      }

      if (table === "profile_membership_correction_audit") {
        return {
          insert: vi.fn(async (payload: any) => {
            calls.auditInserts.push(payload);
            return { error: null };
          }),
        };
      }

      if (table === "activity_log") {
        return {
          insert: vi.fn(async (payload: any) => {
            calls.activityInserts.push(payload);
            return { error: null };
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };

  return { supabase, calls };
}

describe("admin memberships routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 422 with rule code when director/profesor is created outside SA", async () => {
    const ctx = createMembershipAdminSupabaseDouble({ secretariatCodeById: { "cyt-id": "CYT" } });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = (await POST(
      new Request("http://localhost/api/admin/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: "profile-2",
          membership_role: "director",
          secretariat_id: "cyt-id",
          career_id: "career-a",
          org_unit_id: null,
          is_active: true,
        }),
      }),
    ))!;

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "DIRECTOR_PROFESOR_REQUIRE_SA",
    });
    expect(ctx.calls.profileMembershipInserts).toHaveLength(0);
  });

  it("returns 422 with rule code when director/profesor is created without a career", async () => {
    const ctx = createMembershipAdminSupabaseDouble();
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = (await POST(
      new Request("http://localhost/api/admin/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: "profile-2",
          membership_role: "director",
          secretariat_id: "sa-id",
          career_id: null,
          org_unit_id: null,
          is_active: true,
        }),
      }),
    ))!;

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "DIRECTOR_PROFESOR_REQUIRE_CAREER",
    });
    expect(ctx.calls.profileMembershipInserts).toHaveLength(0);
  });

  it("blocks deleting the last active membership for an admin profile", async () => {
    const ctx = createMembershipAdminSupabaseDouble({
      targetProfileRole: "admin",
      siblingMemberships: [{ id: "membership-1", is_active: true }],
    });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = (await DELETE(new Request("http://localhost/api/admin/memberships/membership-1", { method: "DELETE" }), {
      params: { id: "membership-1" },
    }))!;

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "LAST_ACTIVE_ADMIN_MEMBERSHIP",
    });
    expect(ctx.calls.deletes).toHaveLength(0);
    expect(ctx.calls.auditInserts).toHaveLength(0);
  });

  it("writes an audit snapshot and activity log before deleting a membership", async () => {
    const ctx = createMembershipAdminSupabaseDouble({
      targetProfileRole: "admin",
      siblingMemberships: [
        { id: "membership-1", is_active: true },
        { id: "membership-2", is_active: true },
      ],
    });
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = (await DELETE(
      new Request("http://localhost/api/admin/memberships/membership-1", {
        method: "DELETE",
        headers: { "x-forwarded-for": "127.0.0.1" },
      }),
      { params: { id: "membership-1" } },
    ))!;

    expect(response.status).toBe(200);
    expect(ctx.calls.auditInserts[0]).toMatchObject({
      profile_id: "profile-2",
      previous_rows: [expect.objectContaining({ id: "membership-1" })],
    });
    expect(ctx.calls.activityInserts[0]).toMatchObject({
      user_id: "admin-1",
      action: "admin_delete_membership",
      status_from: "active",
      status_to: "deleted",
    });
    expect(ctx.calls.deletes).toEqual(["membership-1"]);
  });

  it("keeps PATCH membership toggles working", async () => {
    const ctx = createMembershipAdminSupabaseDouble();
    mocks.mockCreateClient.mockResolvedValue(ctx.supabase);

    const response = (await PATCH(
      new Request("http://localhost/api/admin/memberships/membership-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      }),
      { params: { id: "membership-1" } },
    ))!;

    expect(response.status).toBe(200);
  });
});
