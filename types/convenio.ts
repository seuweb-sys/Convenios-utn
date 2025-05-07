import { z } from 'zod';

// Schema Zod para Datos Básicos (basado en lo que hicimos antes)
// Exportamos el schema para poder usarlo en la validación inicial del store
export const DatosBasicosSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    objeto: z.string().min(1, "El objeto es requerido"),
    fechaInicio: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Fecha de inicio inválida" }),
    fechaFin: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Fecha de fin inválida" }),
    confidencial: z.boolean().optional(),
    // TODO: Añadir otros campos si los hay
}).refine(data => new Date(data.fechaInicio) < new Date(data.fechaFin), {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["fechaFin"], // Asociar error al campo fechaFin
});

// Tipo inferido del schema Zod para Datos Básicos
export type DatosBasicosData = z.infer<typeof DatosBasicosSchema>;

// --- Placeholder para otros pasos --- 
// (Crear schemas y tipos Zod para estos cuando refactoricemos esos formularios)

// Ejemplo para Partes
export const ParteSchema = z.object({
    id: z.string().uuid().optional(), 
    tipo: z.enum(['universidad', 'empresa', 'alumno', 'docente', 'otro'])
           .optional() // Hacerlo opcional explícitamente
           .default('empresa'), // Luego aplicar default
    nombre: z.string().min(1, "Nombre de la parte requerido"),
    cuit: z.string()
           .optional()
           .refine(val => !val || /^\d{2}-\d{8}-\d{1}$/.test(val), { // Validar formato CUIT si existe
               message: "Formato CUIT inválido (XX-XXXXXXXX-X)"
           }),
    domicilio: z.string().min(1, "Domicilio requerido"), // Requerido
    representanteNombre: z.string().min(1, "Nombre del representante requerido"), // Requerido
    representanteDni: z.string()
                       .optional()
                       .refine(val => !val || /^\d{7,8}$/.test(val), { // Validar formato DNI simple si existe
                           message: "Formato DNI inválido (7 u 8 dígitos)"
                       }),
    cargoRepresentante: z.string().min(1, "Cargo del representante requerido"), // Añadido y requerido
});
export type ParteData = z.infer<typeof ParteSchema>;

// Schema para una Cláusula individual
export const ClausulaSchema = z.object({
  // id: z.string().uuid().optional(), // Podríamos añadir un ID si se necesita
  texto: z.string().min(1, "El texto de la cláusula no puede estar vacío"),
});
export type ClausulaData = z.infer<typeof ClausulaSchema>;

// Schema para el array de Cláusulas (validará que cada objeto cumpla ClausulaSchema)
export const ClausulasFormSchema = z.object({
  clausulas: z.array(ClausulaSchema).min(1, "Debe haber al menos una cláusula"), // Asegura al menos una cláusula
});
export type ClausulasFormData = z.infer<typeof ClausulasFormSchema>;

// Estructura principal para todos los datos del convenio
// Usamos Partial porque los datos pueden venir incompletos inicialmente
export interface ConvenioData {
    id?: number; // ID del convenio en la BBDD
    typeId: number; // ID del tipo de convenio
    status?: string; // Ej: 'borrador', 'activo', 'finalizado'
    createdAt?: string | Date;
    updatedAt?: string | Date;

    // Datos agrupados por paso/sección
    datosBasicos?: DatosBasicosData;
    partes?: ParteData[]; // Array de partes
    clausulas?: ClausulaData[]; // <--- Actualizado para usar ClausulaData
    anexos?: { nombreArchivo: string; url: string }[]; // Array de objetos de anexo (ejemplo)
    revision?: { comentarios: string; aprobado: boolean }; // Ejemplo

    // Podríamos añadir otros campos globales si es necesario
    // numeroExpediente?: string;
} 