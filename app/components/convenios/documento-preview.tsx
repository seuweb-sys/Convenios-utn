import React, { useState } from "react";
import { FileTextIcon, MaximizeIcon } from "lucide-react";

interface DocumentoPreviewProps {
  templateContent: {
    title: string;
    subtitle: string;
    partes: string[];
    considerandos: string[];
    clausulas: {
      titulo: string;
      contenido: string;
    }[];
    cierre: string;
  };
  fields: Record<string, string>;
}

export function DocumentoPreview({ templateContent, fields }: DocumentoPreviewProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const openFullScreen = () => setIsFullScreen(true);
  const closeFullScreen = () => setIsFullScreen(false);

  // Función helper para reemplazar campos
  const replaceFields = (text: string) => {
    let processed = text;
    Object.entries(fields).forEach(([key, value]) => {
      processed = processed.replace(
        new RegExp(`{${key}}`, 'g'),
        value
      );
    });
    return processed;
  };

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
        <div className="p-8 bg-white space-y-6">
          {/* Título */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {templateContent.title}
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              {replaceFields(templateContent.subtitle)}
            </p>
          </div>

          {/* Partes */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">PARTES INTERVINIENTES</h2>
            {templateContent.partes.map((parte, index) => (
              <p key={index} className="text-foreground">
                {replaceFields(parte)}
              </p>
            ))}
          </div>

          {/* Considerandos */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">CONSIDERANDO:</h2>
            {templateContent.considerandos.map((considerando, index) => (
              <p key={index} className="text-foreground">
                {replaceFields(considerando)}
              </p>
            ))}
          </div>

          {/* Cláusulas */}
          <div className="space-y-6">
            {templateContent.clausulas.map((clausula, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-xl font-semibold text-primary">
                  CLÁUSULA {clausula.titulo}:
                </h3>
                <p className="text-foreground whitespace-pre-line">
                  {replaceFields(clausula.contenido)}
                </p>
              </div>
            ))}
          </div>

          {/* Cierre */}
          <div className="space-y-4">
            <p className="text-foreground">
              {replaceFields(templateContent.cierre)}
            </p>
          </div>

          {/* Firmas */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-8 border-t">
            <div className="text-center">
              <p className="text-foreground">Por UTN-FRRe</p>
              <p className="font-semibold mt-2">Ing. José Leandro BASTERRA</p>
              <p className="text-sm text-muted-foreground">Decano</p>
            </div>
            <div className="text-center">
              <p className="text-foreground">
                Por {fields.entidad_nombre || 'LA ORGANIZACIÓN'}
              </p>
              <p className="font-semibold mt-2">
                {fields.entidad_representante || 'REPRESENTANTE'}
              </p>
              <p className="text-sm text-muted-foreground">
                {fields.entidad_cargo || 'CARGO'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de pantalla completa */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="w-full max-w-4xl bg-background rounded-lg shadow-lg">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Vista previa del documento</h2>
                  <button
                    onClick={closeFullScreen}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <MaximizeIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-8 overflow-auto max-h-[calc(100vh-200px)]">
                  {/* Mismo contenido que arriba */}
                  <div className="space-y-6">
                    {/* Título */}
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-foreground">
                        {templateContent.title}
                      </h1>
                      <p className="text-lg text-muted-foreground mt-2">
                        {replaceFields(templateContent.subtitle)}
                      </p>
                    </div>

                    {/* Partes */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-primary">PARTES INTERVINIENTES</h2>
                      {templateContent.partes.map((parte, index) => (
                        <p key={index} className="text-foreground">
                          {replaceFields(parte)}
                        </p>
                      ))}
                    </div>

                    {/* Considerandos */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-primary">CONSIDERANDO:</h2>
                      {templateContent.considerandos.map((considerando, index) => (
                        <p key={index} className="text-foreground">
                          {replaceFields(considerando)}
                        </p>
                      ))}
                    </div>

                    {/* Cláusulas */}
                    <div className="space-y-6">
                      {templateContent.clausulas.map((clausula, index) => (
                        <div key={index} className="space-y-2">
                          <h3 className="text-xl font-semibold text-primary">
                            CLÁUSULA {clausula.titulo}:
                          </h3>
                          <p className="text-foreground whitespace-pre-line">
                            {replaceFields(clausula.contenido)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Cierre */}
                    <div className="space-y-4">
                      <p className="text-foreground">
                        {replaceFields(templateContent.cierre)}
                      </p>
                    </div>

                    {/* Firmas */}
                    <div className="grid grid-cols-2 gap-8 pt-8 mt-8 border-t">
                      <div className="text-center">
                        <p className="text-foreground">Por UTN-FRRe</p>
                        <p className="font-semibold mt-2">Ing. José Leandro BASTERRA</p>
                        <p className="text-sm text-muted-foreground">Decano</p>
                      </div>
                      <div className="text-center">
                        <p className="text-foreground">
                          Por {fields.entidad_nombre || 'LA ORGANIZACIÓN'}
                        </p>
                        <p className="font-semibold mt-2">
                          {fields.entidad_representante || 'REPRESENTANTE'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {fields.entidad_cargo || 'CARGO'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}