import React from "react";
import { FileIcon, CornerDownRightIcon, PaperclipIcon, FileTextIcon } from "lucide-react";

interface RevisionFormProps {
  onDataChange?: (data: any) => void;
  formData: any;
}

export const RevisionForm = ({ onDataChange, formData }: RevisionFormProps) => {
  const handleObservacionesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const observaciones = e.target.value;
    onDataChange && onDataChange({ observaciones });
  };
  
  return (
    <div className="animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Revisión Final</h2>
        <p className="text-muted-foreground text-sm">Revisa toda la información del convenio antes de enviarlo.</p>
      </div>
      
      <div className="space-y-6">
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-blue-500/20 text-blue-500"><FileIcon className="h-5 w-5" /></div>
            Información básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Título:</p>
              <p className="font-medium text-foreground">{formData.titulo || <span className="text-foreground/50 italic">No especificado</span>}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Fecha:</p>
              <p className="font-medium text-foreground">{formData.fecha || <span className="text-foreground/50 italic">No especificada</span>}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Duración:</p>
              <p className="font-medium text-foreground">{`${formData.duracion || '--'} ${formData['unidad-tiempo'] || ''}`.trim() || <span className="text-foreground/50 italic">No especificada</span>}</p>
            </div>
             <div className="space-y-1 md:col-span-2">
              <p className="text-muted-foreground">Descripción:</p>
              <p className="font-medium text-foreground">{formData.descripcion || <span className="text-foreground/50 italic">No especificada</span>}</p>
            </div>
             <div className="space-y-1">
              <p className="text-muted-foreground">Confidencial:</p>
              <p className="font-medium text-foreground">{formData.confidencial ? 'Sí' : 'No'}</p>
            </div>
          </div>
        </div>
        
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-green-500/20 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            Partes involucradas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div className="space-y-3 border-r border-border/60 pr-6">
              <p className="font-semibold border-b border-border/60 pb-1 text-foreground">UTN</p>
              <div className="space-y-1"><p className="text-muted-foreground">Representante:</p><p className="text-foreground">Ing. José Leandro BASTERRA</p></div>
              <div className="space-y-1"><p className="text-muted-foreground">Cargo:</p><p className="text-foreground">Decano</p></div>
              <div className="space-y-1"><p className="text-muted-foreground">Dirección:</p><p className="text-foreground">French 414, Resistencia, Chaco</p></div>
            </div>
            <div className="space-y-3">
              <p className="font-semibold border-b border-border/60 pb-1 text-foreground">{formData.organizacion || <span className="text-foreground/50 italic">Organización</span>}</p>
              <div className="space-y-1"><p className="text-muted-foreground">Representante:</p><p className="text-foreground">{formData.representante || <span className="text-foreground/50 italic">No especificado</span>}</p></div>
              <div className="space-y-1"><p className="text-muted-foreground">Cargo:</p><p className="text-foreground">{formData.cargo || <span className="text-foreground/50 italic">No especificado</span>}</p></div>
              <div className="space-y-1"><p className="text-muted-foreground">Dirección:</p><p className="text-foreground">{formData.direccion || <span className="text-foreground/50 italic">No especificada</span>}</p></div>
            </div>
          </div>
        </div>
        
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-amber-500/20 text-amber-500"><CornerDownRightIcon className="h-5 w-5" /></div>
            Cláusulas verificadas ({formData.clausulas?.length || 0})
          </h3>
          <ul className="space-y-2 text-sm">
            {formData.clausulas && formData.clausulas.length > 0 ? (
              formData.clausulas.map((clausula: { id: number, titulo: string, contenido: string }, index: number) => (
                <li key={clausula.id} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{clausula.titulo}</p>
                    <p className="text-muted-foreground text-xs">{clausula.contenido.substring(0, 100)}{clausula.contenido.length > 100 ? '...' : ''}</p>
                  </div>
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
              formData.anexos.map((anexo: { id: number, nombre: string, tamano: string }) => (
                <li key={anexo.id} className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-primary text-primary-foreground flex-shrink-0">
                     <FileTextIcon className="w-4 h-4"/>
                  </div>
                  <span className="text-foreground">{anexo.nombre}</span>
                  <span className="text-xs text-muted-foreground">({anexo.tamano})</span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground italic">No hay anexos adjuntos</li>
            )}
          </ul>
        </div>
        
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-cyan-500/20 text-cyan-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
            </div>
            Observaciones adicionales
          </h3>
          <textarea
            className="w-full px-4 py-2.5 bg-card/80 border border-border/60 text-foreground focus:border-primary/30 focus:ring-1 focus:ring-primary/20 focus:ring-offset-0 rounded-md h-28 resize-none transition-colors placeholder-muted-foreground"
            placeholder="Agregue cualquier observación o nota adicional sobre el convenio..."
            value={formData.observaciones || ""}
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