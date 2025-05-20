"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { commonLabelStyles, commonInputStyles } from "@/app/components/ui/common-styles";
import { ParteData } from "@/types/convenio";
import { useConvenioStore } from "@/stores/convenioStore";
import { UserIcon, BuildingIcon, ChevronDownIcon, InfoIcon } from "lucide-react";
import React from "react";

export interface PartesFormProps {}

// Parte UTN fija que siempre se incluye
const parteUtnFija: ParteData = {
    tipo: 'universidad',
    nombre: 'Universidad Tecnológica Nacional - Facultad Regional Resistencia',
    domicilio: 'French 414, Resistencia, Chaco',
    cuit: '30-54667118-3',
    representanteNombre: 'Ing. José Leandro BASTERRA',
    cargoRepresentante: 'Decano',
};

export const PartesForm = ({}: PartesFormProps) => {
  // --- Estado local ---
  const [formStatus, setFormStatus] = useState({
    showErrors: false,
    submitted: false,
    valid: false,
    validated: false
  });
  
  // --- Store --- 
  const convenioData = useConvenioStore((state) => state.convenioData);
  const updateConvenioData = useConvenioStore((state) => state.updateConvenioData);
  const setStepValidityAction = useConvenioStore((state) => state.setStepValidity);
  const currentStep = useConvenioStore((state) => state.currentStep);
  
  // Extraer partes de forma segura, asegurando que sea un array
  const partes = Array.isArray(convenioData.partes) ? convenioData.partes : [];
  
  // --- React Hook Form --- 
  const { 
    register, 
    formState: { errors }, 
    getValues,
    trigger,
    reset
  } = useForm<ParteData>({ 
    mode: 'onChange',
    // Inicializar con valores por defecto o con la contraparte existente
    defaultValues: partes.length > 1 ? partes[1] : {
        tipo: 'empresa',
        nombre: '',
        domicilio: '',
        representanteNombre: '',
        representanteDni: '',
        cargoRepresentante: '',
        cuit: ''
    }
  });
  
  // --- Efecto inicial ---
  useEffect(() => {
    // Inicializar la parte UTN si no existe
    if (partes.length === 0) {
      updateConvenioData('partes', [{ ...parteUtnFija }]);
    }
    
    // Si la contraparte ya existe, verificar si está completa y validar
    if (partes.length > 1) {
      const contraparte = partes[1];
      const isValid = !!contraparte.nombre && 
                     !!contraparte.cuit && 
                     !!contraparte.domicilio && 
                     !!contraparte.representanteNombre && 
                     !!contraparte.representanteDni && 
                     !!contraparte.cargoRepresentante;
      
      if (isValid) {
        setFormStatus({
          showErrors: false,
          submitted: true,
          valid: true,
          validated: true
        });
        setStepValidityAction(2, true, true);
      }
    }
  }, []);
  
  // Efecto para detectar cambio de paso
  useEffect(() => {
    // Al salir del paso 2, guardar los datos actuales
    if (currentStep !== 2) {
      saveCurrentFormData();
    }
  }, [currentStep]);
  
  // Efecto para resetear el formulario cuando cambian los datos en el store o el paso
  useEffect(() => {
    if (currentStep === 2 && partes.length > 1) {
      // Forzar nuevo objeto para evitar problemas de referencia
      reset({ ...partes[1] });
    }
  }, [currentStep, partes, reset]);
      
  // --- Funciones ---
  
  // Guardar datos en el store explícitamente
  const saveCurrentFormData = () => {
    const formData = getValues();
    // Crear SIEMPRE un nuevo array y nuevos objetos, no depender de mapeos del array antiguo
    const newPartes = [
      { ...parteUtnFija },
      { ...formData }
    ];
    // Siempre pasamos un nuevo array con nuevos objetos
    updateConvenioData('partes', newPartes);
  };
  
  // Validar el formulario manualmente
  const validateForm = () => {
    const formData = getValues();
    
    // Validar que todos los campos obligatorios estén completos
    const isValid = !!formData.nombre && 
                   !!formData.cuit && 
                   !!formData.domicilio && 
                   !!formData.representanteNombre && 
                   !!formData.representanteDni && 
                   !!formData.cargoRepresentante;
    
    // Guardar los datos actuales con un nuevo array y objetos
    saveCurrentFormData();
    
    // Actualizar estado local
    setFormStatus({
      showErrors: !isValid,
      submitted: true,
      valid: isValid,
      validated: true
    });
    
    // Actualizar el estado en el store
    setStepValidityAction(2, isValid, true);
    
    return isValid;
  };

  // Manejar clic en botón de validación
  const onManualValidate = () => {
    trigger().then(() => {
      validateForm();
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-0" data-step="2">
      {/* Encabezado */}
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/20 text-primary">
            <UserIcon className="h-5 w-5" />
          </div>
          Partes Involucradas
        </h2>
        <p className="text-sm text-gray-500">
          Información de las entidades que participan en el convenio.
        </p>
      </div>
      
      {/* Primera Parte: UTN (fija, no editable) */}
      <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-lg mb-6 border border-blue-100 dark:border-blue-900/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <BuildingIcon className="h-4 w-4" />
            Universidad Tecnológica Nacional
          </h3>
          <span className="text-xs bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
            Parte Principal
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium block text-gray-600 dark:text-gray-300">Domicilio:</span>
            <span className="text-gray-800 dark:text-gray-200">{parteUtnFija.domicilio}</span>
          </div>
          <div>
            <span className="font-medium block text-gray-600 dark:text-gray-300">CUIT:</span>
            <span className="text-gray-800 dark:text-gray-200">{parteUtnFija.cuit}</span>
          </div>
          <div>
            <span className="font-medium block text-gray-600 dark:text-gray-300">Representante:</span>
            <span className="text-gray-800 dark:text-gray-200">{parteUtnFija.representanteNombre}</span>
          </div>
          <div>
            <span className="font-medium block text-gray-600 dark:text-gray-300">Cargo:</span>
            <span className="text-gray-800 dark:text-gray-200">{parteUtnFija.cargoRepresentante}</span>
          </div>
        </div>
      </div>
      
      {/* Segunda Parte: Contraparte (editable) */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 bg-white dark:bg-gray-900/60">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <BuildingIcon className="h-4 w-4 text-primary" />
            Información de la Contraparte
          </h3>
          
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Requerido
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          {/* Tipo de Contraparte */}
          <div>
            <Label htmlFor="tipo" className={commonLabelStyles}>Tipo de Contraparte</Label>
            <div className="relative">
              <select
                id="tipo"
                {...register("tipo")}
                className={cn("w-full px-3 py-2 border rounded-md appearance-none", commonInputStyles)}
              >
                <option value="empresa">Empresa</option>
                <option value="alumno">Alumno</option>
                <option value="docente">Docente</option>
                <option value="otro">Otro</option>
              </select>
              <ChevronDownIcon className="absolute top-2.5 right-3 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
                
          {/* Nombre / Razón Social */}
          <div>
            <Label htmlFor="nombre" className={cn(commonLabelStyles, "flex items-center")}>
              Nombre / Razón Social
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="nombre"
              type="text"
              className={cn(
                commonInputStyles, 
                (errors.nombre || (formStatus.showErrors && !getValues().nombre)) ? 'border-destructive' : '',
                "bg-gray-50 dark:bg-gray-800"
              )}
              placeholder="Nombre completo o razón social"
              {...register("nombre", { required: true })}
            />
            {(errors.nombre || (formStatus.showErrors && !getValues().nombre)) && (
              <span className="text-xs text-destructive mt-1 block">Este campo es requerido</span>
            )}
          </div>
                
          {/* CUIT/CUIL (Opcional) */}
          <div>
            <Label htmlFor="cuit" className={cn(commonLabelStyles, "flex items-center")}>
              CUIT/CUIL
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="cuit"
              type="text"
              className={cn(
                commonInputStyles, 
                (errors.cuit || (formStatus.showErrors && !getValues().cuit)) ? 'border-destructive' : '',
                "bg-gray-50 dark:bg-gray-800"
              )}
              placeholder="XX-XXXXXXXX-X"
              {...register("cuit", { required: true })}
            />
            {(errors.cuit || (formStatus.showErrors && !getValues().cuit)) && (
              <span className="text-xs text-destructive mt-1 block">Este campo es requerido</span>
            )}
          </div>
                
          {/* Domicilio */}
          <div>
            <Label htmlFor="domicilio" className={cn(commonLabelStyles, "flex items-center")}>
              Domicilio Legal
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="domicilio"
              type="text"
              className={cn(
                commonInputStyles, 
                (errors.domicilio || (formStatus.showErrors && !getValues().domicilio)) ? 'border-destructive' : '',
                "bg-gray-50 dark:bg-gray-800"
              )}
              placeholder="Dirección completa"
              {...register("domicilio", { required: true })}
            />
            {(errors.domicilio || (formStatus.showErrors && !getValues().domicilio)) && (
              <span className="text-xs text-destructive mt-1 block">Este campo es requerido</span>
            )}
          </div>
                
          {/* Representante */}
          <div>
            <Label htmlFor="representanteNombre" className={cn(commonLabelStyles, "flex items-center")}>
              Nombre del Representante
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="representanteNombre"
              type="text"
              className={cn(
                commonInputStyles, 
                (errors.representanteNombre || (formStatus.showErrors && !getValues().representanteNombre)) ? 'border-destructive' : '',
                "bg-gray-50 dark:bg-gray-800"
              )}
              placeholder="Nombre y apellido"
              {...register("representanteNombre", { required: true })}
            />
            {(errors.representanteNombre || (formStatus.showErrors && !getValues().representanteNombre)) && (
              <span className="text-xs text-destructive mt-1 block">Este campo es requerido</span>
            )}
          </div>
                
          {/* DNI Representante */}
          <div>
            <Label htmlFor="representanteDni" className={cn(commonLabelStyles, "flex items-center")}>
              DNI Representante
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="representanteDni"
              type="text"
              className={cn(
                commonInputStyles, 
                (errors.representanteDni || (formStatus.showErrors && !getValues().representanteDni)) ? 'border-destructive' : '',
                "bg-gray-50 dark:bg-gray-800"
              )}
              placeholder="7 u 8 dígitos"
              {...register("representanteDni", {
                required: true,
                onChange: (e) => {
                  // Limpiar el valor: eliminar cualquier caracter que no sea dígito
                  const input = e.target as HTMLInputElement;
                  const rawValue = input.value;
                  const cleaned = rawValue.replace(/[^\d]/g, '');
                  
                  // Solo actualizar si hay un cambio real
                  if (cleaned !== rawValue) {
                    input.value = cleaned;
                  }
                }
              })}
            />
            {(errors.representanteDni || (formStatus.showErrors && !getValues().representanteDni)) && (
              <span className="text-xs text-destructive mt-1 block">Este campo es requerido</span>
            )}
          </div>
                
          {/* Cargo Representante */}
          <div>
            <Label htmlFor="cargoRepresentante" className={cn(commonLabelStyles, "flex items-center")}>
              Cargo del Representante
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="cargoRepresentante"
              type="text"
              className={cn(
                commonInputStyles, 
                (errors.cargoRepresentante || (formStatus.showErrors && !getValues().cargoRepresentante)) ? 'border-destructive' : '',
                "bg-gray-50 dark:bg-gray-800"
              )}
              placeholder="Ej: Presidente, Director, etc."
              {...register("cargoRepresentante", { required: true })}
            />
            {(errors.cargoRepresentante || (formStatus.showErrors && !getValues().cargoRepresentante)) && (
              <span className="text-xs text-destructive mt-1 block">Este campo es requerido</span>
            )}
          </div>
        </div>
        
        {/* Mensaje de información */}
        <div className="mt-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-3 rounded-md text-sm text-blue-700 dark:text-blue-300">
          <p className="flex items-start gap-2">
            <span className="p-1 bg-blue-100 dark:bg-blue-800/50 rounded-full block mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </span>
            <span>
              <strong>Todos los campos son obligatorios</strong> para poder avanzar al siguiente paso. Complete la información completa de la contraparte.
            </span>
          </p>
        </div>
      </div>
      
      {/* Footer con Botón de Validación */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
        {/* Mensaje de estado */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-block mr-1 p-1 bg-primary/10 text-primary rounded-full">
            <InfoIcon className="h-3 w-3" />
            </span>
          {partes.length > 1 ? 'Dos partes definidas' : 'Solo parte UTN definida'}
          {formStatus.validated && formStatus.valid && (
            <span className="ml-2 text-green-600">✓ Datos completos</span>
          )}
        </p>
        
        {/* Botón para validar/guardar explícitamente */}
        <Button 
          type="button"
          onClick={onManualValidate}
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
    </div>
  );
};

export default PartesForm;