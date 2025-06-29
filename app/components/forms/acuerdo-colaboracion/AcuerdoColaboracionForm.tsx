"use client";

import React from "react";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BuildingIcon, UserIcon, CalendarIcon, CheckIcon, ClipboardCheckIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { cn } from "@/lib/utils";

// Esquemas de validación para cada paso
const entidadSchema = z.object({
  entidad_nombre: z.string().min(2, "El nombre de la entidad es requerido"),
  entidad_cuit: z.string().min(11, "CUIT debe tener 11 dígitos").regex(/^\d+$/, "Solo números"),
  entidad_domicilio: z.string().min(5, "Domicilio requerido"),
  entidad_ciudad: z.string().min(2, "Ciudad requerida"),
});

const representanteSchema = z.object({
  entidad_representante: z.string().min(2, "Nombre del representante requerido"),
  entidad_dni: z.string().min(7, "DNI debe tener al menos 7 dígitos").regex(/^\d+$/, "Solo números"),
  entidad_cargo: z.string().min(2, "Cargo del representante requerido"),
});

const firmaSchema = z.object({
  dia: z.string().min(1, "Día de firma requerido").regex(/^\d+$/, "Solo números"),
  mes: z.string().min(2, "Mes de firma requerido"),
});

const proyectoSchema = z.object({
  unidad_ejecutora_facultad: z.string().min(2, "Dato requerido"),
  unidad_ejecutora_empresa: z.string().min(2, "Dato requerido"),
  asignatura: z.string().min(2, "Dato requerido"),
  carrera: z.string().min(2, "Dato requerido"),
  objetivo_general: z.string().min(5, "Dato requerido"),
  vigencia_anios: z.string().regex(/^\d+$/, "Solo números"),
  extincion_dias: z.string().regex(/^\d+$/, "Solo números"),
});

const revisionSchema = z.object({
  confirmacion: z.boolean().refine(val => val === true, "Debe confirmar para continuar"),
});

type EntidadData = z.infer<typeof entidadSchema>;
type RepresentanteData = z.infer<typeof representanteSchema>;
type FirmaData = z.infer<typeof firmaSchema>;
type ProyectoData = z.infer<typeof proyectoSchema>;
type RevisionData = z.infer<typeof revisionSchema>;

interface AcuerdoColaboracionFormProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  formState: Record<string, any>;
  onFormStateChange: (formState: Record<string, any>) => void;
  onError: (error: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
}

export default function AcuerdoColaboracionForm({
  currentStep,
  onStepChange,
  formState,
  onFormStateChange,
  onError,
  isSubmitting,
  setIsSubmitting
}: AcuerdoColaboracionFormProps) {
  const { convenioData, updateConvenioData } = useConvenioMarcoStore();
  const router = useRouter();
  const [showModal, setShowModal] = React.useState(false);

  // Configurar formularios para cada paso
  const entidadForm = useForm<EntidadData>({
    resolver: zodResolver(entidadSchema),
    defaultValues: {
      entidad_nombre: convenioData.entidad_nombre || "",
      entidad_cuit: convenioData.entidad_cuit || "",
      entidad_domicilio: convenioData.entidad_domicilio || "",
      entidad_ciudad: convenioData.entidad_ciudad || "",
    }
  });

  const representanteForm = useForm<RepresentanteData>({
    resolver: zodResolver(representanteSchema),
    defaultValues: {
      entidad_representante: convenioData.entidad_representante || "",
      entidad_dni: convenioData.entidad_dni || "",
      entidad_cargo: convenioData.entidad_cargo || "",
    }
  });

  const firmaForm = useForm<FirmaData>({
    resolver: zodResolver(firmaSchema),
    defaultValues: {
      dia: convenioData.dia || "",
      mes: convenioData.mes || "",
    }
  });

  const proyectoForm = useForm<ProyectoData>({
    resolver: zodResolver(proyectoSchema),
    defaultValues: {
      unidad_ejecutora_facultad: (convenioData as any).unidad_ejecutora_facultad || "",
      unidad_ejecutora_empresa: (convenioData as any).unidad_ejecutora_empresa || "",
      asignatura: (convenioData as any).asignatura || "",
      carrera: (convenioData as any).carrera || "",
      objetivo_general: (convenioData as any).objetivo_general || "",
      vigencia_anios: (convenioData as any).vigencia_anios || "",
      extincion_dias: (convenioData as any).extincion_dias || "",
    }
  });

  const revisionForm = useForm<RevisionData>({
    resolver: zodResolver(revisionSchema),
    defaultValues: { confirmacion: false }
  });

  const handleNext = async () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = await entidadForm.trigger();
        if (isValid) {
          const data = entidadForm.getValues();
          Object.entries(data).forEach(([key, value]) => {
            updateConvenioData(key as keyof typeof convenioData, value);
          });
          onStepChange(2);
        }
        break;
      case 2:
        isValid = await representanteForm.trigger();
        if (isValid) {
          const data = representanteForm.getValues();
          Object.entries(data).forEach(([key, value]) => {
            updateConvenioData(key as keyof typeof convenioData, value);
          });
          onStepChange(3);
        }
        break;
      case 3:
        isValid = await proyectoForm.trigger();
        if (isValid) {
          const data = proyectoForm.getValues();
          Object.entries(data).forEach(([key, value]) => {
            updateConvenioData(key as keyof typeof convenioData, value);
          });
          onStepChange(4);
        }
        break;
      case 4:
        isValid = await firmaForm.trigger();
        if (isValid) {
          const data = firmaForm.getValues();
          Object.entries(data).forEach(([key, value]) => {
            updateConvenioData(key as keyof typeof convenioData, value);
          });
          setShowModal(true);
          return;
        }
        break;
      case 5:
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
      
      // Preparar datos según el formato CreateConvenioDTO
      const requestData = {
        title: convenioData.entidad_nombre,
        convenio_type_id: 3, // ID para Acuerdo de Colaboración
        content_data: {
          entidad_nombre: convenioData.entidad_nombre,
          entidad_domicilio: convenioData.entidad_domicilio,
          entidad_ciudad: convenioData.entidad_ciudad,
          entidad_cuit: convenioData.entidad_cuit,
          entidad_representante: convenioData.entidad_representante,
          entidad_dni: convenioData.entidad_dni,
          entidad_cargo: convenioData.entidad_cargo,
          dia: convenioData.dia,
          mes: convenioData.mes,
          unidad_ejecutora_facultad: (convenioData as any).unidad_ejecutora_facultad,
          unidad_ejecutora_empresa: (convenioData as any).unidad_ejecutora_empresa,
          asignatura: (convenioData as any).asignatura,
          carrera: (convenioData as any).carrera,
          objetivo_general: (convenioData as any).objetivo_general,
          vigencia_anios: (convenioData as any).vigencia_anios,
          extincion_dias: (convenioData as any).extincion_dias,
          anio: new Date().getFullYear()
        }
      };

      const response = await fetch("/api/convenios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        setShowModal(false);
        router.push("/protected");
      } else {
        const errorData = await response.text();
        console.error("Error response:", errorData);
        onError("Error al crear acuerdo");
      }
    } catch (error) {
      onError("Error al crear acuerdo");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paso 1: Datos de la Entidad
  const renderEntidadStep = () => (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-green-500/20 text-green-600">
            <BuildingIcon className="h-5 w-5" />
          </div>
          Datos de la Entidad
        </h2>
        <p className="text-sm text-muted-foreground">
          Información de la entidad que realizará la colaboración.
        </p>
      </div>

      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entidad_nombre">Nombre de la Entidad *</Label>
            <Input
              id="entidad_nombre"
              className="border-border focus-visible:ring-primary"
              placeholder="Nombre completo de la entidad"
              {...entidadForm.register("entidad_nombre")}
            />
            {entidadForm.formState.errors.entidad_nombre && (
              <p className="text-sm text-red-500">{entidadForm.formState.errors.entidad_nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="entidad_cuit">CUIT (sin guiones) *</Label>
            <Input
              id="entidad_cuit"
              className="border-border focus-visible:ring-primary"
              placeholder="20445041743"
              {...entidadForm.register("entidad_cuit")}
            />
            {entidadForm.formState.errors.entidad_cuit && (
              <p className="text-sm text-red-500">{entidadForm.formState.errors.entidad_cuit.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="entidad_domicilio">Domicilio *</Label>
            <Input
              id="entidad_domicilio"
              className="border-border focus-visible:ring-primary"
              placeholder="Domicilio de la entidad"
              {...entidadForm.register("entidad_domicilio")}
            />
            {entidadForm.formState.errors.entidad_domicilio && (
              <p className="text-sm text-red-500">{entidadForm.formState.errors.entidad_domicilio.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="entidad_ciudad">Ciudad *</Label>
            <Input
              id="entidad_ciudad"
              className="border-border focus-visible:ring-primary"
              placeholder="Ciudad"
              {...entidadForm.register("entidad_ciudad")}
            />
            {entidadForm.formState.errors.entidad_ciudad && (
              <p className="text-sm text-red-500">{entidadForm.formState.errors.entidad_ciudad.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Paso 2: Datos del Representante
  const renderRepresentanteStep = () => (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-green-500/20 text-green-600">
            <UserIcon className="h-5 w-5" />
          </div>
          Datos del Representante
        </h2>
        <p className="text-sm text-muted-foreground">
          Información del representante de la entidad.
        </p>
      </div>

      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entidad_representante">Nombre del Representante *</Label>
            <Input
              id="entidad_representante"
              className="border-border focus-visible:ring-primary"
              placeholder="Nombre completo del representante"
              {...representanteForm.register("entidad_representante")}
            />
            {representanteForm.formState.errors.entidad_representante && (
              <p className="text-sm text-red-500">{representanteForm.formState.errors.entidad_representante.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="entidad_dni">DNI del Representante *</Label>
            <Input
              id="entidad_dni"
              className="border-border focus-visible:ring-primary"
              placeholder="Sin puntos ni guiones"
              {...representanteForm.register("entidad_dni")}
            />
            {representanteForm.formState.errors.entidad_dni && (
              <p className="text-sm text-red-500">{representanteForm.formState.errors.entidad_dni.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="entidad_cargo">Cargo del Representante *</Label>
            <Input
              id="entidad_cargo"
              className="border-border focus-visible:ring-primary"
              placeholder="Ej: Gerente, Director"
              {...representanteForm.register("entidad_cargo")}
            />
            {representanteForm.formState.errors.entidad_cargo && (
              <p className="text-sm text-red-500">{representanteForm.formState.errors.entidad_cargo.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Paso 3: Proyecto / Detalles adicionales
  const renderProyectoStep = () => (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-green-500/20 text-green-600">
            <ClipboardCheckIcon className="h-5 w-5" />
          </div>
          Información del Proyecto
        </h2>
        <p className="text-sm text-muted-foreground">Completa los detalles académicos y parámetros del acuerdo.</p>
      </div>
      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unidad_ejecutora_facultad">Unidad Ejecutora (Facultad) *</Label>
            <Input id="unidad_ejecutora_facultad" className="border-border focus-visible:ring-primary" {...proyectoForm.register("unidad_ejecutora_facultad")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unidad_ejecutora_empresa">Unidad Ejecutora (Entidad) *</Label>
            <Input id="unidad_ejecutora_empresa" className="border-border focus-visible:ring-primary" {...proyectoForm.register("unidad_ejecutora_empresa")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asignatura">Asignatura *</Label>
            <Input id="asignatura" className="border-border focus-visible:ring-primary" {...proyectoForm.register("asignatura")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carrera">Carrera *</Label>
            <Input id="carrera" className="border-border focus-visible:ring-primary" {...proyectoForm.register("carrera")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="objetivo_general">Objetivo General *</Label>
            <Textarea id="objetivo_general" className="border-border focus-visible:ring-primary" {...proyectoForm.register("objetivo_general")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vigencia_anios">Años de Vigencia *</Label>
            <Input id="vigencia_anios" className="border-border focus-visible:ring-primary" {...proyectoForm.register("vigencia_anios")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="extincion_dias">Días de Extinción *</Label>
            <Input id="extincion_dias" className="border-border focus-visible:ring-primary" {...proyectoForm.register("extincion_dias")} />
          </div>
        </div>
      </div>
    </div>
  );

  // Paso 4: Datos de la Firma
  const renderFirmaStep = () => (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-green-500/20 text-green-600">
            <CalendarIcon className="h-5 w-5" />
          </div>
          Datos de la Firma
        </h2>
        <p className="text-sm text-muted-foreground">
          Información para la firma del acuerdo.
        </p>
      </div>

      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dia">Día de Firma *</Label>
            <Input
              id="dia"
              className="border-border focus-visible:ring-primary"
              placeholder="Ej: 15"
              {...firmaForm.register("dia")}
            />
            {firmaForm.formState.errors.dia && (
              <p className="text-sm text-red-500">{firmaForm.formState.errors.dia.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mes">Mes de Firma *</Label>
            <Input
              id="mes"
              className="border-border focus-visible:ring-primary"
              placeholder="Ej: junio"
              {...firmaForm.register("mes")}
            />
            {firmaForm.formState.errors.mes && (
              <p className="text-sm text-red-500">{firmaForm.formState.errors.mes.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Paso 5: Revisión
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
          Revisa toda la información antes de crear el acuerdo.
        </p>
      </div>

      <div className="space-y-6">
        {/* Datos de la Entidad */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-green-500/10 to-green-600/10 rounded-xl blur-xl"></div>
          <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-orange-600 mb-4 flex items-center gap-2">
              <BuildingIcon className="h-5 w-5" />
              Datos de la Entidad
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Entidad:</span> {convenioData.entidad_nombre}</div>
              <div><span className="font-medium">CUIT:</span> {convenioData.entidad_cuit}</div>
              <div><span className="font-medium">Domicilio:</span> {convenioData.entidad_domicilio}</div>
              <div><span className="font-medium">Ciudad:</span> {convenioData.entidad_ciudad}</div>
            </div>
          </div>
        </div>

        {/* Datos del Representante */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-green-500/10 to-green-600/10 rounded-xl blur-xl"></div>
          <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-teal-600 mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Datos del Representante
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Representante:</span> {convenioData.entidad_representante}</div>
              <div><span className="font-medium">DNI:</span> {convenioData.entidad_dni}</div>
              <div><span className="font-medium">Cargo:</span> {convenioData.entidad_cargo}</div>
            </div>
          </div>
        </div>

        {/* Datos de la Firma */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-green-500/10 to-green-600/10 rounded-xl blur-xl"></div>
          <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Datos de la Firma
            </h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><span className="font-medium">Día de Firma:</span> {convenioData.dia}</div>
                <div><span className="font-medium">Mes de Firma:</span> {convenioData.mes}</div>
              </div>
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
            Confirmo que toda la información es correcta y deseo crear el acuerdo
          </Label>
        </div>
        {revisionForm.formState.errors.confirmacion && (
          <p className="text-sm text-red-500">{revisionForm.formState.errors.confirmacion.message}</p>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderEntidadStep();
      case 2: return renderRepresentanteStep();
      case 3: return renderProyectoStep();
      case 4: return renderFirmaStep();
      case 5: return renderRevisionStep();
      default: return renderEntidadStep();
    }
  };

  return (
    <>
      <div className="space-y-8">
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
              currentStep === 5 ? "bg-background text-foreground border border-border hover:bg-accent hover:text-accent-foreground" : ""
            )}
          >
            {currentStep === 5 ? "Finalizar" : "Siguiente"}
          </Button>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-border max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirmar creación</h3>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Estás seguro de que querés crear este Acuerdo de Colaboración?
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
                Enviar acuerdo
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 