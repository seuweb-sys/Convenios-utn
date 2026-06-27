"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import {
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  PaperclipIcon,
  PlusIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Modal } from "@/app/components/ui/modal";
import { SuccessModal } from "@/app/components/ui/success-modal";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { uploadFileToDriveInChunks } from "@/app/lib/client-drive-upload";
import {
  dniSchema,
  normalizeOptionalCuit,
  optionalCuitSchema,
} from "@/app/lib/forms/identity-validation";
import {
  isConvenioPrevioEmpty,
  normalizeConvenioPrevioItem,
  normalizeConveniosPreviosForSubmit,
  type ConvenioPrevioFormValue,
} from "./adenda-utils";
import { buildAdendaSubmissionSnapshot } from "./adenda-submit";

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

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

const acordanItemSchema = z.object({
  ordinal: z.string().min(1),
  texto: z.string().min(5, "Debe completar el texto del acuerdo"),
});

const convenioPrevioSchema = z.object({
  tipo: z.string().min(2, "El tipo de convenio previo es requerido"),
  fecha: z.string().min(1, "La fecha del convenio previo es requerida"),
  objeto: z.string().min(5, "El objeto del convenio previo es requerido"),
});

const adendaSchema = z.object({
  ciudad: z.string().min(2, "La ciudad es requerida"),
  provincia: z.string().min(2, "La provincia es requerida"),
  dia: z.string().min(1, "El día es requerido").regex(/^\d+$/, "Solo números"),
  mes: z.string().min(1, "El mes es requerido"),
  anio: z.string().min(4, "El año es requerido").regex(/^\d{4}$/, "Debe tener 4 dígitos"),
  entidad_nombre: z.string().min(2, "El nombre es requerido"),
  entidad_tipo: z.string(),
  entidad_domicilio: z.string().min(5, "El domicilio es requerido"),
  entidad_ciudad: z.string().min(2, "La ciudad es requerida"),
  entidad_provincia: z.string().min(2, "La provincia es requerida"),
  entidad_cuit: optionalCuitSchema,
  entidad_representante: z.string().min(2, "El representante es requerido"),
  entidad_dni: dniSchema,
  entidad_cargo: z.string().min(2, "El cargo es requerido"),
  convenios_previos: z.array(z.object({
    tipo: z.string(),
    fecha: z.string(),
    objeto: z.string(),
  })).min(1, "Debe agregar al menos un convenio firmado")
    .superRefine((items, ctx) => {
      items.forEach((rawItem, index) => {
        const item = normalizeConvenioPrevioItem(rawItem);
        const isFirstRow = index === 0;
        const isEmpty = isConvenioPrevioEmpty(item);
        const shouldValidate = isFirstRow || !isEmpty;

        if (!shouldValidate) return;

        if (item.tipo.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El tipo de convenio previo es requerido",
            path: [index, "tipo"],
          });
        }

        if (item.fecha.length < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha del convenio previo es requerida",
            path: [index, "fecha"],
          });
        }

        if (item.objeto.length < 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El objeto del convenio previo es requerido",
            path: [index, "objeto"],
          });
        }
      });
    }),
  exponen_adicional: z.string(),
  acuerdan: z.array(acordanItemSchema).min(1, "Debe agregar al menos un acuerdo"),
});

type AdendaFormValues = z.infer<typeof adendaSchema>;
type AnexoUploadStatus = "pending" | "uploading" | "uploaded" | "error";

type AnexoFile = {
  id: string;
  name: string;
  file?: File;
  mimeType?: string;
  progress: number;
  uploadStatus: AnexoUploadStatus;
  driveFileId?: string;
  webViewLink?: string;
  webContentLink?: string;
  uploadError?: string;
  size?: number;
};

interface AdendaFormProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onError: (error: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  onFinalSubmit: (snapshot?: Record<string, any>) => Promise<void>;
}

function getOrdinal(index: number) {
  return ORDINALES[index] ?? `${index + 1}°`;
}

function getConveniosPrevios(convenioData: Record<string, any>) {
  if (Array.isArray(convenioData?.convenios_previos) && convenioData.convenios_previos.length > 0) {
    return convenioData.convenios_previos.map((item: any) => normalizeConvenioPrevioItem(item));
  }

  if (
    convenioData?.convenio_previo_tipo ||
    convenioData?.convenio_previo_fecha ||
    convenioData?.convenio_previo_objeto
  ) {
    return [normalizeConvenioPrevioItem({
      tipo: convenioData?.convenio_previo_tipo,
      fecha: convenioData?.convenio_previo_fecha,
      objeto: convenioData?.convenio_previo_objeto,
    })];
  }

  return [{ tipo: "", fecha: "", objeto: "" }];
}

function buildInitialAnexos(convenioData: Record<string, any>): AnexoFile[] {
  const rawAnexos = Array.isArray(convenioData?.anexosMarco)
    ? convenioData.anexosMarco
    : Array.isArray(convenioData?.anexos)
      ? convenioData.anexos
      : [];

  return rawAnexos.map((anexo: any, index: number) => ({
    id: anexo?.id || anexo?.driveFileId || anexo?.name || `anexo-${index}`,
    name: anexo?.name || `Anexo ${index + 1}`,
    file: anexo?.file,
    mimeType: anexo?.mimeType,
    progress: anexo?.driveFileId ? 100 : 0,
    uploadStatus: anexo?.driveFileId ? "uploaded" : "pending",
    driveFileId: anexo?.driveFileId,
    webViewLink: anexo?.webViewLink,
    webContentLink: anexo?.webContentLink,
    uploadError: anexo?.uploadError,
    size: anexo?.size || anexo?.file?.size,
  }));
}

function buildDefaultValues(convenioData: Record<string, any>): AdendaFormValues {
  const acuerdan = Array.isArray(convenioData?.acuerdan) && convenioData.acuerdan.length > 0
    ? convenioData.acuerdan.map((item: any, index: number) => ({
        ordinal: getOrdinal(index),
        texto: item?.texto || "",
      }))
    : [{ ordinal: getOrdinal(0), texto: "" }];

  return {
    ciudad: convenioData?.ciudad || "",
    provincia: convenioData?.provincia || "",
    dia: convenioData?.dia || "",
    mes: convenioData?.mes || "",
    anio: convenioData?.anio || new Date().getFullYear().toString(),
    entidad_nombre: convenioData?.entidad_nombre || "",
    entidad_tipo: convenioData?.entidad_tipo || "",
    entidad_domicilio: convenioData?.entidad_domicilio || "",
    entidad_ciudad: convenioData?.entidad_ciudad || "",
    entidad_provincia: convenioData?.entidad_provincia || "",
    entidad_cuit: convenioData?.entidad_cuit || "",
    entidad_representante: convenioData?.entidad_representante || "",
    entidad_dni: convenioData?.entidad_dni || "",
    entidad_cargo: convenioData?.entidad_cargo || "",
    convenios_previos: getConveniosPrevios(convenioData),
    exponen_adicional: convenioData?.exponen_adicional || "",
    acuerdan,
  };
}

export default function AdendaForm({
  currentStep,
  onStepChange,
  onError,
  isSubmitting,
  setIsSubmitting,
  onFinalSubmit,
}: AdendaFormProps) {
  const router = useRouter();
  const { convenioData, updateConvenioData } = useConvenioMarcoStore();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [anexoFiles, setAnexoFiles] = useState<AnexoFile[]>(() => buildInitialAnexos(convenioData as Record<string, any>));

  const form = useForm<AdendaFormValues>({
    resolver: zodResolver(adendaSchema),
    defaultValues: buildDefaultValues(convenioData as Record<string, any>),
    mode: "onChange",
  });

  const {
    fields: acuerdoFields,
    append: appendAcuerdo,
    remove: removeAcuerdo,
    replace: replaceAcuerdos,
  } = useFieldArray({
    control: form.control,
    name: "acuerdan",
  });

  const {
    fields: convenioPrevioFields,
    append: appendConvenioPrevio,
    remove: removeConvenioPrevio,
  } = useFieldArray({
    control: form.control,
    name: "convenios_previos",
  });

  useEffect(() => {
    form.reset(buildDefaultValues(convenioData as Record<string, any>));
  }, [convenioData, form]);

  useEffect(() => {
    const nextAnexos = buildInitialAnexos(convenioData as Record<string, any>);
    setAnexoFiles((currentAnexos) => {
      if (nextAnexos.length === 0 && currentAnexos.length > 0) {
        return currentAnexos;
      }

      return nextAnexos;
    });
  }, [convenioData]);

  useEffect(() => {
    replaceAcuerdos(
      form.getValues("acuerdan").map((item, index) => ({
        ...item,
        ordinal: getOrdinal(index),
      })),
    );
  }, [acuerdoFields.length, form, replaceAcuerdos]);

  const syncToStore = (values: AdendaFormValues) => {
    const normalizedConveniosPrevios = normalizeConveniosPreviosForSubmit(values.convenios_previos);
    const normalizedValues = {
      ...values,
      entidad_cuit: normalizeOptionalCuit(values.entidad_cuit),
      convenios_previos: normalizedConveniosPrevios,
      acuerdan: values.acuerdan.map((item, index) => ({
        ordinal: getOrdinal(index),
        texto: item.texto,
      })),
    };

    Object.entries(normalizedValues).forEach(([key, value]) => {
      updateConvenioData(key, value);
    });
  };

  const updateAnexoUploadState = (anexoId: string, patch: Partial<AnexoFile>) => {
    setAnexoFiles((prev) => prev.map((anexo) => (anexo.id === anexoId ? { ...anexo, ...patch } : anexo)));
  };

  const handleAnexosUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf",
    ];

    for (const file of Array.from(files)) {
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} no es un archivo válido. Solo se aceptan .docx y .pdf`);
        continue;
      }

      setAnexoFiles((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: file.name,
          file,
          mimeType: file.type,
          progress: 0,
          uploadStatus: "pending",
          size: file.size,
        },
      ]);
    }

    event.target.value = "";
  };

  const uploadPendingAnexos = async () => {
    const uploadedAnexos: AnexoFile[] = [];

    for (const anexo of anexoFiles) {
      if (anexo.uploadStatus === "uploaded" && anexo.driveFileId) {
        uploadedAnexos.push(anexo);
        continue;
      }

      if (!anexo.file) {
        throw new Error(`No se encontró el archivo local para ${anexo.name}`);
      }

      try {
        updateAnexoUploadState(anexo.id, {
          uploadStatus: "uploading",
          progress: Math.max(anexo.progress, 1),
          uploadError: undefined,
        });

        const uploaded = await uploadFileToDriveInChunks({
          file: anexo.file,
          sessionEndpoint: "/api/uploads/drive/resumable-session",
          onProgress: ({ progress }) => updateAnexoUploadState(anexo.id, { progress }),
        });

        const uploadedAnexo: AnexoFile = {
          ...anexo,
          uploadStatus: "uploaded",
          progress: 100,
          driveFileId: uploaded.id,
          webViewLink: uploaded.webViewLink,
          webContentLink: uploaded.webContentLink,
        };

        updateAnexoUploadState(anexo.id, uploadedAnexo);
        uploadedAnexos.push(uploadedAnexo);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error inesperado subiendo anexo";
        updateAnexoUploadState(anexo.id, { uploadStatus: "error", uploadError: message });
        throw new Error(`No se pudo subir ${anexo.name}: ${message}`);
      }
    }

    return uploadedAnexos;
  };

  const handleNext = async () => {
    let valid = false;
    const values = form.getValues();

    if (currentStep === 1) {
      valid = await form.trigger(["ciudad", "provincia", "dia", "mes", "anio"]);
    } else if (currentStep === 2) {
      valid = await form.trigger([
        "entidad_nombre",
        "entidad_tipo",
        "entidad_domicilio",
        "entidad_ciudad",
        "entidad_provincia",
        "entidad_cuit",
        "entidad_representante",
        "entidad_dni",
        "entidad_cargo",
      ]);
    } else if (currentStep === 3) {
      valid = await form.trigger(["convenios_previos", "exponen_adicional"]);
    } else if (currentStep === 4) {
      valid = await form.trigger(["acuerdan"]);
    }

    if (!valid) {
      onError("Por favor, completá los campos requeridos");
      return;
    }

    syncToStore(values);
    if (currentStep < 5) {
      onStepChange(currentStep + 1);
    }
    onError(null);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-blue-500/20 text-blue-600">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                Encabezado y fecha
              </h2>
              <p className="text-sm text-muted-foreground">
                Completá la ciudad, provincia y fecha de firma de la adenda.
              </p>
            </div>

            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad *</Label>
                  <Input id="ciudad" {...form.register("ciudad")} />
                  <p className="text-sm text-red-500">{form.formState.errors.ciudad?.message}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia *</Label>
                  <Input id="provincia" {...form.register("provincia")} />
                  <p className="text-sm text-red-500">{form.formState.errors.provincia?.message}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dia">Día *</Label>
                  <Input id="dia" {...form.register("dia")} />
                  <p className="text-sm text-red-500">{form.formState.errors.dia?.message}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mes">Mes *</Label>
                  <select id="mes" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...form.register("mes")}>
                    <option value="">Seleccionar mes</option>
                    {meses.map((mes) => <option key={mes} value={mes}>{mes}</option>)}
                  </select>
                  <p className="text-sm text-red-500">{form.formState.errors.mes?.message}</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="anio">Año *</Label>
                  <Input id="anio" {...form.register("anio")} />
                  <p className="text-sm text-red-500">{form.formState.errors.anio?.message}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-green-500/20 text-green-600">
                  <BuildingIcon className="h-5 w-5" />
                </div>
                Contraparte
              </h2>
            </div>

            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["entidad_nombre", "Nombre de la entidad *"],
                  ["entidad_tipo", "Tipo de entidad (opcional)"],
                  ["entidad_domicilio", "Domicilio *"],
                  ["entidad_ciudad", "Ciudad *"],
                  ["entidad_provincia", "Provincia *"],
                  ["entidad_cuit", "CUIT (sin guiones, opcional)"],
                  ["entidad_representante", "Representante *"],
                  ["entidad_dni", "DNI *"],
                  ["entidad_cargo", "Cargo *"],
                ].map(([name, label]) => (
                  <div key={name} className="space-y-2">
                    <Label htmlFor={name}>{label}</Label>
                    <Input id={name} {...form.register(name as keyof AdendaFormValues)} />
                    <p className="text-sm text-red-500">{String((form.formState.errors as any)[name]?.message || "")}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-orange-500/20 text-orange-600">
                  <FileTextIcon className="h-5 w-5" />
                </div>
                Convenios previos y exponen
              </h2>
            </div>

            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <Label>Convenios firmados previos *</Label>
                <Button type="button" variant="outline" onClick={() => appendConvenioPrevio({ tipo: "", fecha: "", objeto: "" })}>
                  <PlusIcon className="h-4 w-4 mr-2" /> Agregar convenio firmado
                </Button>
              </div>

              <div className="space-y-4">
                {convenioPrevioFields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="font-semibold">Convenio firmado {index + 1}</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeConvenioPrevio(index)} disabled={convenioPrevioFields.length === 1}>
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`convenios_previos.${index}.tipo`}>Tipo *</Label>
                        <Input id={`convenios_previos.${index}.tipo`} {...form.register(`convenios_previos.${index}.tipo`)} />
                        <p className="text-sm text-red-500">{form.formState.errors.convenios_previos?.[index]?.tipo?.message}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`convenios_previos.${index}.fecha`}>Fecha *</Label>
                        <Input id={`convenios_previos.${index}.fecha`} type="date" {...form.register(`convenios_previos.${index}.fecha`)} />
                        <p className="text-sm text-red-500">{form.formState.errors.convenios_previos?.[index]?.fecha?.message}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`convenios_previos.${index}.objeto`}>Objeto *</Label>
                      <Textarea id={`convenios_previos.${index}.objeto`} rows={4} {...form.register(`convenios_previos.${index}.objeto`)} />
                      <p className="text-sm text-red-500">{form.formState.errors.convenios_previos?.[index]?.objeto?.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exponen_adicional">Texto adicional de exponen</Label>
                <Textarea id="exponen_adicional" rows={5} {...form.register("exponen_adicional")} />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-purple-500/20 text-purple-600">
                  <PaperclipIcon className="h-5 w-5" />
                </div>
                Acuerdan y anexos
              </h2>
            </div>

            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <Label>Cláusulas acuerdan *</Label>
                <Button type="button" variant="outline" onClick={() => appendAcuerdo({ ordinal: getOrdinal(acuerdoFields.length), texto: "" })}>
                  <PlusIcon className="h-4 w-4 mr-2" /> Agregar cláusula
                </Button>
              </div>

              <div className="space-y-4">
                {acuerdoFields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="font-semibold">{getOrdinal(index)}</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeAcuerdo(index)} disabled={acuerdoFields.length === 1}>
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea rows={4} {...form.register(`acuerdan.${index}.texto`)} />
                    <p className="text-sm text-red-500">{form.formState.errors.acuerdan?.[index]?.texto?.message}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <Label>Documentos anexos (opcional)</Label>
                <input type="file" id="adenda-anexos-upload" accept=".docx,.pdf" multiple onChange={handleAnexosUpload} className="hidden" />
                <Button type="button" variant="outline" onClick={() => document.getElementById("adenda-anexos-upload")?.click()} className="w-full">
                  <UploadIcon className="h-4 w-4 mr-2" /> Seleccionar archivos (.docx / .pdf)
                </Button>

                {anexoFiles.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <PaperclipIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay anexos adjuntos</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {anexoFiles.map((anexo) => (
                      <div key={anexo.id} className="flex items-center justify-between rounded-md border border-blue-500/20 bg-blue-500/10 p-3">
                        <div>
                          <p className="text-sm font-medium">{anexo.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {anexo.uploadStatus === "uploaded"
                              ? "Subido a Drive"
                              : anexo.uploadStatus === "uploading"
                                ? `Subiendo ${anexo.progress}%`
                                : anexo.uploadStatus === "error"
                                  ? "Error al subir"
                                  : "Pendiente de subir"}
                          </p>
                          {anexo.uploadError && <p className="text-xs text-red-500 mt-1">{anexo.uploadError}</p>}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setAnexoFiles((prev) => prev.filter((item) => item.id !== anexo.id))}>
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 5: {
        const values = form.getValues();
        const acuerdos = values.acuerdan.map((item, index) => ({ ...item, ordinal: getOrdinal(index) }));

        return (
          <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-600">
                  <CheckIcon className="h-5 w-5" />
                </div>
                Revisión
              </h2>
            </div>

            <div className="space-y-4 text-sm">
              <div className="border border-border rounded-lg p-4 bg-card">
                <h3 className="font-semibold mb-2">Encabezado</h3>
                <p>{values.ciudad}, {values.provincia} — {values.dia} de {values.mes} de {values.anio}</p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card">
                <h3 className="font-semibold mb-2">Contraparte</h3>
                <p>{values.entidad_nombre}</p>
                {values.entidad_tipo && <p>Tipo: {values.entidad_tipo}</p>}
                <p>{values.entidad_domicilio}, {values.entidad_ciudad}, {values.entidad_provincia}</p>
                <p>Representante: {values.entidad_representante} — {values.entidad_cargo}</p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card">
                <h3 className="font-semibold mb-2">Convenios firmados previos</h3>
                <div className="space-y-3">
                  {values.convenios_previos.map((item, index) => (
                    <div key={`${item.tipo}-${index}`} className="rounded-md bg-muted/30 p-3">
                      <p><span className="font-medium">Tipo:</span> {item.tipo}</p>
                      <p><span className="font-medium">Fecha:</span> {item.fecha}</p>
                      <p><span className="font-medium">Objeto:</span> {item.objeto}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card">
                <h3 className="font-semibold mb-2">Acuerdan</h3>
                <div className="space-y-2">
                  {acuerdos.map((item) => (
                    <div key={item.ordinal}>
                      <span className="font-semibold">{item.ordinal}:</span> {item.texto}
                    </div>
                  ))}
                </div>
              </div>
              {anexoFiles.length > 0 && (
                <div className="border border-border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold mb-2">Anexos</h3>
                  <ul className="space-y-1">
                    {anexoFiles.map((anexo) => <li key={anexo.id}>{anexo.name}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {renderStepContent()}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
        {currentStep > 1 && (
          <Button type="button" variant="outline" onClick={() => onStepChange(currentStep - 1)} disabled={isSubmitting}>
            <ChevronLeftIcon className="h-4 w-4 mr-1" /> Anterior
          </Button>
        )}

        {currentStep < 5 ? (
          <Button type="button" onClick={handleNext} disabled={isSubmitting}>
            Siguiente <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button type="button" disabled={isSubmitting} onClick={() => setShowConfirmModal(true)}>
            Guardar y Enviar adenda
          </Button>
        )}
      </div>

      {showConfirmModal && (
        <Modal onClose={() => setShowConfirmModal(false)}>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Confirmar envío</h2>
            <p className="mb-6">¿Deseás enviar esta adenda? Una vez enviada pasará a revisión.</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Volver</Button>
              <Button
                variant="default"
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const valid = await form.trigger();
                    if (!valid) {
                      onError("Por favor, completá los campos requeridos");
                      return;
                    }

                    const uploadedAnexos = await uploadPendingAnexos();
                    const values = form.getValues();
                    const snapshot = buildAdendaSubmissionSnapshot({
                      convenioData: convenioData as Record<string, any>,
                      values,
                      uploadedAnexos,
                    });
                    syncToStore(values);
                    updateConvenioData("all", snapshot);
                    await onFinalSubmit(snapshot);
                    setShowConfirmModal(false);
                    setShowSuccessModal(true);
                  } catch (error) {
                    onError(error instanceof Error ? error.message : "Error inesperado enviando la adenda");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                Sí, enviar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="¡Adenda Enviada!"
        message="Tu adenda fue enviada exitosamente y quedó lista para revisión administrativa."
        redirectText="Volver al Inicio"
        autoRedirectSeconds={5}
        onRedirect={() => {
          setShowSuccessModal(false);
          router.push("/protected");
        }}
      />
    </div>
  );
}
