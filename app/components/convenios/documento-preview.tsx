"use client";

import React from "react";
import { DocumentoPreviewContent } from "./documento-preview-content";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";

interface DocumentoPreviewProps {
  className?: string;
}

export const DocumentoPreview = ({ className = "" }: DocumentoPreviewProps) => {
  const { convenioData } = useConvenioMarcoStore();
  
  // Convertir el formato jerárquico al formato plano para la vista previa
  const previewData = {
    entidad_nombre: convenioData.entidad?.nombre || '',
    entidad_tipo: convenioData.entidad?.tipo || '',
    entidad_domicilio: convenioData.entidad?.domicilio || '',
    entidad_ciudad: convenioData.entidad?.ciudad || '',
    entidad_cuit: convenioData.entidad?.cuit || '',
    entidad_representante: convenioData.representante?.nombre || '',
    entidad_dni: convenioData.representante?.dni || '',
    entidad_cargo: convenioData.representante?.cargo || '',
    dia: convenioData.fechas?.dia || '',
    mes: convenioData.fechas?.mes || ''
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-900 border rounded-lg shadow-sm ${className}`}
    >
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
        <h3 className="font-medium">Vista previa del documento</h3>
      </div>
      <div className="h-[600px] overflow-hidden">
        <DocumentoPreviewContent 
          data={previewData}
          type="marco"
        />
      </div>
    </div>
  );
};

export default DocumentoPreview;