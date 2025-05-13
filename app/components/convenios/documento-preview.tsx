import React, { useState } from "react";
import { FileTextIcon, MaximizeIcon } from "lucide-react";
import DocumentoPreviewContent from "./documento-preview-content";
import FullScreenPreview from "./full-screen-preview";

interface DocumentoPreviewProps {
  formData: any;
}

export const  DocumentoPreview = ({ formData }: DocumentoPreviewProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const openFullScreen = () => setIsFullScreen(true);
  const closeFullScreen = () => setIsFullScreen(false);

  return (
    <div className="bg-background border border-border/60 rounded-md overflow-hidden shadow-sm max-h-[calc(100vh-200px)]">
      <div className="bg-card/90 px-4 py-2 flex justify-between items-center border-b border-border/60">
        <div className="flex items-center gap-2">
          <FileTextIcon className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground font-medium">Vista previa del documento</span>
        </div>
        <button 
          onClick={openFullScreen}
          className="bg-card/50 p-1.5 rounded-md border border-border/60 hover:bg-card/80 transition-colors flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <MaximizeIcon className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Pantalla completa</span>
        </button>
      </div>

      <div className="overflow-auto max-h-[calc(100vh-250px)]">
        <div className="p-8 bg-white">
          <DocumentoPreviewContent formData={formData} />
        </div>
      </div>

      <FullScreenPreview 
        formData={formData} 
        isOpen={isFullScreen} 
        onClose={closeFullScreen} 
      />
    </div>
  );
};

export default DocumentoPreview;