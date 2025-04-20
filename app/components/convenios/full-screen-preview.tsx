import React, { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import DocumentoPreviewContent from "./documento-preview-content";
import { FileTextIcon } from "lucide-react";

interface FullScreenPreviewProps {
  formData: any;
  isOpen: boolean;
  onClose: () => void;
}

export const FullScreenPreview = ({ formData, isOpen, onClose }: FullScreenPreviewProps) => {
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = formData.clausulas?.length ? Math.ceil(formData.clausulas.length / 3) + 1 : 2;

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col overflow-hidden animate-in fade-in duration-300">
      <div className="w-full flex items-center justify-between bg-card px-4 py-2 shadow-md border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="text-foreground">
            <FileTextIcon className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-foreground text-sm font-medium">Vista previa del documento</h2>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center text-foreground/70 px-4">
            <button 
              onClick={prevPage} 
              disabled={currentPage === 1}
              className={`p-1.5 rounded-full ${currentPage === 1 ? 'text-foreground/30 cursor-not-allowed' : 'hover:bg-border/10 text-foreground/90'}`}
              title="Página anterior"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="text-sm mx-2 select-none">
              Página {currentPage} de {totalPages}
            </span>
            <button 
              onClick={nextPage} 
              disabled={currentPage === totalPages}
              className={`p-1.5 rounded-full ${currentPage === totalPages ? 'text-foreground/30 cursor-not-allowed' : 'hover:bg-border/10 text-foreground/90'}`}
              title="Página siguiente"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center text-foreground/70 mx-2 border-l border-border/20 pl-4">
            <button onClick={zoomOut} className="p-1.5 rounded-full hover:bg-border/10 text-foreground/90 mr-1" title="Alejar">
              <ZoomOutIcon className="h-5 w-5" />
            </button>
            <span className="text-sm w-10 text-center select-none">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="p-1.5 rounded-full hover:bg-border/10 text-foreground/90 ml-1" title="Acercar">
              <ZoomInIcon className="h-5 w-5" />
            </button>
          </div>
          
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-border/10 text-foreground/70 ml-4" title="Cerrar vista previa">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex justify-center py-8 px-4 bg-gray-100/30">
        <div 
          className="bg-white max-w-3xl w-full shadow-xl transition-transform duration-150 ease-out" 
          style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
        >
          <div className="p-12"> 
            <DocumentoPreviewContent formData={formData} isFullScreen={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenPreview;