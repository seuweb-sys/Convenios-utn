// Tipos específicos para Convenio Marco
export interface EntidadData {
  nombre: string;
  tipo: string;
  domicilio: string;
  ciudad: string;
  cuit: string;
}

export interface RepresentanteData {
  nombre: string;
  dni: string;
  cargo: string;
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

// Validación de campos
export const validateEntidad = (data: EntidadData) => {
  const errors: Record<string, string> = {};
  
  if (!data.nombre?.trim()) {
    errors.nombre = "El nombre de la entidad es requerido";
  }
  if (!data.tipo?.trim()) {
    errors.tipo = "El tipo de entidad es requerido";
  }
  if (!data.domicilio?.trim()) {
    errors.domicilio = "El domicilio es requerido";
  }
  if (!data.ciudad?.trim()) {
    errors.ciudad = "La ciudad es requerida";
  }
  if (!data.cuit?.trim()) {
    errors.cuit = "El CUIT es requerido";
  } else if (!/^\d{11}$/.test(data.cuit.replace(/-/g, ''))) {
    errors.cuit = "El CUIT debe tener 11 dígitos";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRepresentante = (data: RepresentanteData) => {
  const errors: Record<string, string> = {};
  
  if (!data.nombre?.trim()) {
    errors.nombre = "El nombre del representante es requerido";
  }
  if (!data.dni?.trim()) {
    errors.dni = "El DNI es requerido";
  } else if (!/^\d{7,8}$/.test(data.dni.replace(/\./g, ''))) {
    errors.dni = "El DNI debe tener 7 u 8 dígitos";
  }
  if (!data.cargo?.trim()) {
    errors.cargo = "El cargo es requerido";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateFechas = (data: FechasData) => {
  const errors: Record<string, string> = {};
  
  if (!data.dia?.trim()) {
    errors.dia = "El día es requerido";
  } else {
    const dia = parseInt(data.dia);
    if (isNaN(dia) || dia < 1 || dia > 31) {
      errors.dia = "El día debe ser un número entre 1 y 31";
    }
  }
  
  if (!data.mes?.trim()) {
    errors.mes = "El mes es requerido";
  } else {
    const mes = parseInt(data.mes);
    if (isNaN(mes) || mes < 1 || mes > 12) {
      errors.mes = "El mes debe ser un número entre 1 y 12";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateConvenioMarco = (data: ConvenioMarcoData) => {
  const entidadValidation = validateEntidad(data.entidad);
  const representanteValidation = validateRepresentante(data.representante);
  const fechasValidation = validateFechas(data.fechas);

  return {
    valid: entidadValidation.valid && representanteValidation.valid && fechasValidation.valid,
    errors: {
      ...entidadValidation.errors,
      ...representanteValidation.errors,
      ...fechasValidation.errors
    }
  };
}; 