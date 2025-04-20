import React from "react";
import { commonInputStyles, commonCardStyles, commonLabelStyles } from "@/app/components/ui/common-styles";

interface PartesFormProps {
  onDataChange?: (data: any) => void;
}

export const PartesForm = ({ onDataChange }: PartesFormProps) => {
  return (
    <div className="animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Partes Involucradas</h2>
        <p className="text-muted-foreground text-sm">Información de las organizaciones que participan en el convenio.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className={`${commonCardStyles} p-6`}>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            Universidad Tecnológica Nacional (UTN)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Representante legal</label>
              <input
                type="text"
                className="w-full px-3 py-2.5 bg-muted/50 border border-border/50 text-muted-foreground rounded-md cursor-not-allowed"
                value="Ing. José Leandro BASTERRA"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Cargo</label>
              <input
                type="text"
                className="w-full px-3 py-2.5 bg-muted/50 border border-border/50 text-muted-foreground rounded-md cursor-not-allowed"
                value="Decano"
                readOnly
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Dirección</label>
              <input
                type="text"
                className="w-full px-3 py-2.5 bg-muted/50 border border-border/50 text-muted-foreground rounded-md cursor-not-allowed"
                value="French 414, Resistencia, Chaco"
                readOnly
              />
            </div>
          </div>
        </div>
        
        <div className={`${commonCardStyles} p-6`}>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            Contraparte
          </h3>
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className={commonLabelStyles}>Nombre de la organización <span className="text-destructive">*</span></label>
              <input
                type="text"
                className={commonInputStyles}
                placeholder="Nombre de empresa o institución"
                onChange={(e) => onDataChange && onDataChange({ organizacion: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={commonLabelStyles}>Representante legal <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  className={commonInputStyles}
                  placeholder="Nombre y apellido"
                  onChange={(e) => onDataChange && onDataChange({ representante: e.target.value })}
                />
              </div>
              <div>
                <label className={commonLabelStyles}>Cargo <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  className={commonInputStyles}
                  placeholder="Cargo del representante"
                  onChange={(e) => onDataChange && onDataChange({ cargo: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className={commonLabelStyles}>Dirección <span className="text-destructive">*</span></label>
              <input
                type="text"
                className={commonInputStyles}
                placeholder="Dirección completa"
                onChange={(e) => onDataChange && onDataChange({ direccion: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartesForm;