// Eliminamos la importación de Zod
// import { z } from 'zod';
// Ahora usamos TypeScript puro

// Interfaces para los datos
export interface DatosBasicosData {
    nombre: string;
    objeto: string;
    fechaInicio: string;
    fechaFin: string;
    confidencial?: boolean;
    dia?: string;
    mes?: string;
}

// Función simple de validación para DatosBasicos
export function validateDatosBasicos(data?: DatosBasicosData): { valid: boolean, errors: string[] } {
    const errors: string[] = [];
    if (!data) return { valid: false, errors: ['Faltan datos básicos'] };
    
    if (!data.nombre) errors.push('El nombre es requerido');
    if (!data.objeto) errors.push('El objeto es requerido');
    if (!data.fechaInicio) errors.push('Fecha de inicio es requerida');
    if (!data.fechaFin) errors.push('Fecha de fin es requerida');
    
    // Validar que fechaFin es posterior a fechaInicio
    if (data.fechaInicio && data.fechaFin) {
        const inicio = new Date(data.fechaInicio);
        const fin = new Date(data.fechaFin);
        if (inicio >= fin) {
            errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// Tipos para Partes
export type ParteTipo = 'universidad' | 'empresa' | 'alumno' | 'docente' | 'otro';

export interface ParteData {
    id?: string;
    tipo: ParteTipo;
    nombre: string;
    cuit?: string;
    domicilio: string;
    representanteNombre: string;
    representanteDni?: string;
    cargoRepresentante: string;
}

// Función de validación para Partes
export function validateParte(data?: Partial<ParteData>): { valid: boolean, errors: string[] } {
    const errors: string[] = [];
    if (!data) return { valid: false, errors: ['Faltan datos de la parte'] };
    
    // Validar campos requeridos
    if (!data.nombre) errors.push('Nombre de la parte requerido');
    if (!data.domicilio) errors.push('Domicilio requerido');
    if (!data.representanteNombre) errors.push('Nombre del representante requerido');
    if (!data.cargoRepresentante) errors.push('Cargo del representante requerido');
    
    // Validar formato CUIT si existe
    if (data.cuit && !/^\d{2}-\d{8}-\d{1}$/.test(data.cuit)) {
        errors.push('Formato CUIT inválido (XX-XXXXXXXX-X)');
    }
    
    // Validar formato DNI si existe
    if (data.representanteDni) {
        const cleanDni = data.representanteDni.replace(/[^\d]/g, '');
        if (cleanDni.length < 7 || cleanDni.length > 8) {
            errors.push('DNI debe tener 7 u 8 dígitos numéricos');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// Estructura para Cláusulas
export interface ClausulaData {
    texto: string;
}

// Función de validación para Cláusulas
export function validateClausulas(clausulas?: ClausulaData[]): { valid: boolean, errors: string[] } {
    const errors: string[] = [];
    
    if (!clausulas || clausulas.length === 0) {
        errors.push('Debe haber al menos una cláusula');
        return { valid: false, errors };
    }
    
    // Verificar que clausulas sea un array
    if (!Array.isArray(clausulas)) {
        errors.push('El formato de las cláusulas es incorrecto');
        return { valid: false, errors };
    }
    
    // Verificar que cada cláusula tenga texto
    clausulas.forEach((clausula, index) => {
        if (!clausula.texto || clausula.texto.trim() === '') {
            errors.push(`El texto de la cláusula ${index + 1} no puede estar vacío`);
        }
    });
    
    return {
        valid: errors.length === 0,
        errors
    };
}

export interface ClausulasFormData {
    clausulas: ClausulaData[];
}

// Estructura principal para todos los datos del convenio
export interface ConvenioData {
    id?: number; // ID del convenio en la BBDD
    typeId: number; // ID del tipo de convenio
    status?: string; // Ej: 'enviado', 'aceptado', 'rechazado'
    createdAt?: string | Date;
    updatedAt?: string | Date;

    // Datos agrupados por paso/sección
    datosBasicos?: DatosBasicosData;
    partes?: ParteData[]; // Array de partes
    clausulas?: ClausulaData[]; // Array de clausulas
    anexos?: { nombreArchivo: string; url: string }[]; // Array de objetos de anexo
    revision?: { comentarios: string; aprobado: boolean };
} 