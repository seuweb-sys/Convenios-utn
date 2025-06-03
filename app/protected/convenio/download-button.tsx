'use client';

import { Button } from "@/app/components/ui/button";
import { getApiUrl } from "@/app/lib/utils/api";
import { useState } from "react";

export function DownloadButton() {
  const [fileId, setFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testFields = [
    { key: 'entidad_nombre', value: 'Empresa Ejemplo S.A.' },
    { key: 'entidad_tipo', value: 'EMPRESA' },
    { key: 'entidad_domicilio', value: 'Calle Principal 123' },
    { key: 'entidad_ciudad', value: 'Resistencia' },
    { key: 'entidad_cuit', value: '30-12345678-9' },
    { key: 'entidad_representante', value: 'Juan Pérez' },
    { key: 'entidad_dni', value: '12.345.678' },
    { key: 'entidad_cargo', value: 'Director' },
    { key: 'dia', value: '23' },
    { key: 'mes', value: 'marzo' }
  ];

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(getApiUrl('/api/generate-doc'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: 2,
          fields: testFields
        })
      });

      if (!response.ok) {
        throw new Error('Error al generar el documento');
      }

      // Verificar si la respuesta es JSON (subida exitosa a Drive)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        setFileId(data.fileId);
        // Abrir el documento en Drive
        window.open(data.webViewLink, '_blank');
      } else {
        // Si no es JSON, es el documento para descargar
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'convenio.docx';
        a.click();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!fileId) return;

    try {
      setIsLoading(true);
      const response = await fetch(getApiUrl('/api/convenio/approve'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId })
      });

      if (!response.ok) {
        throw new Error('Error al aprobar el convenio');
      }

      setFileId(null);
      alert('Convenio aprobado exitosamente');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-4">
      <Button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? 'Generando...' : 'Generar Documento de Prueba'}
      </Button>
      {fileId && (
        <Button onClick={handleApprove} disabled={isLoading} variant="outline">
          {isLoading ? 'Aprobando...' : 'Aprobar Convenio'}
        </Button>
      )}
    </div>
  );
} 