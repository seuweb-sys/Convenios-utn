export type PPSAttachmentRef = {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  file?: File;
  driveFileId?: string;
  webViewLink?: string;
  webContentLink?: string;
  uploadStatus: "pending" | "uploading" | "uploaded" | "error";
  uploadError?: string;
  progress?: number;
  existing?: boolean;
};

export const PPS_ATTACHMENT_ACCEPT = ".pdf,.doc,.docx";

const PPS_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function createAttachmentId(seed: string, index: number) {
  return `${seed}-${index}`;
}

export function isValidPpsAttachment(file: File) {
  return PPS_ALLOWED_MIME_TYPES.has(file.type);
}

export function createPpsAttachmentDrafts(files: FileList | File[]) {
  return Array.from(files).map((file, index) => ({
    id: createAttachmentId(`${file.name}-${file.size}`, index),
    name: file.name,
    file,
    size: file.size,
    mimeType: file.type,
    progress: 0,
    uploadStatus: "pending" as const,
    existing: false,
  }));
}

export function hydratePpsAttachmentRefs(savedRefs: Array<Record<string, any>> | undefined | null): PPSAttachmentRef[] {
  if (!Array.isArray(savedRefs)) return [];

  return savedRefs
    .filter((ref) => ref && typeof ref.name === "string" && typeof ref.driveFileId === "string")
    .map((ref, index) => ({
      id: createAttachmentId(ref.driveFileId || ref.name, index),
      name: ref.name,
      size: ref.size,
      mimeType: ref.mimeType || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      driveFileId: ref.driveFileId,
      webViewLink: ref.webViewLink,
      webContentLink: ref.webContentLink,
      uploadStatus: "uploaded",
      progress: 100,
      existing: true,
    }));
}

export function toPpsAttachmentPayload(attachmentRefs: PPSAttachmentRef[]) {
  return attachmentRefs
    .filter((attachment) => typeof attachment.driveFileId === "string")
    .map((attachment) => ({
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      driveFileId: attachment.driveFileId,
      webViewLink: attachment.webViewLink,
      webContentLink: attachment.webContentLink,
    }));
}

function getDiaMes(fechaFirmaStr: string | undefined) {
  if (!fechaFirmaStr) {
    return { dia: "", mes: "" };
  }

  const fechaFirma = new Date(fechaFirmaStr);
  return {
    dia: fechaFirma.getDate().toString(),
    mes: fechaFirma.toLocaleDateString("es-ES", { month: "long" }),
  };
}

export function buildPpsSubmissionRequest({
  convenioData,
  secretariatId,
  careerId,
  orgUnitId,
  agreementYear,
  attachmentRefs,
}: {
  convenioData: Record<string, any>;
  secretariatId: string;
  careerId?: string | null;
  orgUnitId?: string | null;
  agreementYear: number;
  attachmentRefs: PPSAttachmentRef[];
}) {
  const { dia, mes } = getDiaMes(convenioData.fecha_firma || convenioData.practica_fecha_firma || "");
  const anexos = toPpsAttachmentPayload(attachmentRefs);

  const contentData = {
    empresa_nombre: convenioData.empresa_nombre || "",
    empresa_cuit: convenioData.empresa_cuit || "",
    empresa_representante_nombre: convenioData.empresa_representante_nombre || "",
    empresa_representante_caracter: convenioData.empresa_representante_caracter || "",
    empresa_direccion_calle: convenioData.empresa_direccion_calle || "",
    empresa_direccion_ciudad: convenioData.empresa_direccion_ciudad || "",
    empresa_tutor_nombre: convenioData.empresa_tutor_nombre || "",
    alumno_nombre: convenioData.alumno_nombre || "",
    alumno_carrera: convenioData.alumno_carrera || "",
    alumno_dni: convenioData.alumno_dni || "",
    alumno_legajo: convenioData.alumno_legajo || "",
    practica_fecha_inicio: convenioData.fecha_inicio || convenioData.practica_fecha_inicio || "",
    practica_fecha_fin: convenioData.fecha_fin || convenioData.practica_fecha_fin || "",
    practica_tutor_docente: convenioData.facultad_docente_tutor_nombre || convenioData.practica_tutor_docente || "",
    practica_duracion: convenioData.practica_duracion || "",
    practica_tematica: convenioData.practica_tematica || "",
    practica_fecha_firma: convenioData.fecha_firma || convenioData.practica_fecha_firma || "",
    fecha_inicio: convenioData.fecha_inicio || convenioData.practica_fecha_inicio || "",
    fecha_fin: convenioData.fecha_fin || convenioData.practica_fecha_fin || "",
    fecha_firma: convenioData.fecha_firma || convenioData.practica_fecha_firma || "",
    facultad_docente_tutor_nombre: convenioData.facultad_docente_tutor_nombre || "",
    dia,
    mes,
    anexos,
  };

  return {
    title: `${contentData.empresa_nombre} - ${contentData.alumno_nombre}`,
    convenio_type_id: 1,
    convenio_type: "particular",
    template_slug: "nuevo-convenio-particular-de-practica-supervisada",
    content_data: contentData,
    anexos,
    secretariat_id: secretariatId,
    career_id: careerId || null,
    org_unit_id: orgUnitId || null,
    agreement_year: agreementYear,
    status: "enviado",
  };
}
