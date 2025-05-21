export interface EntidadData {
  nombre: string;
  tipo: string;
  domicilio: string;
  ciudad: string;
  cuit: string;
}

export interface RepresentanteData {
  nombre: string;
  cargo: string;
  dni: string;
  email: string;
}

export interface ConvenioData {
  numero: string;
  fecha: string;
  objeto: string;
  duracion: string;
  renovacion: boolean;
}

export interface ClausulasData {
  obligaciones: string[];
  confidencialidad: boolean;
  propiedadIntelectual: boolean;
  terminacion: boolean;
}

export interface ConvenioMarcoData {
  entidad: EntidadData;
  representante: RepresentanteData;
  convenio: ConvenioData;
  clausulas: ClausulasData;
}

// Validadores
export const validateEntidad = (data: Partial<EntidadData>) => {
  const errors: Record<string, string> = {};

  if (!data.nombre?.trim()) {
    errors.nombre = 'El nombre es requerido';
  }

  if (!data.tipo?.trim()) {
    errors.tipo = 'El tipo de entidad es requerido';
  }

  if (!data.domicilio?.trim()) {
    errors.domicilio = 'El domicilio es requerido';
  }

  if (!data.ciudad?.trim()) {
    errors.ciudad = 'La ciudad es requerida';
  }

  if (!data.cuit?.trim()) {
    errors.cuit = 'El CUIT es requerido';
  } else if (!/^\d{11}$/.test(data.cuit)) {
    errors.cuit = 'El CUIT debe tener 11 dígitos';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRepresentante = (data: Partial<RepresentanteData>) => {
  const errors: Record<string, string> = {};

  if (!data.nombre?.trim()) {
    errors.nombre = 'El nombre es requerido';
  }

  if (!data.cargo?.trim()) {
    errors.cargo = 'El cargo es requerido';
  }

  if (!data.dni?.trim()) {
    errors.dni = 'El DNI es requerido';
  } else if (!/^\d{7,8}$/.test(data.dni)) {
    errors.dni = 'El DNI debe tener 7 u 8 dígitos';
  }

  if (!data.email?.trim()) {
    errors.email = 'El email es requerido';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'El email no es válido';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateConvenio = (data: Partial<ConvenioData>) => {
  const errors: Record<string, string> = {};

  if (!data.numero?.trim()) {
    errors.numero = 'El número de convenio es requerido';
  }

  if (!data.fecha?.trim()) {
    errors.fecha = 'La fecha es requerida';
  }

  if (!data.objeto?.trim()) {
    errors.objeto = 'El objeto del convenio es requerido';
  }

  if (!data.duracion?.trim()) {
    errors.duracion = 'La duración es requerida';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 