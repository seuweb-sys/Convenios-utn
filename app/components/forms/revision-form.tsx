import React, { useEffect } from "react";
import { FileIcon, CornerDownRightIcon, PaperclipIcon, FileTextIcon, MessageSquareIcon, CheckSquareIcon } from "lucide-react";

import { useConvenioStore } from "@/stores/convenioStore";
import { ConvenioData } from "@/types/convenio";

interface RevisionFormProps {
  // onDataChange?: (data: any) => void;
  // formData: any;
}

export const RevisionForm = ({ }: RevisionFormProps) => {
  const formData = useConvenioStore((state) => state.convenioData);
  const updateConvenioData = useConvenioStore((state) => state.updateConvenioData);
  const setStepValidity = useConvenioStore((state) => state.setStepValidity);

  useEffect(() => {
    setStepValidity(5, true, true);
  }, [setStepValidity]);

  const handleObservacionesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const comentarios = e.target.value;
    updateConvenioData('revision', { comentarios });
  };
  
  const displayData = (data: string | number | undefined | null, placeholder = "No especificado") => {
    return data ? String(data) : <span className="text-foreground/50 italic">{placeholder}</span>;
  };

  return (
    <div className="animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-6 pb-4 border-b border-border/30">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/20 text-primary">
            <CheckSquareIcon className="h-5 w-5" />
          </div>
          Revisión Final
        </h2>
        <p className="text-muted-foreground text-sm">Verifica toda la información del convenio antes de guardar.</p>
      </div>
      
      <div className="space-y-6">
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-blue-500/20 text-blue-500"><FileIcon className="h-5 w-5" /></div>
            Información básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Nombre:</p>
              <p className="font-medium text-foreground">{displayData(formData.datosBasicos?.nombre)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Fecha Inicio:</p>
              <p className="font-medium text-foreground">{displayData(formData.datosBasicos?.fechaInicio)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Fecha Fin:</p>
              <p className="font-medium text-foreground">{displayData(formData.datosBasicos?.fechaFin)}</p>
            </div>
             <div className="space-y-1 md:col-span-2">
              <p className="text-muted-foreground">Objeto:</p>
              <p className="font-medium text-foreground whitespace-pre-wrap">{displayData(formData.datosBasicos?.objeto)}</p>
            </div>
             <div className="space-y-1">
              <p className="text-muted-foreground">Confidencial:</p>
              <p className="font-medium text-foreground">{formData.datosBasicos?.confidencial ? 'Sí' : 'No'}</p>
            </div>
          </div>
        </div>
        
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-green-500/20 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            Partes involucradas ({formData.partes?.length || 0})
          </h3>
          <div className="space-y-4 text-sm">
            {formData.partes && formData.partes.length > 0 ? (
              formData.partes.map((parte, index) => (
                <div key={parte.id || index} className="border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
                  <p className="font-semibold mb-1 text-foreground capitalize">{displayData(parte.tipo)}: {displayData(parte.nombre)}</p>
                  <div className="grid grid-cols-2 gap-x-4 text-xs">
                    <div><span className="text-muted-foreground">CUIT:</span> {displayData(parte.cuit)}</div>
                    <div><span className="text-muted-foreground">Domicilio:</span> {displayData(parte.domicilio)}</div>
                    <div><span className="text-muted-foreground">Rep.:</span> {displayData(parte.representanteNombre)}</div>
                    <div><span className="text-muted-foreground">DNI Rep.:</span> {displayData(parte.representanteDni)}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground italic">No hay partes definidas</p>
            )}
          </div>
        </div>
        
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-amber-500/20 text-amber-500"><CornerDownRightIcon className="h-5 w-5" /></div>
            Cláusulas ({formData.clausulas?.length || 0})
          </h3>
          <ul className="space-y-2 text-sm">
            {formData.clausulas && formData.clausulas.length > 0 ? (
              formData.clausulas.map((clausula, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{displayData(clausula.texto, 'Cláusula sin texto')}</p>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground italic">No hay cláusulas definidas</li>
            )}
          </ul>
        </div>
        
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-purple-500/20 text-purple-500"><PaperclipIcon className="h-5 w-5" /></div>
            Anexos adjuntos ({formData.anexos?.length || 0})
          </h3>
          <ul className="space-y-2 text-sm">
            {formData.anexos && formData.anexos.length > 0 ? (
              formData.anexos.map((anexo, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-primary text-primary-foreground flex-shrink-0">
                    <FileTextIcon className="w-4 h-4"/>
                  </div>
                  <span className="text-foreground">{displayData(anexo.nombreArchivo)}</span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground italic">No hay anexos adjuntos</li>
            )}
          </ul>
        </div>
        
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-cyan-500/20 text-cyan-500"><MessageSquareIcon className="h-5 w-5" /></div>
            Observaciones adicionales
          </h3>
          <textarea
            className="w-full px-4 py-2.5 bg-card/80 border border-border/60 text-foreground focus:border-primary/30 focus:ring-1 focus:ring-primary/20 focus:ring-offset-0 rounded-md h-28 resize-none transition-colors placeholder-muted-foreground"
            placeholder="Agregue cualquier observación o nota adicional sobre el convenio..."
            value={formData.revision?.comentarios || ""}
            onChange={handleObservacionesChange}
          ></textarea>
        </div>
        
        <div className="p-4 bg-primary/20 border border-primary/30 rounded-md">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded-full bg-primary text-primary-foreground mt-0.5 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Importante:</p>
              <p className="text-sm text-muted-foreground">
                Una vez enviado, el convenio será remitido para revisión y no podrá ser modificado hasta que sea aprobado o rechazado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevisionForm;