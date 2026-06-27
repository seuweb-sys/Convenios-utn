import { isAdendaConvenioData } from "@/stores/convenioMarcoStore";

function looksLikeAdendaPayload(convenioData: any) {
  return [
    "provincia",
    "anio",
    "entidad_provincia",
    "convenios_previos",
    "exponen_adicional",
    "acuerdan",
  ].some((key) => key in (convenioData || {}));
}

export function mapConvenioDataToFields(convenioData: any) {
  if (isAdendaConvenioData(convenioData, convenioData) || looksLikeAdendaPayload(convenioData)) {
    const conveniosPrevios = Array.isArray(convenioData.convenios_previos) && convenioData.convenios_previos.length > 0
      ? convenioData.convenios_previos
      : (convenioData?.convenio_previo_tipo || convenioData?.convenio_previo_fecha || convenioData?.convenio_previo_objeto)
        ? [{
            tipo: convenioData.convenio_previo_tipo || "",
            fecha: convenioData.convenio_previo_fecha || "",
            objeto: convenioData.convenio_previo_objeto || "",
          }]
        : [];

    return {
      ciudad: convenioData.ciudad || "",
      provincia: convenioData.provincia || "",
      dia: convenioData.dia || "",
      mes: convenioData.mes || "",
      anio: convenioData.anio || "",
      entidad_nombre: convenioData.entidad_nombre || "",
      entidad_tipo: convenioData.entidad_tipo || "",
      entidad_domicilio: convenioData.entidad_domicilio || "",
      entidad_ciudad: convenioData.entidad_ciudad || "",
      entidad_provincia: convenioData.entidad_provincia || "",
      entidad_cuit: convenioData.entidad_cuit || "",
      entidad_representante: convenioData.entidad_representante || "",
      entidad_dni: convenioData.entidad_dni || "",
      entidad_cargo: convenioData.entidad_cargo || "",
      convenios_previos: conveniosPrevios,
      exponen_adicional: convenioData.exponen_adicional || "",
      acuerdan: Array.isArray(convenioData.acuerdan) ? convenioData.acuerdan : [],
      anexos: Array.isArray(convenioData.anexos)
        ? convenioData.anexos
        : Array.isArray(convenioData.anexosMarco)
          ? convenioData.anexosMarco
          : [],
    };
  }

  const parte = convenioData.partes?.[0] || {};
  const datosBasicos = convenioData.datosBasicos || {};

  return {
    entidad_nombre: parte.nombre || "",
    entidad_tipo: parte.tipo || "",
    entidad_domicilio: parte.domicilio || "",
    entidad_ciudad: parte.ciudad || "",
    entidad_cuit: parte.cuit || "",
    entidad_representante: parte.representanteNombre || "",
    entidad_dni: parte.representanteDni || "",
    entidad_cargo: parte.cargoRepresentante || "",
    dia: datosBasicos.dia || "",
    mes: datosBasicos.mes || "",
    partes: convenioData.partes || [],
  };
}
