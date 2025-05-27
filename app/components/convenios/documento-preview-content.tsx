"use client";

import React from 'react';

type ConvenioData = {
  entidad_nombre?: string;
  entidad_tipo?: string;
  entidad_domicilio?: string;
  entidad_ciudad?: string;
  entidad_cuit?: string;
  entidad_representante?: string;
  entidad_dni?: string;
  entidad_cargo?: string;
  dia?: string;
  mes?: string;
  [key: string]: any;
};

interface DocumentoPreviewContentProps {
  data: ConvenioData;
  type: 'marco' | 'especifico';
}

export const DocumentoPreviewContent = ({ data, type }: DocumentoPreviewContentProps) => {
  // Verificar si tenemos datos
  const hasData = Object.keys(data || {}).length > 0;
  
  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No hay datos disponibles para previsualizar.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <div className="p-8 space-y-6 font-serif text-sm">
        <div className="text-center mb-8">
          <p className="mb-2 text-xs uppercase tracking-wider">{"2025 – Año de la Reconstrucción de la Nación Argentina"}</p>
          <h1 className="text-2xl font-bold uppercase mb-4">CONVENIO MARCO</h1>
          <p className="uppercase whitespace-pre-line mb-2">ENTRE {data.entidad_nombre || '________________'}</p>
          <p className="uppercase mb-2">Y LA FACULTAD REGIONAL RESISTENCIA</p>
          <p className="uppercase">DE LA UNIVERSIDAD TECNOLÓGICA NACIONAL</p>
      </div>
      
        <p className="text-justify leading-relaxed">
          Entre {data.entidad_nombre || '________________'}, en adelante "LA {data.entidad_tipo || '____'}", con domicilio en {data.entidad_domicilio || '________________'} de la Ciudad de {data.entidad_ciudad || '________________'}, CUIT Nº {data.entidad_cuit || '________________'}, representado en este acto por {data.entidad_representante || '________________'}, DNI Nº {data.entidad_dni || '________________'}, en su carácter de {data.entidad_cargo || '________________'}, y la FACULTAD REGIONAL RESISTENCIA de la UNIVERSIDAD TECNOLÓGICA NACIONAL, con domicilio en calle French 414 de la ciudad de Resistencia, en adelante "LA FACULTAD", representada en este acto por su Decano el Ing. Jorge Alejandro De Pedro, DNI 23.730.513, ad referéndum del Señor Rector Ing. Rubén Soro, DNI Nº 16.014.284, y teniendo en cuenta:
        </p>

        <p className="text-justify leading-relaxed">
          Que "LA FACULTAD" dispone de los recursos humanos y la infraestructura necesaria para brindar servicios especializados en las áreas de Ingeniería, Gestión y Otras, mediante la implementación de acciones coordinadas que aseguren el máximo aprovechamiento de recursos humanos y tecnológicos.
        </p>

        <p className="text-justify leading-relaxed">
          Que toda acción de colaboración representa un aporte ventajoso al proceso de integración científico-tecnológico de estas instituciones con objetivos comunes, orientados al desarrollo de la región.
        </p>

        <p className="text-justify leading-relaxed">
          Que el objeto del presente convenio es la mutua cooperación entre las partes para desarrollar todas aquellas actividades que contribuyan al mejor cumplimiento de los fines de los signatarios y que permitan prestar servicios a la comunidad de sus respectivas jurisdicciones o áreas de influencia.
        </p>

        <p className="text-justify leading-relaxed">
          Por todo ello, se acuerda suscribir el presente CONVENIO MARCO DE COOPERACION Y ASISTENCIA TÉCNICA que se regirá por las cláusulas siguientes:
        </p>

        {/* Cláusulas aquí - resumidas para mantener la claridad */}
        <div className="space-y-4">
          <div>
            <p className="font-bold">PRIMERA:</p>
            <p className="text-justify leading-relaxed">
              "LA FACULTAD" y "LA {data.entidad_tipo || '____'}" en función de lo expresado, por vía de una concertación de acciones, esfuerzos y voluntades, que tiendan a la consecución de los objetivos expresados, convienen desarrollar un Programa de Cooperación y Asistencia Técnica, en el ámbito provincial para generar conocimientos, desarrollo tecnológico y transferencia de tecnologías que satisfagan metas acordadas de común acuerdo.
            </p>
          </div>
          
          {/* Se pueden agregar más cláusulas si es necesario */}
          
          <div>
            <p className="font-bold">DÉCIMO TERCERA:</p>
            <p className="text-justify leading-relaxed">
              El presente Convenio tendrá una duración de tres (3) años a partir de la fecha de su firma y se renovará automáticamente a su vencimiento por única vez y por igual período, salvo que fuere expresamente denunciado.
            </p>
          </div>
        </div>

        <p className="text-justify leading-relaxed mt-8">
          En prueba de conformidad, las partes firman tres (3) ejemplares del mismo tenor, en la ciudad de Resistencia, Provincia de Chaco, a los {data.dia || '__'} días del mes de {data.mes || '__________'} de 2025.
        </p>
      </div>
    </div>
  );
};

export default DocumentoPreviewContent;
