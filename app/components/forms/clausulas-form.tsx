"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { PlusIcon, TrashIcon, GripVerticalIcon, FileTextIcon, ArrowUpIcon, ArrowDownIcon, InfoIcon } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { commonLabelStyles, commonInputStyles } from '@/app/components/ui/common-styles';
import { ClausulasFormData, ClausulaData } from '@/types/convenio';
import { useConvenioStore } from '@/stores/convenioStore';

interface ClausulasFormProps {}

export const ClausulasForm = ({}: ClausulasFormProps) => {
  // --- Estado local ---
  const [formStatus, setFormStatus] = useState({
    showErrors: false,
    submitted: false,
    valid: false,
    validated: false
  });
  
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
    mode: 'onChange',
    defaultValues: { clausulas: defaultClausulas.length > 0 ? defaultClausulas : [{ texto: '' }] }
  });

  // --- FieldArray para manejar las cláusulas --- 
  const { fields, append, remove, swap, move } = useFieldArray({
    control,
    name: "clausulas",
  });

  // --- Validación simplificada ---
  const validateForm = (data: ClausulasFormData) => {
    // Verificar si hay al menos una cláusula con texto
    if (!data.clausulas || data.clausulas.length === 0) {
      setStepValidityAction(3, false, true);
      return false;
    }
    
    const isValid = data.clausulas.some(
      (clausula) => clausula.texto && clausula.texto.trim() !== ''
    );
    
    // Aseguramos que siempre se actualice con un nuevo array completo
    if (data.clausulas) {
      const clausulasValidas = data.clausulas.map(clausula => ({
        texto: clausula?.texto || ''
      }));
      updateConvenioData('clausulas', [...clausulasValidas]);
    }
    
    setStepValidityAction(3, isValid, true);
    return isValid;
  };
  
  // Nuevo estado para controlar si ya se validó
  const [stepValidated, setStepValidated] = useState(false);

  // Asegurar que siempre haya al menos una cláusula vacía
  useEffect(() => {
    if (fields.length === 0 && currentStepFromStore === 3) {
      append({ texto: '' });
    }
  }, [fields.length, append, currentStepFromStore]);

  // Handler para submit del formulario
  const onSubmit = (data: ClausulasFormData) => {
    if (data.clausulas) {
      // Asegurarse de que cada cláusula tenga la estructura correcta
      const clausulasValidas = data.clausulas.map(clausula => ({
        texto: clausula?.texto || ''
      }));
      // Actualizar el store con cláusulas bien formateadas SOLO en submit
      // Forzamos un nuevo array independiente para evitar problemas de referencia
      updateConvenioData('clausulas', [...clausulasValidas]);
    }
    validateForm(data);
    setFormStatus(prev => ({...prev, submitted: true}));
  };

  return (
    <form 
      className="space-y-6 animate-in fade-in-0"
      onSubmit={handleSubmit(onSubmit)}
      data-step="3"
    >
      {/* Encabezado */}
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/20 text-primary">
            <FileTextIcon className="h-5 w-5" />
          </div>
          Cláusulas del Convenio
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Define las condiciones y términos acordados entre las partes.
        </p>
      </div>
      
      {/* Mensaje informativo */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-md mb-6">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-800/50 rounded-full text-blue-700 dark:text-blue-300 flex-shrink-0 mt-0.5">
            <InfoIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              Instrucciones para cláusulas
            </p>
            <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">
              Puedes añadir tantas cláusulas como necesites. Reordénalas usando los botones de mover arriba/abajo.
              Debe haber al menos una cláusula con texto para poder avanzar.
            </p>
          </div>
        </div>
      </div>
      
      {/* Botón para agregar cláusula (arriba) */}
      <div className="mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ texto: '' })}
          className="flex items-center gap-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
        >
          <PlusIcon className="h-4 w-4" />
          Agregar Cláusula
        </Button>
      </div>
      
      {/* Lista de cláusulas */}
      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/30">
            <p className="text-gray-500 dark:text-gray-400">No hay cláusulas. Haz clic en "Agregar Cláusula" para comenzar.</p>
          </div>
        ) : (
          fields.map((field, index) => (
            <div 
              key={field.id} 
              className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-4 relative"
            >
              <div className="flex items-center justify-between mb-3">
                <Label htmlFor={`clausulas.${index}.texto`} className={cn(commonLabelStyles, "flex items-center")}>
                  <span className="flex items-center justify-center bg-primary text-primary-foreground w-6 h-6 rounded-full text-sm font-medium mr-2">
                    {index + 1}
                  </span>
                  <span>Cláusula {index + 1}</span>
                  {index === 0 && <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">Requerida</span>}
                </Label>
                
                <div className="flex items-center gap-1.5">
                  {/* Botones de reordenamiento */}
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => move(index, index - 1)}
                      className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      title="Mover arriba"
                    >
                      <span className="sr-only">Mover arriba</span>
                      <ArrowUpIcon className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {index < fields.length - 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => move(index, index + 1)}
                      className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      title="Mover abajo"
                    >
                      <span className="sr-only">Mover abajo</span>
                      <ArrowDownIcon className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Botón de eliminar */}
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Eliminar cláusula"
                    >
                      <span className="sr-only">Eliminar</span>
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <Textarea
                id={`clausulas.${index}.texto`}
                {...register(`clausulas.${index}.texto` as const, {
                  required: index === 0 ? "La primera cláusula es obligatoria" : false,
                })}
                className={cn(
                  commonInputStyles, 
                  errors.clausulas?.[index]?.texto ? 'border-destructive' : '',
                  "min-h-[120px] bg-gray-50 dark:bg-gray-800/50"
                )}
                placeholder={`Escriba el texto de la cláusula ${index + 1} aquí...`}
              />
              
              {errors.clausulas?.[index]?.texto && (
                <p className="text-xs text-destructive mt-1">
                  {errors.clausulas[index]?.texto?.message?.toString() || "Este campo es requerido"}
                </p>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
        {/* Mensaje de ayuda */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-block mr-1 p-1 bg-primary/10 text-primary rounded-full">
            <InfoIcon className="h-3 w-3" />
          </span>
          {fields.length} cláusula{fields.length !== 1 ? 's' : ''} definida{fields.length !== 1 ? 's' : ''}
          {formStatus.validated && formStatus.valid && (
            <span className="ml-2 text-green-600">✓ Validación completada</span>
          )}
        </p>
        
        {/* Botón para validar */}
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
            ? "✓ Cláusulas validadas" 
            : "Validar cláusulas"}
        </Button>
      </div>
    </form>
  );
};

export default ClausulasForm;