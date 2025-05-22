"use client";

import React from "react";
import { CalendarIcon } from "lucide-react";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { validateFechas } from "@/lib/types/convenio-marco";
import { Label } from "@/components/ui/label";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

export const FechasForm = () => {
  const { convenioData, updateConvenioData } = useConvenioMarcoStore();
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleDiaChange = (value: string) => {
    const currentFechas = convenioData.fechas || { dia: '', mes: '' };
    const updatedFechas = {
      ...currentFechas,
      dia: value
    };
    
    const validation = validateFechas(updatedFechas);
    setErrors(validation.errors);
    updateConvenioData('fechas', updatedFechas);
  };

  const handleMesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const currentFechas = convenioData.fechas || { dia: '', mes: '' };
    const updatedFechas = {
      ...currentFechas,
      mes: value
    };
    
    const validation = validateFechas(updatedFechas);
    setErrors(validation.errors);
    updateConvenioData('fechas', updatedFechas);
  };

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* Encabezado */}
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/20 text-primary">
            <CalendarIcon className="h-5 w-5" />
          </div>
          Fechas del Convenio
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ingresa la fecha de firma del convenio. Por defecto, la duración será de 3 años.
        </p>
      </div>

      {/* Contenedor principal */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 bg-white dark:bg-gray-900/60">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          <div>
            <Label htmlFor="dia" className={errors.dia ? "text-destructive" : ""}>
              Día de firma
            </Label>
            <input
              type="number"
              id="dia"
              min="1"
              max="31"
              placeholder="Ej: 15"
              className={`w-full mt-1.5 h-10 px-3 py-2 text-sm rounded-md border ${
                errors.dia ? 'border-destructive' : 'border-input'
              } bg-background`}
              value={convenioData.fechas?.dia || ''}
              onChange={(e) => handleDiaChange(e.target.value)}
            />
            {errors.dia && <p className="text-destructive text-sm mt-1">{errors.dia}</p>}
          </div>

          <div>
            <Label htmlFor="mes" className={errors.mes ? "text-destructive" : ""}>
              Mes de firma
            </Label>
            <select
              id="mes"
              className={`w-full mt-1.5 h-10 px-3 py-2 text-sm rounded-md border ${
                errors.mes ? 'border-destructive' : 'border-input'
              } bg-background`}
              value={convenioData.fechas?.mes || ''}
              onChange={handleMesChange}
            >
              <option value="">Seleccione un mes</option>
              {MESES.map((mes) => (
                <option key={mes} value={mes}>
                  {mes.charAt(0).toUpperCase() + mes.slice(1)}
                </option>
              ))}
            </select>
            {errors.mes && <p className="text-destructive text-sm mt-1">{errors.mes}</p>}
          </div>

          <div className="md:col-span-2">
            <div className="rounded-md p-4 bg-muted/50 border border-muted mt-4">
              <h3 className="text-sm font-medium mb-2">Información adicional</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• El convenio tendrá una duración de <strong>3 años</strong> desde su firma</li>
                <li>• Se renovará automáticamente por única vez y por igual período</li>
                <li>• Cualquiera de las partes podrá denunciarlo con preaviso de 6 meses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 