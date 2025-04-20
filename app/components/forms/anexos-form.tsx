import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { EyeIcon, FileTextIcon, Trash2Icon, UploadIcon } from "lucide-react";

interface AnexosFormProps {
  onDataChange?: (data: any) => void;
}

export const AnexosForm = ({ onDataChange }: AnexosFormProps) => {
  const [anexos, setAnexos] = useState([
    { id: 1, nombre: "Anexo Técnico.pdf", tipo: "application/pdf", tamano: "845 KB", fecha: "05/04/2023" }
  ]);

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
    
    setAnexos([...anexos, nuevoAnexo]);
    
    if (onDataChange) { onDataChange({ anexos: [...anexos, nuevoAnexo] }); }
  };

  const handleRemoveAnexo = (id: number) => {
    const updatedAnexos = anexos.filter(anexo => anexo.id !== id);
    setAnexos(updatedAnexos);
    
    if (onDataChange) { onDataChange({ anexos: updatedAnexos }); }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Anexos</h2>
        <p className="text-muted-foreground text-sm">Adjunta los documentos anexos que complementan este convenio.</p>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-md font-medium text-muted-foreground">
            Total: {anexos.length} anexo{anexos.length !== 1 ? 's' : ''}
          </h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddAnexo}
          className="flex items-center gap-1 border-dashed border-border/60 bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        >
          <UploadIcon className="h-4 w-4" /> 
          Subir anexo
        </Button>
      </div>
      
      <div className="border-2 border-dashed border-border/60 rounded-xl p-8 bg-card/80 hover:bg-card/90 transition-colors cursor-pointer">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="p-3 rounded-full bg-primary text-primary-foreground">
            <UploadIcon className="h-6 w-6" />
          </div>
          <h3 className="font-medium text-foreground">Arrastra archivos aquí o haz clic para seleccionar</h3>
          <p className="text-muted-foreground text-sm">
            Puedes subir archivos PDF, DOC, DOCX o JPG (máx. 10MB)
          </p>
        </div>
      </div>
      
      {anexos.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="font-medium text-foreground">Anexos adjuntos</h3>
          <div className="border border-border/60 rounded-xl divide-y divide-border/50 bg-card/80 overflow-hidden">
            {anexos.map((anexo) => (
              <div 
                key={anexo.id} 
                className="p-4 flex items-center justify-between hover:bg-card/90 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-primary text-primary-foreground flex-shrink-0">
                    <FileTextIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{anexo.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {anexo.tamano} • Subido el {anexo.fecha}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary/80 hover:text-primary hover:bg-primary/10">
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveAnexo(anexo.id)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnexosForm;