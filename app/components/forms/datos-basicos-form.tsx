"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FileTextIcon, InfoIcon, CalendarIcon, LockIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { DatosBasicosData, validateDatosBasicos } from "@/types/convenio";
import { useConvenioStore } from "@/stores/convenioStore";
import { Button } from "@/components/ui/button";
import { commonInputStyles, commonLabelStyles } from "@/app/components/ui/common-styles";

// Props para el componente
interface DatosBasicosFormProps {}

// Componente principal
export const DatosBasicosForm = ({}: DatosBasicosFormProps) => {
    // --- Estado local ---
    const [formStatus, setFormStatus] = useState({
        showErrors: false,
        submitted: false,
        valid: false,
        validated: false
    });
  
    // --- Store --- 
    const defaultValuesFromStore = useConvenioStore((state) => state.convenioData.datosBasicos);
    const updateConvenioData = useConvenioStore((state) => state.updateConvenioData);
    const setStepValidityAction = useConvenioStore((state) => state.setStepValidity);
    const currentStepFromStore = useConvenioStore((state) => state.currentStep);
    
    // --- React Hook Form ---
    const { 
      register, 
      handleSubmit,
      formState: { errors, isDirty },
      watch,
      setValue,
      getValues
    } = useForm<DatosBasicosData>({ 
      mode: 'onChange',
      defaultValues: defaultValuesFromStore || {
        nombre: '',
        objeto: '',
        fechaInicio: '',
        fechaFin: '',
        confidencial: false
      } 
    });

    // Agregar estado para debounce
    const [debouncedData, setDebouncedData] = useState<Partial<DatosBasicosData> | null>(null);
    const [formValidated, setFormValidated] = useState(false);
    
    // --- Efectos ---
    
    // Solo actualizar el store con datos sin validar continuamente
    useEffect(() => {
      if (debouncedData && currentStepFromStore === 1 && !formValidated) {
        // Actualizar el store sin validar
        updateConvenioData('datosBasicos', debouncedData);
      }
    }, [debouncedData, updateConvenioData, currentStepFromStore, formValidated]);
    
    // Actualizar el store cuando los datos del formulario cambian, pero sin validar constantemente
    useEffect(() => {
      // Si ya validamos el formulario con éxito, evitamos actualizaciones continuas
      if (formValidated && formStatus.valid) {
        return;
      }
      
      const subscription = watch((data) => {
        // Solo procesar si este es el paso activo
        if (currentStepFromStore !== 1) return;
        
        // Debounce para actualizar el store - después de 500ms sin cambios
        const debounceTimer = setTimeout(() => {
          setDebouncedData(data as DatosBasicosData);
        }, 500); // Debounce de 500ms para limitar actualizaciones y logs
        
        return () => clearTimeout(debounceTimer);
      });
      
      return () => subscription.unsubscribe();
    }, [watch, currentStepFromStore, formStatus.valid, formValidated]);

    // --- Validación del formulario ---
    const validateForm = (data: DatosBasicosData) => {
      // Validar los datos
      const validationResult = validateDatosBasicos(data);
      const isValid = validationResult.valid;
      
      // Actualizar store con los datos
      updateConvenioData('datosBasicos', data);
      
      // Marcar como validado y actualizar estado
      setFormStatus(prev => ({
        ...prev, 
        valid: isValid,
        validated: true
      }));
      
      // Si es válido, marcar el paso como válido
      if (isValid) {
        setFormValidated(true);
        setStepValidityAction(1, true, true);
      } else {
        // Si no es válido, mostrar errores
        setFormStatus(prev => ({...prev, showErrors: true}));
      }
      
      return isValid;
    };

    // --- Handlers ---
    
    // Handler para submit del formulario
    const onSubmit = (data: DatosBasicosData) => {
      const isValid = validateForm(data);
      setFormStatus(prev => ({...prev, submitted: true}));
    };

    return (
        <form 
          className="space-y-6 animate-in fade-in-0"
          onSubmit={handleSubmit(onSubmit)}
        >
            {/* Encabezado */}
            <div className="space-y-2 mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-primary/20 text-primary">
                        <FileTextIcon className="h-5 w-5" />
                    </div>
                    Datos Básicos del Convenio
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ingresa la información general que identificará este convenio.
                </p>
            </div>

            {/* Contenedor principal */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 bg-white dark:bg-gray-900/60">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <InfoIcon className="h-4 w-4 text-primary" />
                        Información General
                    </h3>
                    
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Datos requeridos
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                    {/* Nombre del Convenio */}
                    <div className="col-span-2">
                        <Label htmlFor="nombre" className={cn(commonLabelStyles, "flex items-center")}>
                            Nombre del Convenio
                            <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input 
                            {...register('nombre', { required: "El nombre es requerido" })}
                            id="nombre"
                            className={cn(
                                commonInputStyles, 
                                errors.nombre ? 'border-destructive' : '',
                                "bg-gray-50 dark:bg-gray-800"
                            )}
                            placeholder="Ej: Convenio Marco de Colaboración UTN-ACME"
                        />
                        {errors.nombre && (
                            <span className="text-xs text-destructive mt-1 block">{errors.nombre.message}</span>
                        )}
                    </div>

                    {/* Objeto - Descripción del propósito */}
                    <div className="col-span-2">
                        <Label htmlFor="objeto" className={cn(commonLabelStyles, "flex items-center")}>
                            Objeto del Convenio
                            <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Textarea 
                            {...register('objeto', { required: "El objeto del convenio es requerido" })}
                            id="objeto"
                            className={cn(
                                commonInputStyles, 
                                errors.objeto ? 'border-destructive' : '',
                                "bg-gray-50 dark:bg-gray-800 min-h-[120px]"
                            )}
                            placeholder="Describe el propósito general del convenio..."
                            rows={5}
                        />
                        {errors.objeto && (
                            <span className="text-xs text-destructive mt-1 block">{errors.objeto.message}</span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Contenedor de fechas */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 bg-white dark:bg-gray-900/60">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        Vigencia del Convenio
                    </h3>
                    
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Fechas requeridas
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                    {/* Fecha Inicio */}
                    <div>
                        <Label htmlFor="fechaInicio" className={cn(commonLabelStyles, "flex items-center")}>
                            Fecha de Inicio
                            <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input 
                            {...register('fechaInicio', { required: "La fecha de inicio es requerida" })}
                            id="fechaInicio"
                            type="date"
                            className={cn(
                                commonInputStyles, 
                                errors.fechaInicio ? 'border-destructive' : '',
                                "bg-gray-50 dark:bg-gray-800"
                            )}
                        />
                        {errors.fechaInicio && (
                            <span className="text-xs text-destructive mt-1 block">{errors.fechaInicio.message}</span>
                        )}
                    </div>

                    {/* Fecha Fin */}
                    <div>
                        <Label htmlFor="fechaFin" className={cn(commonLabelStyles, "flex items-center")}>
                            Fecha de Fin
                            <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input 
                            {...register('fechaFin', { required: "La fecha de fin es requerida" })}
                            id="fechaFin"
                            type="date"
                            className={cn(
                                commonInputStyles, 
                                errors.fechaFin ? 'border-destructive' : '',
                                "bg-gray-50 dark:bg-gray-800"
                            )}
                        />
                        {errors.fechaFin && (
                            <span className="text-xs text-destructive mt-1 block">{errors.fechaFin.message}</span>
                        )}
                        
                        {errors.fechaFin && errors.fechaFin.message?.includes('posterior') && (
                            <span className="text-xs text-amber-600 dark:text-amber-500 mt-1 block">
                                La fecha de fin debe ser posterior a la fecha de inicio
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Opción de confidencialidad */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 bg-white dark:bg-gray-900/60">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <LockIcon className="h-4 w-4 text-primary" />
                        Confidencialidad
                    </h3>
                    
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        Opcional
                    </span>
                </div>
                
                <div className="flex items-center space-x-2 p-2">
                    <Checkbox
                        id="confidencial"
                        {...register('confidencial')}
                        className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <div className="grid gap-1.5 leading-none">
                        <Label 
                            htmlFor="confidencial" 
                            className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                            Este es un convenio confidencial
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Marca esta opción si el convenio contiene información sensible o confidencial
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Footer con botón de validación */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
              {/* Mensaje de validación */}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formStatus.validated && formStatus.valid ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    Datos básicos validados correctamente
                  </span>
                ) : (
                  <span>Complete todos los campos requeridos y valide antes de continuar</span>
                )}
              </p>
              
              {/* Botón de validación */}
              <Button 
                type="submit"
                variant="outline"
                size="sm"
                className={`${
                  formStatus.validated && formStatus.valid 
                    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" 
                    : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                }`}
              >
                {formStatus.validated && formStatus.valid 
                  ? "✓ Datos validados" 
                  : "Validar datos"}
              </Button>
            </div>
        </form>
    );
};

export default DatosBasicosForm;