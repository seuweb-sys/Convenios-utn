import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';

// Importar estilos, store, tipos y schema
import { commonInputStyles, commonCardStyles, commonLabelStyles } from "@/app/components/ui/common-styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConvenioStore } from "@/stores/convenioStore";
import { ParteData, ParteSchema } from "@/types/convenio";
import { cn } from "@/lib/utils";

// Definir la parte UTN fija (ajustar si es necesario)
const parteUtnFija: ParteData = {
    id: "utn-fija", // ID Fijo o generado
    tipo: 'universidad',
    nombre: "Universidad Tecnológica Nacional - Facultad Regional Resistencia",
    cuit: "30-54667118-3", // CUIT UTN FRRE
    domicilio: "French 414, Resistencia, Chaco",
    representanteNombre: "Ing. José Leandro BASTERRA",
    representanteDni: "", // Completar si se tiene
    cargoRepresentante: "Decano",
};

// Crear una referencia estable para un objeto Parte vacío
const EMPTY_PARTE: Partial<ParteData> = {}; // Usar Partial para que coincida con el tipo esperado

// Ya no necesita props
interface PartesFormProps {}

export const PartesForm = ({}: PartesFormProps) => {
  // Obtener datos y acciones del store
  const defaultContraparte = useConvenioStore((state) => 
      state.convenioData.partes && state.convenioData.partes.length > 1 
      ? state.convenioData.partes[1] 
      : EMPTY_PARTE // <--- Usar la referencia estable
  );
  const updateConvenioData = useConvenioStore((state) => state.updateConvenioData);
  const setStepValidityAction = useConvenioStore((state) => state.setStepValidity);
  const currentStepFromStore = useConvenioStore((state) => state.currentStep); // Leer currentStep

  const { 
    register, 
    formState: { errors, isValid, isDirty },
    watch, 
    trigger 
  } = useForm<ParteData>({ // Usar ParteData como tipo
    resolver: zodResolver(ParteSchema), // Usar el schema importado
    mode: 'onBlur',
    defaultValues: defaultContraparte as Partial<ParteData>, // Cargar datos de la contraparte desde el store, explicit cast
  });

  // --- Sincronización con el Store --- 

  // 1. Informar validez del paso 2
  useEffect(() => {
    // Solo actualizar si este es el paso activo
    if (currentStepFromStore === 2) {
        setStepValidityAction(2, isValid, isDirty);
    }
  }, [isValid, isDirty, setStepValidityAction, currentStepFromStore]); // Añadir dependencia

  // 2. Actualizar el store central y la VALIDEZ después de la validación asíncrona
  useEffect(() => {
    const subscription = watch((contraparteData) => {
       // Solo procesar si este es el paso activo
       if (currentStepFromStore !== 2) return;

       console.log("PartesForm (active): watch triggered, validating async...", contraparteData);
       ParteSchema.safeParseAsync(contraparteData).then(result => {
           if (result.success) {
               console.log("PartesForm (active): Async validation SUCCESS, updating store and validity", result.data);
               updateConvenioData('partes', [parteUtnFija, result.data]); 
               setStepValidityAction(2, true, true);
           } else {
               console.error("PartesForm (active): Async validation FAILED after change. Error object:", result.error);
               console.log("PartesForm (active): Flattened Errors:", result.error.flatten()); 
               setStepValidityAction(2, false, true);
           }
       });
    });
    return () => subscription.unsubscribe();
  }, [watch, updateConvenioData, setStepValidityAction, currentStepFromStore]); // Añadir dependencia

  // Validar al inicio (solo si es el paso activo)
  useEffect(() => {
      if (currentStepFromStore === 2) {
        trigger(); 
      }
  }, [trigger, currentStepFromStore]); // Añadir dependencia

   // Función para mostrar errores (similar a DatosBasicosForm)
   const renderError = (fieldName: keyof ParteData) => { 
    const error = errors[fieldName]; 
    if (!error || typeof error.message !== 'string') return null;
    return <p className="mt-1 text-sm text-destructive">{error.message}</p>;
  };

  return (
    <form className="animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-6 pb-4 border-b border-border/30">
         <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-primary/20 text-primary">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
             </div>
             Partes Involucradas
        </h2>
        <p className="text-muted-foreground text-sm">Información de las organizaciones que participan en el convenio.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {/* UTN Fija (Read Only) */}
        <div className={`${commonCardStyles} p-6 opacity-80`}>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500">
                {/* Icono UTN */}
            </div>
            {parteUtnFija.nombre}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div>
              <Label className="block mb-1.5 text-muted-foreground/80">Representante legal</Label>
              <Input value={parteUtnFija.representanteNombre} readOnly className="bg-muted/30 border-border/30 cursor-default" />
            </div>
            <div>
              <Label className="block mb-1.5 text-muted-foreground/80">Cargo</Label>
              <Input value={parteUtnFija.cargoRepresentante} readOnly className="bg-muted/30 border-border/30 cursor-default" />
            </div>
            <div className="md:col-span-2">
              <Label className="block mb-1.5 text-muted-foreground/80">Dirección</Label>
              <Input value={parteUtnFija.domicilio} readOnly className="bg-muted/30 border-border/30 cursor-default" />
            </div>
             <div>
              <Label className="block mb-1.5 text-muted-foreground/80">CUIT</Label>
              <Input value={parteUtnFija.cuit} readOnly className="bg-muted/30 border-border/30 cursor-default" />
            </div>
          </div>
        </div>
        
         {/* Contraparte (Editable con RHF) */}
        <div className={`${commonCardStyles} p-6 border-primary/20`}>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500">
                 {/* Icono Contraparte */}
            </div>
            Contraparte
          </h3>
          <div className="grid grid-cols-1 gap-5">
            {/* Nombre Organización */}
            <div>
              <Label htmlFor="nombre" className={commonLabelStyles}>Nombre de la organización <span className="text-destructive">*</span></Label>
              <Input
                id="nombre"
                type="text"
                className={cn(commonInputStyles, errors.nombre ? 'border-destructive' : '')}
                placeholder="Nombre de empresa o institución"
                {...register("nombre")} 
              />
              {renderError('nombre')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               {/* Representante */}
              <div>
                    <Label htmlFor="representanteNombre" className={commonLabelStyles}>Representante legal <span className="text-destructive">*</span></Label>
                    <Input
                        id="representanteNombre"
                  type="text"
                        className={cn(commonInputStyles, errors.representanteNombre ? 'border-destructive' : '')}
                  placeholder="Nombre y apellido"
                        {...register("representanteNombre")} 
                />
                    {renderError('representanteNombre')}
              </div>
                 {/* Cargo Representante */}
              <div>
                    <Label htmlFor="cargoRepresentante" className={commonLabelStyles}>Cargo <span className="text-destructive">*</span></Label>
                    <Input
                        id="cargoRepresentante"
                  type="text"
                        className={cn(commonInputStyles, errors.cargoRepresentante ? 'border-destructive' : '')}
                  placeholder="Cargo del representante"
                        {...register("cargoRepresentante")} 
                />
                     {renderError('cargoRepresentante')}
              </div>
            </div>
             {/* Dirección */}
            <div>
              <Label htmlFor="domicilio" className={commonLabelStyles}>Dirección <span className="text-destructive">*</span></Label>
              <Input
                id="domicilio"
                type="text"
                className={cn(commonInputStyles, errors.domicilio ? 'border-destructive' : '')}
                placeholder="Dirección completa"
                {...register("domicilio")} 
              />
              {renderError('domicilio')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-border/30">
                {/* CUIT (Opcional) */}
                <div>
                    <Label htmlFor="cuit" className={commonLabelStyles}>CUIT</Label>
                    <Input
                        id="cuit"
                        type="text"
                        className={cn(commonInputStyles, errors.cuit ? 'border-destructive' : '')}
                        placeholder="XX-XXXXXXXX-X"
                         {...register("cuit")} 
                    />
                    {renderError('cuit')}
                </div>
                 {/* DNI Representante (Opcional) */}
                <div>
                    <Label htmlFor="representanteDni" className={commonLabelStyles}>DNI Representante</Label>
                    <Input
                        id="representanteDni"
                        type="text"
                        className={cn(commonInputStyles, errors.representanteDni ? 'border-destructive' : '')}
                        placeholder="7 u 8 dígitos"
                        {...register("representanteDni")} 
                    />
                    {renderError('representanteDni')}
                </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PartesForm;