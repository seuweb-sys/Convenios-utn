"use client";

import React, { useEffect } from "react";
import { 
  FileIcon, 
  CornerDownRightIcon, 
  PaperclipIcon, 
  FileTextIcon, 
  MessageSquareIcon, 
  CheckSquareIcon,
  InfoIcon,
  UsersIcon,
  AlertCircleIcon 
} from "lucide-react";

import { useConvenioStore } from "@/stores/convenioStore";
import { ConvenioData } from "@/types/convenio";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface RevisionFormProps {}

export const RevisionForm = ({}: RevisionFormProps) => {
  // --- Store ---
  const formData = useConvenioStore((state) => state.convenioData);
  const updateConvenioData = useConvenioStore((state) => state.updateConvenioData);
  const setStepValidity = useConvenioStore((state) => state.setStepValidity);

  // --- Efectos ---
  useEffect(() => {
    // Siempre considerar este paso como válido
    setStepValidity(5, true, true);
  }, [setStepValidity]);

  // --- Handlers ---
  const handleObservacionesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const comentarios = e.target.value;
    updateConvenioData('revision', { 
      comentarios, 
      aprobado: formData.revision?.aprobado || false 
    });
  };
  
  // Función auxiliar para mostrar datos o placeholder
  const displayData = (data: string | number | undefined | null, placeholder = "No especificado") => {
    return data ? String(data) : <span className="text-gray-400 dark:text-gray-500 italic">{placeholder}</span>;
  };

  console.log('RevisionForm formData:', formData);

  return (
    <div className="space-y-6 animate-in fade-in-0">
      {/* Encabezado */}
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/20 text-primary">
            <CheckSquareIcon className="h-5 w-5" />
          </div>
          Revisión Final del Convenio
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Verifica toda la información del convenio antes de guardar.
        </p>
      </div>
      
      {/* Alerta de revisión */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-md mb-6">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-800/50 rounded-full text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5">
            <AlertCircleIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
              Importante: Revisión final
            </p>
            <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
              Una vez enviado, el convenio será remitido para aprobación y no podrá ser modificado hasta que sea aprobado o rechazado.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-5">
        {/* Información básica */}
        <div className="border border-gray-200 dark:border-gray-800 p-5 rounded-lg bg-white dark:bg-gray-900/60 hover:border-primary/30 transition-colors">
          <h3 className="text-base font-medium mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <FileIcon className="h-4 w-4" />
            </div>
            Información básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div className="space-y-1">
              <p className="text-gray-500 dark:text-gray-400">Nombre:</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{displayData(formData.datosBasicos?.nombre)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500 dark:text-gray-400">Fecha Inicio:</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{displayData(formData.datosBasicos?.fechaInicio)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500 dark:text-gray-400">Fecha Fin:</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{displayData(formData.datosBasicos?.fechaFin)}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-gray-500 dark:text-gray-400">Objeto:</p>
              <p className="font-medium text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{displayData(formData.datosBasicos?.objeto)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500 dark:text-gray-400">Confidencial:</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">
                {formData.datosBasicos?.confidencial ? 
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Sí</span> : 
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">No</span>
                }
              </p>
            </div>
          </div>
        </div>
        
        {/* Partes involucradas */}
        <div className="border border-gray-200 dark:border-gray-800 p-5 rounded-lg bg-white dark:bg-gray-900/60 hover:border-primary/30 transition-colors">
          <h3 className="text-base font-medium mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <UsersIcon className="h-4 w-4" />
            </div>
            Partes involucradas ({formData.partes?.length || 0})
          </h3>
          <div className="space-y-4 text-sm">
            {formData.partes && formData.partes.length > 0 ? (
              formData.partes.map((parte, index) => (
                <div key={parte.id || index} className="border-b border-gray-200 dark:border-gray-800 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium mb-2 text-gray-800 dark:text-gray-200 capitalize flex items-center">
                      {parte.tipo === 'universidad' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 mr-2">Universidad</span>
                      ) : parte.tipo === 'empresa' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 mr-2">Empresa</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 mr-2">{parte.tipo}</span>
                      )}
                      {displayData(parte.nombre)}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-xs bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">
                    <div><span className="text-gray-500 dark:text-gray-400">CUIT:</span> {displayData(parte.cuit)}</div>
                    <div><span className="text-gray-500 dark:text-gray-400">Domicilio:</span> {displayData(parte.domicilio)}</div>
                    <div><span className="text-gray-500 dark:text-gray-400">Representante:</span> {displayData(parte.representanteNombre)}</div>
                    <div><span className="text-gray-500 dark:text-gray-400">Cargo:</span> {displayData(parte.cargoRepresentante)}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No hay partes definidas</p>
            )}
          </div>
        </div>
        
        {/* Cláusulas */}
        <div className="border border-gray-200 dark:border-gray-800 p-5 rounded-lg bg-white dark:bg-gray-900/60 hover:border-primary/30 transition-colors">
          <h3 className="text-base font-medium mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <CornerDownRightIcon className="h-4 w-4" />
            </div>
            Cláusulas ({formData.clausulas?.length || 0})
          </h3>
          <ul className="space-y-3 text-sm">
            {formData.clausulas && formData.clausulas.length > 0 ? (
              formData.clausulas.map((clausula, index) => (
                <li key={index} className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{displayData(clausula.texto, 'Cláusula sin texto')}</p>
                </li>
              ))
            ) : (
              <li className="text-gray-500 dark:text-gray-400 italic">No hay cláusulas definidas</li>
            )}
          </ul>
        </div>
        
        {/* Anexos */}
        <div className="border border-gray-200 dark:border-gray-800 p-5 rounded-lg bg-white dark:bg-gray-900/60 hover:border-primary/30 transition-colors">
          <h3 className="text-base font-medium mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <PaperclipIcon className="h-4 w-4" />
            </div>
            Anexos adjuntos ({formData.anexos?.length || 0})
          </h3>
          
          {formData.anexos && formData.anexos.length > 0 ? (
            <div className="space-y-2">
              {formData.anexos.map((anexo, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                  <div className="p-1.5 rounded bg-primary/10 text-primary flex-shrink-0">
                    <FileTextIcon className="w-4 h-4"/>
                  </div>
                  <span className="text-gray-800 dark:text-gray-200 text-sm">{displayData(anexo.nombreArchivo)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic text-sm">No hay anexos adjuntos</p>
          )}
        </div>
        
        {/* Observaciones */}
        <div className="border border-gray-200 dark:border-gray-800 p-5 rounded-lg bg-white dark:bg-gray-900/60 hover:border-primary/30 transition-colors">
          <h3 className="text-base font-medium mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <div className="p-1.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
              <MessageSquareIcon className="h-4 w-4" />
            </div>
            Observaciones adicionales
          </h3>
          <Textarea
            className={cn(
              "w-full min-h-[120px] resize-none bg-gray-50 dark:bg-gray-800/50",
              "border border-gray-200 dark:border-gray-700 rounded-md",
              "text-gray-800 dark:text-gray-200",
              "focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
            )}
            placeholder="Agregue cualquier observación o nota adicional sobre el convenio..."
            value={formData.revision?.comentarios || ""}
            onChange={handleObservacionesChange}
          />
        </div>
        
        {/* Nota importante */}
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-md">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-primary/20 text-primary flex-shrink-0 mt-0.5">
              <InfoIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Siguiente paso:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Al finalizar la revisión, podrás guardar el convenio como borrador o enviarlo para su aprobación.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevisionForm;