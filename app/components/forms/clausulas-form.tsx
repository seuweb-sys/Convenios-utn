import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, Trash2Icon, GripVerticalIcon } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useConvenioStore } from "@/stores/convenioStore";
import { ClausulasFormData, ClausulasFormSchema } from "@/types/convenio";
import { cn } from "@/lib/utils";
import { commonCardStyles, commonInputStyles, commonLabelStyles } from "@/app/components/ui/common-styles";

interface ClausulasFormProps {}

export const ClausulasForm = ({}: ClausulasFormProps) => {
  // --- Store --- 
  const defaultClausulas = useConvenioStore((state) => state.convenioData.clausulas || []);
  const updateConvenioData = useConvenioStore((state) => state.updateConvenioData);
  const setStepValidityAction = useConvenioStore((state) => state.setStepValidity);
  const currentStepFromStore = useConvenioStore((state) => state.currentStep);

  // --- React Hook Form --- 
  const { 
    register, 
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch, 
    trigger
  } = useForm<ClausulasFormData>({ 
    resolver: zodResolver(ClausulasFormSchema),
    mode: 'onBlur',
    defaultValues: { clausulas: defaultClausulas },
  });

  // --- Field Array para Cláusulas --- 
  const { fields, append, remove } = useFieldArray({
    control,
    name: "clausulas"
  });

  // --- Sincronización con el Store --- 

  // 1. Informar validez del paso 3
  useEffect(() => {
    if (currentStepFromStore === 3) {
        setStepValidityAction(3, isValid, isDirty);
    }
  }, [isValid, isDirty, setStepValidityAction, currentStepFromStore]);

  // 2. OBSERVAR cambios y validar (SIN ACTUALIZAR STORE DESDE AQUÍ)
  useEffect(() => {
    const subscription = watch((formData) => {
       // Solo procesar si este es el paso activo
       if (currentStepFromStore !== 3) return;

       console.log("ClausulasForm (active): watch triggered, validating async...", formData);
       // Validamos para ver si hay errores, pero NO actualizamos el store desde aquí
       // para evitar potenciales bucles. La validez se refleja vía formState.isValid
       // en el efecto 1, y los datos se guardarán al cambiar de paso o guardar globalmente.
       ClausulasFormSchema.safeParseAsync(formData).then(result => {
           if (result.success) {
               // console.log("ClausulasForm (active): Async validation SUCCESS."); // Opcional: log simple
               // NO LLAMAR a updateConvenioData aquí
               // NO LLAMAR a setStepValidityAction aquí
           } else {
               console.error("ClausulasForm (active): Async validation FAILED. Error object:", result.error);
               console.log("ClausulasForm (active): Flattened Errors:", result.error.flatten()); 
               // NO LLAMAR a setStepValidityAction aquí
           }
       });
    });
    return () => subscription.unsubscribe();
    // Las dependencias ahora son solo watch y currentStepFromStore
  }, [watch, currentStepFromStore]); 

  // Validar al inicio (solo si es el paso activo)
  useEffect(() => {
      if (currentStepFromStore === 3) {
         trigger(); 
      }
  }, [trigger, currentStepFromStore]);

  // --- Handlers para Field Array --- 
  const addClause = () => {
    append({ texto: "" });
  };

  // --- Renderizado --- 
  return (
    <form className="animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-6 pb-4 border-b border-border/30 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-primary/20 text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                Cláusulas
            </h2>
            <p className="text-muted-foreground text-sm">Define las cláusulas que formarán parte del convenio.</p>
        </div>
         <Button type="button" variant="outline" size="sm" onClick={addClause} className="ml-auto">
            <PlusIcon className="h-4 w-4 mr-2" />
          Agregar cláusula
        </Button>
      </div>

      {errors.clausulas?.root?.message && (
          <p className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md">{errors.clausulas.root.message}</p>
      )}
      
      <div className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className={`${commonCardStyles} p-4 relative group`}>
            <div className="flex items-start gap-3">
                 <button type="button" className="mt-2 text-muted-foreground/50 hover:text-muted-foreground cursor-grab touch-none">
                    <GripVerticalIcon className="h-5 w-5" />
                </button>
                
                <div className="flex-grow space-y-2">
                    <Label htmlFor={`clausulas.${index}.texto`} className={`${commonLabelStyles} font-medium text-base`}>
                         Cláusula {index + 1}
                    </Label>
                    <Textarea
                        id={`clausulas.${index}.texto`}
                        className={cn(commonInputStyles, errors.clausulas?.[index]?.texto ? 'border-destructive' : '', 'min-h-[80px]')}
                        placeholder={`Escribe el texto de la cláusula ${index + 1}...`}
                        {...register(`clausulas.${index}.texto` as const)}
                    />
                    {errors.clausulas?.[index]?.texto?.message && (
                        <p className="text-sm text-destructive">{errors.clausulas[index]?.texto?.message}</p>
                    )}
                </div>

              <Button 
                    type="button" 
                variant="ghost" 
                    size="icon" 
                    onClick={() => remove(index)} 
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Eliminar cláusula"
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </form>
  );
};

export default ClausulasForm;