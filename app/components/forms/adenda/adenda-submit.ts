import { normalizeOptionalCuit } from "@/app/lib/forms/identity-validation";

import { normalizeConveniosPreviosForSubmit } from "./adenda-utils";

type AdendaAcuerdoInput = {
  ordinal?: string;
  texto: string;
};

type AdendaConvenioPrevioInput = {
  tipo: string;
  fecha: string;
  objeto: string;
};

type AdendaSubmitValues = {
  ciudad: string;
  provincia: string;
  dia: string;
  mes: string;
  anio: string;
  entidad_nombre: string;
  entidad_tipo: string;
  entidad_domicilio: string;
  entidad_ciudad: string;
  entidad_provincia: string;
  entidad_cuit: string;
  entidad_representante: string;
  entidad_dni: string;
  entidad_cargo: string;
  convenios_previos: AdendaConvenioPrevioInput[];
  exponen_adicional: string;
  acuerdan: AdendaAcuerdoInput[];
};

type UploadedAdendaAnexo = {
  id: string;
  name: string;
  file?: File;
  mimeType?: string;
  progress: number;
  uploadStatus: "pending" | "uploading" | "uploaded" | "error";
  driveFileId?: string;
  webViewLink?: string;
  webContentLink?: string;
  uploadError?: string;
  size?: number;
};

const ORDINALES = [
  "PRIMERA",
  "SEGUNDA",
  "TERCERA",
  "CUARTA",
  "QUINTA",
  "SEXTA",
  "SÉPTIMA",
  "OCTAVA",
  "NOVENA",
  "DÉCIMA",
  "UNDÉCIMA",
  "DUODÉCIMA",
];

function getOrdinal(index: number) {
  return ORDINALES[index] ?? `${index + 1}°`;
}

export function buildAdendaSubmissionSnapshot({
  convenioData,
  values,
  uploadedAnexos,
}: {
  convenioData: Record<string, any>;
  values: AdendaSubmitValues;
  uploadedAnexos: UploadedAdendaAnexo[];
}) {
  return {
    ...convenioData,
    convenio_type_id: 6,
    convenio_type: "adenda",
    template_slug: "nuevo-adenda",
    ...values,
    entidad_cuit: normalizeOptionalCuit(values.entidad_cuit),
    convenios_previos: normalizeConveniosPreviosForSubmit(values.convenios_previos),
    acuerdan: values.acuerdan.map((item, index) => ({
      ordinal: getOrdinal(index),
      texto: item.texto,
    })),
    anexos: uploadedAnexos,
    anexosMarco: uploadedAnexos,
  };
}
