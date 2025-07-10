"use client";

import React from "react";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BuildingIcon, UserIcon, ClipboardCheckIcon, CheckIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { SuccessModal } from "@/app/components/ui/success-modal";
import { cn } from "@/lib/utils";

// Esquemas de validación para cada paso
const empresaSchema = z.object({
  empresa_nombre: z.string().min(2, "El nombre de la empresa es requerido"),
  empresa_cuit: z.string().min(11, "CUIT debe tener 11 dígitos").regex(/^\d+$/, "Solo números"),
  empresa_representante_nombre: z.string().min(2, "Nombre del representante requerido"),
  empresa_representante_caracter: z.string().min(2, "Carácter del representante requerido"),
  empresa_direccion_calle: z.string().min(5, "Dirección requerida"),
  empresa_direccion_ciudad: z.string().min(2, "Ciudad requerida"),
  empresa_tutor_nombre: z.string().min(2, "Nombre del tutor empresarial requerido"),
});

const alumnoSchema = z.object({
  alumno_nombre: z.string().min(2, "Nombre del alumno requerido"),
  alumno_carrera: z.string().min(2, "Carrera del alumno requerida"),
  alumno_dni: z.string().min(7, "DNI debe tener al menos 7 dígitos").regex(/^\d+$/, "Solo números"),
  alumno_legajo: z.string().min(1, "Legajo del alumno requerido").regex(/^\d+$/, "Solo números"),
});

const practicaSchema = z.object({
  fecha_inicio: z.string().min(1, "Fecha de inicio requerida"),
  fecha_fin: z.string().min(1, "Fecha de fin requerida"),
  practica_duracion: z.string().min(2, "Duración de la práctica requerida"),
  practica_tematica: z.string().min(10, "Descripción de la temática requerida"),
  facultad_docente_tutor_nombre: z.string().min(2, "Nombre del docente tutor requerido"),
  fecha_firma: z.string().min(1, "Fecha de firma requerida"),
}).refine((data) => {
  if (data.fecha_inicio && data.fecha_fin) {
    return new Date(data.fecha_fin) >= new Date(data.fecha_inicio);
  }
  return true;
}, {
  message: "La fecha de fin no puede ser anterior a la fecha de inicio",
  path: ["fecha_fin"]
});

const revisionSchema = z.object({
  confirmacion: z.boolean().refine(val => val === true, "Debe confirmar para continuar"),
});

type EmpresaData = z.infer<typeof empresaSchema>;
type AlumnoData = z.infer<typeof alumnoSchema>;
type PracticaData = z.infer<typeof practicaSchema>;
type RevisionData = z.infer<typeof revisionSchema>;

interface ConvenioParticularFormProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  formState: Record<string, any>;
  onFormStateChange: (state: Record<string, any>) => void;
  onError: (error: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  convenioIdFromUrl?: string | null;
  mode?: string | null;
}

export default function ConvenioParticularForm({
  currentStep,
  onStepChange,
  formState,
  onFormStateChange,
  onError,
  isSubmitting,
  setIsSubmitting,
  convenioIdFromUrl,
  mode
}: ConvenioParticularFormProps) {
  const { convenioData, updateConvenioData } = useConvenioMarcoStore();
  const router = useRouter();
  const [showModal, setShowModal] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Configurar formularios para cada paso
  const empresaForm = useForm<EmpresaData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      empresa_nombre: convenioData.empresa_nombre || "",
      empresa_cuit: convenioData.empresa_cuit || "",
      empresa_representante_nombre: convenioData.empresa_representante_nombre || "",
      empresa_representante_caracter: convenioData.empresa_representante_caracter || "",
      empresa_direccion_calle: convenioData.empresa_direccion_calle || "",
      empresa_direccion_ciudad: convenioData.empresa_direccion_ciudad || "",
      empresa_tutor_nombre: convenioData.empresa_tutor_nombre || "",
    }
  });

  const alumnoForm = useForm<AlumnoData>({
    resolver: zodResolver(alumnoSchema),
    defaultValues: {
      alumno_nombre: convenioData.alumno_nombre || "",
      alumno_carrera: convenioData.alumno_carrera || "",
      alumno_dni: convenioData.alumno_dni || "",
      alumno_legajo: convenioData.alumno_legajo || "",
    }
  });

  const practicaForm = useForm<PracticaData>({
    resolver: zodResolver(practicaSchema),
    defaultValues: {
      fecha_inicio: convenioData.fecha_inicio || "",
      fecha_fin: convenioData.fecha_fin || "",
      practica_duracion: convenioData.practica_duracion || "",
      practica_tematica: convenioData.practica_tematica || "",
      facultad_docente_tutor_nombre: convenioData.facultad_docente_tutor_nombre || "",
      fecha_firma: convenioData.fecha_firma || "",
    }
  });

  const revisionForm = useForm<RevisionData>({
    resolver: zodResolver(revisionSchema),
    defaultValues: { confirmacion: false }
  });

  React.useEffect(() => {
    const mes = practicaForm.watch('mes');
    const dia = practicaForm.watch('dia');
    if (mes && dia) {
      const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      const mesNum = (meses.indexOf(mes) + 1).toString().padStart(2, '0');
      const fecha = `${new Date().getFullYear()}-${mesNum}-${dia.padStart(2, '0')}`;
      practicaForm.setValue('fecha_firma', fecha);
    } else {
      practicaForm.setValue('fecha_firma', '');
    }
  }, [practicaForm.watch('mes'), practicaForm.watch('dia')]);

  const handleNext = async () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = await empresaForm.trigger();
        if (isValid) {
          const data = empresaForm.getValues();
          Object.entries(data).forEach(([key, value]) => {
            updateConvenioData(key as keyof typeof convenioData, value);
          });
          onStepChange(2);
        }
        break;
      case 2:
        isValid = await alumnoForm.trigger();
        if (isValid) {
          const data = alumnoForm.getValues();
          Object.entries(data).forEach(([key, value]) => {
            updateConvenioData(key as keyof typeof convenioData, value);
          });
          onStepChange(3);
        }
        break;
      case 3:
        isValid = await practicaForm.trigger();
        if (isValid) {
          const data = practicaForm.getValues();
          Object.entries(data).forEach(([key, value]) => {
            updateConvenioData(key as keyof typeof convenioData, value);
          });
          onStepChange(4);
        }
        break;
      case 4:
        isValid = await revisionForm.trigger();
        if (isValid) {
          setShowModal(true);
          return;
        }
        break;
    }
    
    if (!isValid) {
      onError("Por favor, completa todos los campos requeridos");
    } else {
      onError(null);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const cd = convenioData as Record<string, any>;
      const fechaFirmaStr =
        cd.fecha_firma || cd.practica_fecha_firma || '';        // yyyy-mm-dd

      let dia = '';
      let mes = '';
      if (fechaFirmaStr) {
        const fechaFirma = new Date(fechaFirmaStr);
        dia = fechaFirma.getDate().toString();                  // 1 … 31
        mes = fechaFirma.toLocaleDateString('es-ES', { month: 'long' }); // junio, julio…
      }

      const dbData = {
        // Empresa
        empresa_nombre: cd.empresa_nombre || '',
        empresa_cuit: cd.empresa_cuit || '',
        empresa_representante_nombre: cd.empresa_representante_nombre || '',
        empresa_representante_caracter: cd.empresa_representante_caracter || '',
        empresa_direccion_calle: cd.empresa_direccion_calle || '',
        empresa_direccion_ciudad: cd.empresa_direccion_ciudad || '',
        empresa_tutor_nombre: cd.empresa_tutor_nombre || '',

        // Alumno
        alumno_nombre: cd.alumno_nombre || '',
        alumno_carrera: cd.alumno_carrera || '',
        alumno_dni: cd.alumno_dni || '',
        alumno_legajo: cd.alumno_legajo || '',

        // Práctica / Fechas
        practica_fecha_inicio: cd.fecha_inicio || cd.practica_fecha_inicio || '',
        practica_fecha_fin: cd.fecha_fin   || cd.practica_fecha_fin    || '',
        practica_tutor_docente: cd.facultad_docente_tutor_nombre || cd.practica_tutor_docente || '',
        practica_duracion: cd.practica_duracion || '',
        practica_tematica: cd.practica_tematica || '',
        practica_fecha_firma: cd.fecha_firma || cd.practica_fecha_firma || '',

        // Claves sin prefijo (compatibilidad templates)
        fecha_inicio: cd.fecha_inicio || cd.practica_fecha_inicio || '',
        fecha_fin:    cd.fecha_fin    || cd.practica_fecha_fin    || '',
        fecha_firma:  cd.fecha_firma  || cd.practica_fecha_firma  || '',

        // Extras que el template usa
        facultad_docente_tutor_nombre: cd.facultad_docente_tutor_nombre || '',
        dia,
        mes,
      };

      console.log('FormState debug:', formState);
      console.log('DBData debug:', dbData);

      const requestData = {
        title: `${dbData.empresa_nombre} - ${dbData.alumno_nombre}`,
        convenio_type_id: 2, // ID específico para práctica supervisada
        content_data: dbData,
        status: 'enviado'
      };

      let response, responseData;
      // Si tenemos ID desde la URL (modo corrección) o desde convenioData, usar PATCH
      if (convenioIdFromUrl || convenioData?.id) {
        const targetId = convenioIdFromUrl || convenioData.id;
        response = await fetch(`/api/convenios/${targetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });
      } else {
        // Solo crear nuevo convenio si NO hay ID disponible
        response = await fetch("/api/convenios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });
      }

      responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Error al crear el convenio');
      }
      
      setShowModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Error al crear convenio");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paso 1: Datos de la Empresa
  const renderEmpresaStep = () => (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-green-500/20 text-green-600">
            <BuildingIcon className="h-5 w-5" />
          </div>
          Datos de la Empresa
        </h2>
        <p className="text-sm text-muted-foreground">
          Información de la empresa donde se realizará la práctica supervisada.
        </p>
      </div>

      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="empresa_nombre">Nombre de la Empresa *</Label>
            <Input
              id="empresa_nombre"
              className="border-border focus-visible:ring-primary"
              placeholder="Nombre completo de la empresa"
              {...empresaForm.register("empresa_nombre")}
            />
            {empresaForm.formState.errors.empresa_nombre && (
              <p className="text-sm text-red-500">{String(empresaForm.formState.errors.empresa_nombre.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresa_cuit">CUIT (sin guiones) *</Label>
            <Input
              id="empresa_cuit"
              placeholder="xx-xxxxxxxx-x (sin puntos ni guiones)"
              {...empresaForm.register("empresa_cuit", {
                pattern: { value: /^\d+$/, message: "Solo números" }
              })}
            />
            {empresaForm.formState.errors.empresa_cuit && (
              <p className="text-sm text-red-500">{String(empresaForm.formState.errors.empresa_cuit.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresa_representante_nombre">Representante Legal *</Label>
            <Input
              id="empresa_representante_nombre"
              className="border-border focus-visible:ring-primary"
              placeholder="Nombre del representante"
              {...empresaForm.register("empresa_representante_nombre")}
            />
            {empresaForm.formState.errors.empresa_representante_nombre && (
              <p className="text-sm text-red-500">{String(empresaForm.formState.errors.empresa_representante_nombre.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresa_representante_caracter">Carácter del Representante *</Label>
            <Input
              id="empresa_representante_caracter"
              className="border-border focus-visible:ring-primary"
              placeholder="Ej: Gerente, Director"
              {...empresaForm.register("empresa_representante_caracter")}
            />
            {empresaForm.formState.errors.empresa_representante_caracter && (
              <p className="text-sm text-red-500">{String(empresaForm.formState.errors.empresa_representante_caracter.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresa_direccion_calle">Dirección *</Label>
            <Input
              id="empresa_direccion_calle"
              className="border-border focus-visible:ring-primary"
              placeholder="Calle y número"
              {...empresaForm.register("empresa_direccion_calle")}
            />
            {empresaForm.formState.errors.empresa_direccion_calle && (
              <p className="text-sm text-red-500">{String(empresaForm.formState.errors.empresa_direccion_calle.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresa_direccion_ciudad">Ciudad *</Label>
            <Input
              id="empresa_direccion_ciudad"
              className="border-border focus-visible:ring-primary"
              placeholder="Ciudad"
              {...empresaForm.register("empresa_direccion_ciudad")}
            />
            {empresaForm.formState.errors.empresa_direccion_ciudad && (
              <p className="text-sm text-red-500">{String(empresaForm.formState.errors.empresa_direccion_ciudad.message)}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="empresa_tutor_nombre">Tutor por la Empresa *</Label>
            <Input
              id="empresa_tutor_nombre"
              className="border-border focus-visible:ring-primary"
              placeholder="Nombre completo del tutor empresarial"
              {...empresaForm.register("empresa_tutor_nombre")}
            />
            {empresaForm.formState.errors.empresa_tutor_nombre && (
              <p className="text-sm text-red-500">{String(empresaForm.formState.errors.empresa_tutor_nombre.message)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Paso 2: Datos del Alumno
  const renderAlumnoStep = () => (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-green-500/20 text-green-600">
            <UserIcon className="h-5 w-5" />
          </div>
          Datos del Alumno
        </h2>
        <p className="text-sm text-muted-foreground">
          Información del alumno que realizará la práctica supervisada.
        </p>
      </div>

      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="alumno_nombre">Nombre Completo del Alumno *</Label>
            <Input
              id="alumno_nombre"
              className="border-border focus-visible:ring-primary"
              placeholder="Nombre completo"
              {...alumnoForm.register("alumno_nombre")}
            />
            {alumnoForm.formState.errors.alumno_nombre && (
              <p className="text-sm text-red-500">{String(alumnoForm.formState.errors.alumno_nombre.message)}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="alumno_carrera">Carrera del Alumno *</Label>
            <Input
              id="alumno_carrera"
              className="border-border focus-visible:ring-primary"
              placeholder="Ej: Ingeniería en Sistemas"
              {...alumnoForm.register("alumno_carrera")}
            />
            {alumnoForm.formState.errors.alumno_carrera && (
              <p className="text-sm text-red-500">{String(alumnoForm.formState.errors.alumno_carrera.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumno_dni">DNI del Alumno *</Label>
            <Input
              id="alumno_dni"
              placeholder="sin puntos"
              {...alumnoForm.register("alumno_dni", {
                pattern: { value: /^\d+$/, message: "Solo números" }
              })}
            />
            {alumnoForm.formState.errors.alumno_dni && (
              <p className="text-sm text-red-500">{String(alumnoForm.formState.errors.alumno_dni.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumno_legajo">Legajo del Alumno *</Label>
            <Input
              id="alumno_legajo"
              className="border-border focus-visible:ring-primary"
              placeholder="Número de legajo"
              {...alumnoForm.register("alumno_legajo")}
            />
            {alumnoForm.formState.errors.alumno_legajo && (
              <p className="text-sm text-red-500">{String(alumnoForm.formState.errors.alumno_legajo.message)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Paso 3: Detalles de la Práctica
  const renderPracticaStep = () => (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-green-500/20 text-green-600">
            <ClipboardCheckIcon className="h-5 w-5" />
          </div>
          Detalles de la Práctica
        </h2>
        <p className="text-sm text-muted-foreground">
          Información específica sobre la práctica supervisada a realizar.
        </p>
      </div>

      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
            <Input
              id="fecha_inicio"
              type="date"
              className="border-border focus-visible:ring-primary"
              {...practicaForm.register("fecha_inicio")}
            />
            {practicaForm.formState.errors.fecha_inicio && (
              <p className="text-sm text-red-500">{String(practicaForm.formState.errors.fecha_inicio.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_fin">Fecha de Fin *</Label>
            <Input
              id="fecha_fin"
              type="date"
              className="border-border focus-visible:ring-primary"
              {...practicaForm.register("fecha_fin")}
            />
            {practicaForm.formState.errors.fecha_fin && (
              <p className="text-sm text-red-500">{String(practicaForm.formState.errors.fecha_fin.message)}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="facultad_docente_tutor_nombre">Docente Tutor por la Facultad *</Label>
            <Input
              id="facultad_docente_tutor_nombre"
              className="border-border focus-visible:ring-primary"
              placeholder="Nombre completo del docente tutor"
              {...practicaForm.register("facultad_docente_tutor_nombre")}
            />
            {practicaForm.formState.errors.facultad_docente_tutor_nombre && (
              <p className="text-sm text-red-500">{String(practicaForm.formState.errors.facultad_docente_tutor_nombre.message)}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="practica_duracion">Duración de la práctica *</Label>
            <Input
              id="practica_duracion"
              className="border-border focus-visible:ring-primary"
              placeholder="Ej.: 4 meses"
              {...practicaForm.register("practica_duracion")}
            />
            {practicaForm.formState.errors.practica_duracion && (
              <p className="text-sm text-red-500">{String(practicaForm.formState.errors.practica_duracion.message)}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="practica_tematica">Temática de Desarrollo *</Label>
            <Textarea
              id="practica_tematica"
              className="border-border focus-visible:ring-primary min-h-[100px]"
              placeholder="Describe la temática y actividades que desarrollará el alumno durante la práctica"
              {...practicaForm.register("practica_tematica")}
            />
            {practicaForm.formState.errors.practica_tematica && (
              <p className="text-sm text-red-500">{String(practicaForm.formState.errors.practica_tematica.message)}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fecha_firma">Fecha de Firma del Convenio *</Label>
            <select
              id="mes"
              className="border border-border focus-visible:ring-2 focus-visible:ring-primary rounded-md w-full h-10 px-3 bg-card"
              {...practicaForm.register("mes", { required: true })}
              onChange={e => {
                practicaForm.setValue("mes", e.target.value);
                practicaForm.setValue("dia", "");
              }}
              value={practicaForm.watch("mes") || ""}
            >
              <option value="">Seleccionar mes</option>
              {meses.map((mes, idx) => (
                <option key={mes} value={mes}>{mes}</option>
              ))}
            </select>
            <select
              id="dia"
              className="border border-border focus-visible:ring-2 focus-visible:ring-primary rounded-md w-full h-10 px-3 bg-card"
              {...practicaForm.register("dia", { required: true })}
              onChange={e => {
                practicaForm.setValue("dia", e.target.value);
              }}
              value={practicaForm.watch("dia") || ""}
            >
              <option value="">Seleccionar día</option>
              {(() => {
                const mesIdx = meses.indexOf(practicaForm.watch("mes"));
                const dias = mesIdx >= 0 ? diasPorMes[mesIdx] : 31;
                return Array.from({ length: dias }, (_, i) => i + 1).map(dia => (
                  <option key={dia} value={dia}>{dia}</option>
                ));
              })()}
            </select>
            {practicaForm.formState.errors.fecha_firma && (
              <p className="text-sm text-red-500">{String(practicaForm.formState.errors.fecha_firma.message)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Paso 4: Revisión
  const renderRevisionStep = () => (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-green-500/20 text-green-600">
            <CheckIcon className="h-5 w-5" />
          </div>
          Revisión y Finalización
        </h2>
        <p className="text-sm text-muted-foreground">
          Revisa toda la información antes de crear el convenio.
        </p>
      </div>

      <div className="space-y-6">
        {/* Datos de la Empresa */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-green-500/10 to-green-600/10 rounded-xl blur-xl"></div>
          <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-orange-600 mb-4 flex items-center gap-2">
              <BuildingIcon className="h-5 w-5" />
              Datos de la Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Empresa:</span> {convenioData.empresa_nombre}</div>
              <div><span className="font-medium">CUIT:</span> {convenioData.empresa_cuit}</div>
              <div><span className="font-medium">Representante:</span> {convenioData.empresa_representante_nombre}</div>
              <div><span className="font-medium">Carácter:</span> {convenioData.empresa_representante_caracter}</div>
              <div><span className="font-medium">Dirección:</span> {convenioData.empresa_direccion_calle}</div>
              <div><span className="font-medium">Ciudad:</span> {convenioData.empresa_direccion_ciudad}</div>
              <div className="md:col-span-2"><span className="font-medium">Tutor Empresarial:</span> {convenioData.empresa_tutor_nombre}</div>
            </div>
          </div>
        </div>

        {/* Datos del Alumno */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-green-500/10 to-green-600/10 rounded-xl blur-xl"></div>
          <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-teal-600 mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Datos del Alumno
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Nombre:</span> {convenioData.alumno_nombre}</div>
              <div><span className="font-medium">Carrera:</span> {convenioData.alumno_carrera}</div>
              <div><span className="font-medium">DNI:</span> {convenioData.alumno_dni}</div>
              <div><span className="font-medium">Legajo:</span> {convenioData.alumno_legajo}</div>
            </div>
          </div>
        </div>

        {/* Detalles de la Práctica */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-green-500/10 to-green-600/10 rounded-xl blur-xl"></div>
          <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-4 flex items-center gap-2">
              <ClipboardCheckIcon className="h-5 w-5" />
              Detalles de la Práctica
            </h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><span className="font-medium">Fecha Inicio:</span> {convenioData.fecha_inicio}</div>
                <div><span className="font-medium">Fecha Fin:</span> {convenioData.fecha_fin}</div>
                <div><span className="font-medium">Docente Tutor:</span> {convenioData.facultad_docente_tutor_nombre}</div>
                <div><span className="font-medium">Fecha Firma:</span> {convenioData.fecha_firma}</div>
                <div className="md:col-span-2"><span className="font-medium">Duración:</span> {convenioData.practica_duracion}</div>
              </div>
              <div><span className="font-medium">Temática:</span> {convenioData.practica_tematica}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="confirmacion"
            className="rounded border-border"
            {...revisionForm.register("confirmacion")}
          />
          <Label htmlFor="confirmacion" className="text-sm">
            Confirmo que toda la información es correcta y deseo crear el convenio
          </Label>
        </div>
        {revisionForm.formState.errors.confirmacion && (
          <p className="text-sm text-red-500">{String(revisionForm.formState.errors.confirmacion.message)}</p>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderEmpresaStep();
      case 2: return renderAlumnoStep();
      case 3: return renderPracticaStep();
      case 4: return renderRevisionStep();
      default: return renderEmpresaStep();
    }
  };

  return (
    <>
      <div className="p-6 space-y-8">
        {renderCurrentStep()}
        
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-6"
          >
            Anterior
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className={cn(
              "px-6",
              currentStep === 4 ? "bg-background text-foreground border border-border hover:bg-accent hover:text-accent-foreground" : ""
            )}
          >
            {currentStep === 4 ? "Finalizar" : "Siguiente"}
          </Button>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-border max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirmar creación</h3>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Estás seguro de que querés crear este Convenio Particular de Práctica Supervisada?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                Enviar convenio
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="¡Convenio Particular Enviado!"
        message="Tu convenio particular de práctica supervisada ha sido enviado exitosamente y está en espera de revisión por parte del equipo administrativo."
        redirectText="Volver al Inicio"
        autoRedirectSeconds={5}
        onRedirect={() => {
          setShowSuccessModal(false);
          router.push('/protected');
        }}
      />
    </>
  );
} 