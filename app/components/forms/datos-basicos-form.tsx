import React, { useEffect } from "react";
import { FileTextIcon, PlusIcon, CheckCircleIcon } from "lucide-react";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from "@/components/ui/button";
import { commonInputStyles, commonLabelStyles } from "@/app/components/ui/common-styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Importar tipos y store
import { FieldDefinition } from "@/types/fieldDefinition"; // Usar la definición global
import { useConvenioStore } from "@/stores/convenioStore";
import { DatosBasicosData } from "@/types/convenio"; // Tipo específico para los datos de este formulario

// Función para generar el esquema Zod dinámicamente
const generateSchema = (fields: FieldDefinition[]) => {
  const shape: Record<string, z.ZodTypeAny> = {};

  // Filtrar solo los campos para Datos Básicos (asumimos step 1)
  fields.filter(f => f.step === 1).forEach(field => {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case 'number':
        // Base: número. Si no es requerido, opcional.
        let baseNumSchema = z.number({
            invalid_type_error: "Debe ser un número",
            required_error: `${field.label} es requerido` // Mensaje si es requerido y falta
        });
        fieldSchema = field.required ? baseNumSchema : baseNumSchema.optional();
        // Refinamiento adicional: positivo (se aplica a números definidos)
        fieldSchema = fieldSchema.refine((val) => val === undefined || val === null || val > 0, {
            message: "Debe ser un número positivo"
        });
        // Permitir 0 aunque no sea positivo, si no es requerido explícitamente.
        // Nota: Zod no tiene una forma fácil de decir "opcional O 0". Si 0 es válido,
        // quizás la validación .positive() no es la ideal, o debe hacerse condicional.
        // Por ahora, mantenemos .positive() pero un campo opcional podría ser undefined.
        break;
      case 'date':
        // Base: string. Si no es requerido, opcional.
         let baseDateSchema = z.string({ required_error: `${field.label} es requerido` });
         fieldSchema = field.required ? baseDateSchema : baseDateSchema.optional();

         // Refinamiento 1: Si es requerido Y no es opcional, no puede ser vacío
         if (field.required) {
            fieldSchema = fieldSchema.refine((val) => typeof val === 'string' && val.trim().length > 0, {
                message: `${field.label} es requerido`
            });
         }
         // Refinamiento 2: Si hay un valor (y no es undefined), debe ser parseable como fecha
         fieldSchema = fieldSchema.refine((val) => val === undefined || val === null || val === '' || !isNaN(Date.parse(val)), {
             message: "Formato de fecha inválido (AAAA-MM-DD)"
         });
        break;
      case 'textarea':
      case 'text':
      default:
        // Base: string. Si no es requerido, opcional.
        let baseStrSchema = z.string({
             required_error: `${field.label} es requerido`,
             invalid_type_error: "Debe ser texto"
         });
         fieldSchema = field.required ? baseStrSchema : baseStrSchema.optional();

         // Refinamiento: Si es requerido Y no es opcional, quitar espacios y verificar longitud > 0
         if (field.required) {
            fieldSchema = fieldSchema.refine((val) => typeof val === 'string' && val.trim().length > 0, {
                message: `${field.label} es requerido`
            });
         }
        break;
    }
     shape[field.name] = fieldSchema;
  });

  // Añadir el checkbox 'confidencial' al esquema
  shape['confidencial'] = z.boolean().optional();

  // Asegurarse de que la forma no esté vacía antes de crear el objeto Zod
  if (Object.keys(shape).length === 0) {
     // Devolver un schema que siempre valide si no hay campos específicos
     // o manejar este caso como un error si se prefiere.
     // Por ahora, un objeto vacío que siempre pasa.
     return z.object({}); 
  }

  const baseSchema = z.object(shape);

  // Añadir refinamiento de fechas si ambos campos existen
  if (shape.fechaInicio && shape.fechaFin) {
    return baseSchema.refine(data => {
        // Validar solo si ambas fechas son strings válidos y parseables
        if (typeof data.fechaInicio === 'string' && typeof data.fechaFin === 'string' && 
            !isNaN(Date.parse(data.fechaInicio)) && !isNaN(Date.parse(data.fechaFin))) {
            return new Date(data.fechaInicio) < new Date(data.fechaFin);
        }
        return true; // Si alguna fecha falta o es inválida, no aplicar esta regla aquí
    }, {
        message: "La fecha de fin debe ser posterior a la fecha de inicio",
        path: ["fechaFin"],
    });
  }

  return baseSchema;
};

interface DatosBasicosFormProps {
  fields: FieldDefinition[]; // Recibe todos los campos, filtraremos aquí o en generateSchema
}

export const DatosBasicosForm = ({ fields }: DatosBasicosFormProps) => {
  // Obtener valores y acciones del store
  const defaultValuesFromStore = useConvenioStore((state) => state.convenioData.datosBasicos) || {};
  const updateConvenioData = useConvenioStore((state) => state.updateConvenioData);
  const setStepValidityAction = useConvenioStore((state) => state.setStepValidity);

  const schema = generateSchema(fields); 

  const { 
    register, 
    handleSubmit, // Aunque no lo usamos para submit, puede ser útil para obtener datos
    formState: { errors, isValid, isDirty },
    watch, // Usar watch para reaccionar a cambios
    trigger // Para validar manualmente si es necesario
  } = useForm<DatosBasicosData>({ // Usar el tipo específico DatosBasicosData
    resolver: zodResolver(schema),
    mode: 'onChange', // Validar en cada cambio
    defaultValues: defaultValuesFromStore // Cargar valores desde el store
  });

  // --- Sincronización con el Store --- 

  // 1. Informar al store sobre la validez del paso actual
  useEffect(() => {
    // Informar solo si el formulario ha sido tocado (isDirty) o si ya es válido inicialmente
     if (isDirty || isValid) {
        setStepValidityAction(1, isValid, isDirty); // Paso 1
     }
  }, [isValid, isDirty, setStepValidityAction]);

  // 2. Actualizar el store central cuando los datos del formulario cambian Y SON VÁLIDOS
  useEffect(() => {
     // Suscribirse a los cambios de todos los campos
    const subscription = watch((value, { name, type }) => {
       console.log("DatosBasicosForm: watch triggered", value);
       // Validar los datos actuales del formulario
       schema.safeParseAsync(value).then(result => {
           if (result.success) {
               console.log("DatosBasicosForm: Data is valid, updating store", result.data);
               // Actualizar el store solo con datos válidos
               updateConvenioData('datosBasicos', result.data);
               // Asegurarse de que la validez se refleje inmediatamente si la validación fue exitosa aquí
               // (aunque el effect de 'isValid' debería cubrirlo)
               // setStepValidityAction(1, true, true);
           } else {
                // Si los datos no son válidos después de un cambio,
                // podríamos querer marcar el paso como inválido explícitamente
                // aunque el modo 'onChange' debería hacerlo con el effect de 'isValid'.
                 console.log("DatosBasicosForm: Data is invalid after change", result.error.flatten());
                 // setStepValidityAction(1, false, true);
           }
       });
    });
    return () => subscription.unsubscribe(); // Limpiar suscripción
  }, [watch, schema, updateConvenioData, setStepValidityAction]);

  // Efecto para validar el formulario una vez al cargar los defaultValues
  useEffect(() => {
      trigger(); // Dispara la validación inicial basada en defaultValues
  }, [trigger]);

  // Función para renderizar input (sin cambios)
   const renderInput = (field: FieldDefinition) => {
    const fieldName = field.name;
    const commonProps = {
      id: fieldName,
      placeholder: field.placeholder || `Ingrese ${field.label.toLowerCase()}...`,
      className: cn(
         commonInputStyles, 
         errors[fieldName] ? 'border-destructive focus-visible:ring-destructive/50' : '' // Acceso seguro a errors
       ),
       // Usar el nombre del campo directamente con register
      ...register(fieldName, {
         setValueAs: field.type === 'number' ? value => (value === "" || value === null || value === undefined ? undefined : parseInt(value, 10)) : undefined
      })
    };

    switch (field.type) {
      case 'textarea':
        return <Textarea {...commonProps} rows={4} className={`${commonProps.className} resize-none`} />;
      case 'date':
        return <Input {...commonProps} type="date" className={`${commonProps.className} block`} />;
      case 'number':
         return <Input {...commonProps} type="number" min="0" />;
      case 'text':
      default:
        return <Input {...commonProps} type="text" />;
    }
  };

   // Función para mostrar errores
  const renderError = (fieldName: string) => { // Recibir string
    // Acceder al error usando el índice string y castear mensaje
    const error = errors[fieldName]; 
    if (!error || typeof error.message !== 'string') return null;
    return <p className="mt-1 text-sm text-destructive">{error.message}</p>;
  };

  // Filtrar campos específicamente para el renderizado (ya filtrados para schema)
  const fieldsForRender = fields.filter(f => f.step === 1);

  return (
    <form className="animate-in fade-in slide-in-from-left duration-500 space-y-5">
      {/* Encabezado se mantiene */}
       <div className="mb-6 pb-4 border-b border-border/30">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/20 text-primary">
            <FileTextIcon className="h-5 w-5" />
          </div>
          Datos Básicos del Convenio
        </h2>
        <p className="text-muted-foreground text-sm">Información general y propósito del convenio.</p>
      </div>
      
      {/* Renderizado de campos dinámicos */}
        {fieldsForRender.length === 0 && (
           <p className="text-muted-foreground text-center py-4">No hay campos de Datos Básicos definidos.</p>
        )}
        {fieldsForRender.map((field) => {
          const fieldName = field.name; // Guardar el nombre para usar como clave
          return (
            <div key={fieldName}>
              <Label htmlFor={fieldName} className={commonLabelStyles}>
                {field.label} {field.required && <span className="text-destructive">*</span>}
              </Label>
              <div className="mt-1.5">
                  {renderInput(field)}
              </div>
               {/* Mostrar error debajo del input */}
              {renderError(fieldName)}
            </div>
          );
        })}
     
      {/* Checkbox "confidencial" */}
       <div className="flex items-center space-x-2 pt-4 border-t border-border/30">
          <input
            id="confidencial"
            type="checkbox"
            {...register("confidencial")}
            className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary/30 focus:ring-offset-background focus:ring-1"
          />
          <label htmlFor="confidencial" className="text-sm text-muted-foreground font-medium select-none">
            Marcar como confidencial
          </label>
        </div>
        
       {/* Botones de acción (funcionalidad futura) */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="outline" size="sm" className="bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Importar datos
          </Button>
          <Button type="button" variant="outline" size="sm" className="bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 hover:text-amber-600">
            <PlusIcon className="h-4 w-4 mr-2" />
            Añadir referencias
          </Button>
          <Button type="button" variant="outline" size="sm" className="bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20 hover:text-green-600">
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Validar datos
          </Button>
        </div>
    </form>
  );
};

export default DatosBasicosForm;