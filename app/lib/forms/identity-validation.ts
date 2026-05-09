import { z } from "zod";

const numericMessage = "Solo números";

export const dniSchema = z
  .string()
  .min(1, "El DNI es obligatorio")
  .max(20, "El DNI no puede tener más de 20 dígitos")
  .regex(/^\d+$/, numericMessage);

export function normalizeOptionalCuit(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export const optionalCuitSchema = z
  .string()
  .trim()
  .regex(/^\d*$/, numericMessage);
