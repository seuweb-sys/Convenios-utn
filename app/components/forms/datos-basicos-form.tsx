import React from "react";
import { FileTextIcon, PlusIcon, CheckCircleIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { commonInputStyles, commonLabelStyles } from "@/app/components/ui/common-styles";

interface DatosBasicosFormProps {
  onDataChange?: (data: any) => void;
}

export const DatosBasicosForm = ({ onDataChange }: DatosBasicosFormProps) => {
  // Simulamos cambios en los datos con una función
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (onDataChange) {
      onDataChange({ [e.target.id]: e.target.value });
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-left duration-500">
      <div className="mb-6 pb-4 border-b border-border/30">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/20 text-primary">
            <FileTextIcon className="h-5 w-5" />
          </div>
          Datos Básicos del Convenio
        </h2>
        <p className="text-muted-foreground text-sm">Información general y propósito del convenio.</p>
      </div>
      
      <div className="space-y-5">
        <div>
          <label htmlFor="titulo" className={commonLabelStyles}>
            Título del convenio <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="titulo"
              type="text"
              placeholder="Ej: Convenio de colaboración entre UTN y Empresa..."
              className={commonInputStyles}
              onChange={handleChange}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <FileTextIcon className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            El título debe ser claro y descriptivo.
          </p>
        </div>
        
        <div>
          <label htmlFor="fecha" className={commonLabelStyles}>
            Fecha <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="fecha"
              type="text"
              placeholder="dd/mm/aaaa"
              className={commonInputStyles}
              onChange={handleChange}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="duracion" className={commonLabelStyles}>
              Duración del convenio <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="duracion"
                type="number"
                placeholder="Duración"
                min="1"
                className={commonInputStyles}
                onChange={handleChange}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <ClockIcon className="h-4 w-4" />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="unidad-tiempo" className={commonLabelStyles}>
              Unidad de tiempo <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <select
                id="unidad-tiempo"
                className={`${commonInputStyles} appearance-none`}
                onChange={handleChange}
              >
                <option value="dias" className="bg-background text-foreground">Días</option>
                <option value="meses" className="bg-background text-foreground">Meses</option>
                <option value="años" className="bg-background text-foreground">Años</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center px-2 pointer-events-none">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="descripcion" className={commonLabelStyles}>
            Descripción <span className="text-destructive">*</span>
          </label>
          <textarea
            id="descripcion"
            rows={5}
            placeholder="Breve descripción del objetivo del convenio..."
            className={`${commonInputStyles} resize-none`}
            onChange={handleChange}
          ></textarea>
          <p className="text-xs text-muted-foreground mt-1.5">
            Describe brevemente el propósito y alcance del convenio. Máximo 500 caracteres.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 pt-2">
          <input
            id="confidencial"
            type="checkbox"
            className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary/30 focus:ring-offset-background focus:ring-1"
          />
          <label htmlFor="confidencial" className="text-sm text-muted-foreground font-medium select-none">
            Marcar como confidencial
          </label>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Importar datos
          </Button>
          
          <Button variant="outline" size="sm" className="bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 hover:text-amber-600">
            <PlusIcon className="h-4 w-4 mr-2" />
            Añadir referencias
          </Button>
          
          <Button variant="outline" size="sm" className="bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20 hover:text-green-600">
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Validar datos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DatosBasicosForm;