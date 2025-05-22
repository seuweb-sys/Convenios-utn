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
}

export interface FechasData {
  dia: string;
  mes: string;
}

export interface ConvenioMarcoData {
  entidad: EntidadData;
  representante: RepresentanteData;
  fechas: FechasData;
}

// Estructura para mapear a la BD (formato plano)
export interface ConvenioMarcoDB {
  entidad_nombre: string;
  entidad_tipo: string;
  entidad_domicilio: string;
  entidad_ciudad: string;
  entidad_cuit: string;
  entidad_representante: string;
  entidad_dni: string;
  entidad_cargo: string;
  dia: string;
  mes: string;
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

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateFechas = (data: Partial<FechasData>) => {
  const errors: Record<string, string> = {};

  if (!data.dia?.trim()) {
    errors.dia = 'El día es requerido';
  } else if (isNaN(Number(data.dia)) || Number(data.dia) < 1 || Number(data.dia) > 31) {
    errors.dia = 'El día debe ser un número entre 1 y 31';
  }

  if (!data.mes?.trim()) {
    errors.mes = 'El mes es requerido';
  } else if (!['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'].includes(data.mes.toLowerCase())) {
    errors.mes = 'Ingrese un mes válido (ej: enero, febrero)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Función para convertir del formato jerárquico al formato plano (para la BD)
export const toDbFormat = (data: ConvenioMarcoData): ConvenioMarcoDB => {
  return {
    entidad_nombre: data.entidad.nombre,
    entidad_tipo: data.entidad.tipo,
    entidad_domicilio: data.entidad.domicilio,
    entidad_ciudad: data.entidad.ciudad,
    entidad_cuit: data.entidad.cuit,
    entidad_representante: data.representante.nombre,
    entidad_dni: data.representante.dni,
    entidad_cargo: data.representante.cargo,
    dia: data.fechas.dia,
    mes: data.fechas.mes
  };
};

// Función para convertir del formato plano al formato jerárquico
export const fromDbFormat = (data: ConvenioMarcoDB): ConvenioMarcoData => {
  return {
    entidad: {
      nombre: data.entidad_nombre,
      tipo: data.entidad_tipo,
      domicilio: data.entidad_domicilio,
      ciudad: data.entidad_ciudad,
      cuit: data.entidad_cuit
    },
    representante: {
      nombre: data.entidad_representante,
      dni: data.entidad_dni,
      cargo: data.entidad_cargo
    },
    fechas: {
      dia: data.dia,
      mes: data.mes
    }
  };
}; 