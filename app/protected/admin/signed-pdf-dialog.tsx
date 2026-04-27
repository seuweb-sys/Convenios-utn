"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UploadIcon, FileIcon, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { uploadFileToDriveInChunks } from "@/app/lib/client-drive-upload";

interface SignedPdfDialogProps {
  isOpen: boolean;
  onClose: () => void;
  convenioId: string;
  convenioTitle: string;
  existingSignedPdfPath?: string | null;
}

export function SignedPdfDialog({
  isOpen,
  onClose,
  convenioId,
  convenioTitle,
  existingSignedPdfPath
}: SignedPdfDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Solo se aceptan archivos PDF');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const uploaded = await uploadFileToDriveInChunks({
        file,
        sessionEndpoint: `/api/admin/convenios/${convenioId}/signed-pdf/resumable-session`,
        onProgress: ({ progress }) => setUploadProgress(progress),
      });

      const response = await fetch(`/api/admin/convenios/${convenioId}/signed-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driveFileId: uploaded.id,
          webViewLink: uploaded.webViewLink,
          webContentLink: uploaded.webContentLink,
          fileName: file.name,
          fileSize: file.size,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Error al registrar el PDF firmado');
      }

      setUploadProgress(100);
      setUploadSuccess(true);
      
      // Recargar la p?gina despu?s de 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadIcon className="h-5 w-5 text-green-600" />
            Subir PDF Firmado
          </DialogTitle>
          <DialogDescription>
            Sube el convenio firmado en formato PDF para el convenio:
            <span className="font-medium block mt-1">{convenioTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {uploadSuccess ? (
          <div className="py-8 flex flex-col items-center gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <p className="text-center text-green-600 font-medium">
              ¡PDF firmado subido exitosamente!
            </p>
            <p className="text-sm text-muted-foreground">
              Recargando página...
            </p>
          </div>
        ) : (
          <>
            {existingSignedPdfPath && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  ⚠️ Este convenio ya tiene un PDF firmado. Si subes uno nuevo, reemplazará el anterior.
                </p>
                <a 
                  href={existingSignedPdfPath} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                >
                  Ver PDF actual
                </a>
              </div>
            )}

            <div className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  file ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-primary'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileIcon className="h-10 w-10 text-green-600" />
                    <p className="font-medium text-green-700 dark:text-green-400">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {isUploading && (
                      <div className="mt-2 h-2 w-56 overflow-hidden rounded-full bg-green-100 dark:bg-green-950">
                        <div
                          className="h-full bg-green-600 transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                    {isUploading && (
                      <p className="text-xs text-green-600 dark:text-green-400">Subiendo {uploadProgress}%</p>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Cambiar archivo
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <UploadIcon className="h-10 w-10 text-muted-foreground" />
                    <p className="font-medium">Haz clic para seleccionar</p>
                    <p className="text-xs text-muted-foreground">o arrastra un archivo PDF</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Subir PDF
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
