import { describe, expect, it } from "vitest";

import { formatActivityEntry } from "@/app/api/activity/activity-format";

describe("activity formatters", () => {
  it("renders explicit admin direct edit regeneration copy", () => {
    const formatted = formatActivityEntry(
      {
        action: "admin_direct_edit_regenerated",
        status_from: "aprobado",
        status_to: "enviado",
        created_at: "2026-05-15T10:00:00.000Z",
      },
      {
        title: "Convenio Marco",
        serial_number: "UTN-001",
      },
      { full_name: "Admin User" },
    );

    expect(formatted.title).toBe("Convenio regenerado por edición administrativa");
    expect(formatted.description).toContain("Convenio Marco");
    expect(formatted.description).toContain("enviado");
  });

  it("preserves applicant resubmission copy", () => {
    const formatted = formatActivityEntry(
      {
        action: "resubmit_convenio",
        status_from: "revision",
        status_to: "enviado",
        created_at: "2026-05-15T10:00:00.000Z",
      },
      {
        title: "Convenio Particular",
        serial_number: "UTN-002",
      },
      { full_name: "Applicant User" },
    );

    expect(formatted.title).toBe("Convenio reenviado");
    expect(formatted.description).toContain("Convenio Particular");
  });
});
