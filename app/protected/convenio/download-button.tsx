'use client';

import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/app/lib/utils/api";

export function DownloadButton() {
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

  const handleDownload = async () => {
    try {
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

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'convenio.docx';
      a.click();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Button onClick={handleDownload}>
      Generar Documento de Prueba
    </Button>
  );
} 