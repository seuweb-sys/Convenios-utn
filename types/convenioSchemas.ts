import { z } from 'zod';

export const PartesSchema = z.object({
  nombre: z.string().min(1, "Nombre de la parte requerido"),
  domicilio: z.string().min(1, "Domicilio requerido"),
  representanteNombre: z.string().min(1, "Nombre del representante requerido"),
  representanteDni: z.string()
    .min(1, "DNI del representante requerido")
    .regex(/^[0-9]+$/, "DNI debe contener solo números")
    .refine(dni => dni.length === 7 || dni.length === 8, {
      message: "DNI debe tener 7 u 8 dígitos numéricos",
    }),
  cargoRepresentante: z.string().min(1, "Cargo del representante requerido"),
}); 