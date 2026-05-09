import { describe, expect, it } from "vitest";

import {
  dniSchema,
  normalizeOptionalCuit,
  optionalCuitSchema,
} from "@/app/lib/forms/identity-validation";

describe("identity validation helpers", () => {
  it("accepts required numeric DNI values up to 20 digits", () => {
    expect(dniSchema.parse("1")).toBe("1");
    expect(dniSchema.parse("12345678901234567890")).toBe("12345678901234567890");
  });

  it("rejects blank, non-numeric, and overlong DNI values", () => {
    expect(() => dniSchema.parse("")).toThrow();
    expect(() => dniSchema.parse("A123")).toThrow();
    expect(() => dniSchema.parse("123456789012345678901")).toThrow();
  });

  it("normalizes optional CUIT to an empty string when absent", () => {
    expect(optionalCuitSchema.parse("")).toBe("");
    expect(normalizeOptionalCuit(undefined)).toBe("");
    expect(normalizeOptionalCuit("  ")).toBe("");
  });

  it("accepts numeric CUIT values and rejects non-numeric text", () => {
    expect(optionalCuitSchema.parse("30712345678")).toBe("30712345678");
    expect(() => optionalCuitSchema.parse("30-71234567-8")).toThrow();
  });
});
