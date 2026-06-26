import { describe, expect, it } from "vitest";

import {
  CONVENIO_STATUSES,
  resolveConvenioStatusDisplay,
} from "@/app/components/dashboard/convenio-status-display";

describe("convenio dashboard status display (admin correction flow cleanup)", () => {
  it("resolves a display descriptor for every supported status", () => {
    const expected = {
      enviado: { label: "Enviado", icon: "clock" },
      pendiente: { label: "Pendiente", icon: "clock" },
      aprobado: { label: "Aprobado", icon: "check" },
      rechazado: { label: "Rechazado", icon: "alert" },
      borrador: { label: "Borrador", icon: "file" },
    } as const;

    for (const status of Object.keys(expected) as Array<keyof typeof expected>) {
      const display = resolveConvenioStatusDisplay(status);
      expect(display.label).toBe(expected[status].label);
      expect(display.icon).toBe(expected[status].icon);
      expect(display.color.length).toBeGreaterThan(0);
    }
  });

  it("no longer exposes the legacy revision_modificacion status", () => {
    expect(CONVENIO_STATUSES).not.toContain("revision_modificacion");
    expect(CONVENIO_STATUSES).toHaveLength(5);
    expect(CONVENIO_STATUSES).toEqual(
      expect.arrayContaining([
        "enviado",
        "pendiente",
        "aprobado",
        "rechazado",
        "borrador",
      ]),
    );
  });

  it("returns the correct color class for an approved convenio", () => {
    expect(resolveConvenioStatusDisplay("aprobado").color).toBe(
      "bg-green-500/10 text-green-500 border-green-500/20",
    );
  });
});