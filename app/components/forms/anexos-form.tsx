"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  FileTextIcon, 
  Trash2Icon, 
  UploadIcon, 
  FolderIcon, 
  EyeIcon, 
  AlertCircleIcon, 
  PaperclipIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConvenioStore } from "@/stores/convenioStore";

interface AnexosFormProps {}

export const AnexosForm = ({}: AnexosFormProps) => {
  // --- Estado local ---
  const [anexos, setAnexos] = useState<Array<{
    id: number;
    nombre: string;
    tipo: string;
    tamano: string;
    fecha: string;
  }>>([
    { id: 1, nombre: "Anexo Técnico.pdf", tipo: "application/pdf", tamano: "845 KB", fecha: "05/04/2023" }
  ]);
  const [formStatus, setFormStatus] = useState({
    showErrors: false,
    submitted: false,
    valid: true
  });
  
  // --- Store --- 
  const updateConvenioData = useConvenioStore((state) => state.updateConvenioData);
  const setStepValidityAction = useConvenioStore((state) => state.setStepValidity);
  const currentStepFromStore = useConvenioStore((state) => state.currentStep);
  
  // --- Handlers ---
  const handleAddAnexo = () => {
    // En un caso real, aquí se abriría el selector de archivos
    // Por ahora simularemos añadir un archivo nuevo con datos de ejemplo
    const newId = anexos.length > 0 ? Math.max(...anexos.map(a => a.id)) + 1 : 1;
    const nuevoAnexo = {
      id: newId,
      nombre: `Nuevo Anexo ${newId}.pdf`,
      tipo: "application/pdf",
      tamano: "512 KB",
      fecha: new Date().toLocaleDateString()
    };
    
    const updatedAnexos = [...anexos, nuevoAnexo];
    setAnexos(updatedAnexos);
    
    // Actualizar store
    updateConvenioData('anexos', updatedAnexos.map(a => ({
      nombreArchivo: a.nombre,
      url: `anexos/${a.id}`
    })));
  };

  const handleRemoveAnexo = (id: number) => {
    const updatedAnexos = anexos.filter(anexo => anexo.id !== id);
    setAnexos(updatedAnexos);
    
    // Actualizar store
    updateConvenioData('anexos', updatedAnexos.map(a => ({
      nombreArchivo: a.nombre,
      url: `anexos/${a.id}`
    })));
  };

  const handleAnexoChange = (index: number, value: string) => {
    // Asegurarse de que anexos es un array antes de manipularlo
    const currentAnexos = Array.isArray(anexos) ? [...anexos] : [];
    
    // Actualizar el anexo específico - usando el formato de datos correcto
    if (currentAnexos[index]) {
      // Actualizar solo el nombre del anexo existente manteniendo el resto de propiedades
      currentAnexos[index] = { 
        ...currentAnexos[index], 
        nombre: value 
      };
    } else {
      // Si no existe, crear uno nuevo con el formato correcto
      currentAnexos[index] = { 
        id: index + 1, 
        nombre: value, 
        tipo: "application/pdf", 
        tamano: "0 KB", 
        fecha: new Date().toLocaleDateString()
      };
    }
    
    // Actualizar el estado local
    setAnexos(currentAnexos);
    
    // Actualizar el estado global
    updateConvenioData('anexos', currentAnexos.map(a => ({
      nombreArchivo: a.nombre,
      url: `anexos/${a.id}`
    })));
  };
  
  // --- Efectos ---
  useEffect(() => {
    // Considerar este paso como válido solo si hay al menos un anexo
    const isValid = anexos.length > 0;
    setStepValidityAction(4, isValid, true);
  }, [setStepValidityAction, anexos.length]);

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* Encabezado */}
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/20 text-primary">
            <PaperclipIcon className="h-5 w-5" />
          </div>
          Anexos del Convenio
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Adjunta documentos complementarios que formen parte del convenio.
        </p>
      </div>
      
      {/* Información sobre anexos */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-md mb-6">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-800/50 rounded-full text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5">
            <AlertCircleIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
              Información sobre anexos
            </p>
            <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
              Los anexos son documentos complementarios al convenio principal. Puedes adjuntar especificaciones técnicas, cronogramas, presupuestos u otros documentos relevantes.
            </p>
          </div>
        </div>
      </div>
      
      {/* Contador y botón de upload */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
            <FolderIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {anexos.length} anexo{anexos.length !== 1 ? 's' : ''} adjunto{anexos.length !== 1 ? 's' : ''}
          </h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddAnexo}
          className="flex items-center gap-1.5 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary"
        >
          <UploadIcon className="h-3.5 w-3.5" /> 
          Subir anexo
        </Button>
      </div>
      
      {/* Área de drop/upload */}
      <div 
        className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
        onClick={handleAddAnexo}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <UploadIcon className="h-6 w-6" />
          </div>
          <h3 className="font-medium text-gray-800 dark:text-gray-200">Arrastra archivos aquí o haz clic para seleccionar</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Formatos aceptados: PDF, DOC, DOCX, JPG (máx. 10MB)
          </p>
        </div>
        {anexos.length === 0 && (
          <div className="mt-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-3 rounded-md text-center">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              <span className="font-medium">Se requiere al menos un anexo</span> para poder avanzar al último paso.
            </p>
          </div>
        )}
      </div>
      
      {/* Lista de anexos */}
      {anexos.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <FileTextIcon className="h-4 w-4 text-primary" />
            Anexos adjuntos
          </h3>
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900/60 overflow-hidden">
            {anexos.map((anexo) => (
              <div 
                key={anexo.id} 
                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-primary/10 text-primary flex-shrink-0">
                    <FileTextIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{anexo.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {anexo.tamano} • Subido el {anexo.fecha}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-full"
                    title="Ver anexo"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-500 hover:text-destructive hover:bg-destructive/10 rounded-full"
                    onClick={() => handleRemoveAnexo(anexo.id)}
                    title="Eliminar anexo"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer con estado de validación */}
      <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
        {/* Mensaje de validación */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {anexos.length > 0 ? (
            <span className="text-green-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Anexos validados correctamente
            </span>
          ) : (
            <span>Debe adjuntar al menos un anexo para continuar</span>
          )}
        </p>
        
        {/* Estado de validación como botón estático */}
        <Button 
          type="button"
          variant="outline"
          size="sm"
          disabled={anexos.length === 0}
          className={`${
            anexos.length > 0 
              ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" 
              : "bg-gray-100 text-gray-400 border-gray-200"
          }`}
        >
          {anexos.length > 0 
            ? "✓ Anexos validados" 
            : "Falta anexo"}
        </Button>
      </div>
    </div>
  );
};

export default AnexosForm;