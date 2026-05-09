import { describe, expect, it } from "vitest";

import { PPS_CAREER_OPTIONS } from "@/app/lib/forms/pps-careers";

describe("PPS career options", () => {
  it("provides stable code-defined options with usable labels and values", () => {
    expect(PPS_CAREER_OPTIONS.length).toBeGreaterThan(3);
    expect(PPS_CAREER_OPTIONS).toContainEqual({
      value: "ingenieria-en-sistemas-de-informacion",
      label: "Ingeniería en Sistemas de Información",
    });
  });

  it("does not expose database-shaped identifiers", () => {
    for (const option of PPS_CAREER_OPTIONS) {
      expect(option.value).not.toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i);
      expect(option.label.trim()).toBe(option.label);
    }
  });
});
