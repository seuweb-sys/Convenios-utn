import React from "react";

interface DocumentoPreviewContentProps {
  formData: any;
  isFullScreen?: boolean;
}

export const DocumentoPreviewContent = ({ formData, isFullScreen = false }: DocumentoPreviewContentProps) => {
  // Extraer datos del formulario o usar valores por defecto
  const {
    titulo = "Convenio Marco de Colaboración",
    organizacion = "Nombre de la Organización",
    representante = "Nombre del Representante", 
    clausulas = [
      { id: 1, titulo: "Objeto", contenido: "El presente convenio tiene por objeto establecer relaciones de complementación y cooperación académica, científica y cultural entre las partes." },
      { id: 2, titulo: "Obligaciones de las partes", contenido: "Para el logro del objetivo señalado, las partes se comprometen a:" },
      { id: 3, titulo: "Plazo de ejecución", contenido: "El presente convenio tendrá una duración de 12 meses a partir de la fecha de su firma." }
    ],
  } = formData;

  return (
    <>
      <div className="flex justify-center mb-6">
        <svg width="50" height="50" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={isFullScreen ? "w-16 h-16" : ""}>
          <path d="M60 14L74.5 28.5H104.5V90.5H15.5V28.5H45.5L60 14Z" className="fill-primary" />
          <path d="M36 48.5H84M36 68.5H84M36 88.5H66" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      
      <div className="text-center mb-8">
        <h1 className={`${isFullScreen ? "text-2xl" : "text-xl"} font-bold uppercase tracking-wide text-black`}>
          {titulo}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Universidad Tecnológica Nacional - Facultad Regional Resistencia y {organizacion}
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-md font-semibold mb-3 text-primary">PARTES INTERVINIENTES</h2>
        <div className="pl-4 text-sm space-y-4 text-black">
          <p>
            <span className="font-medium">Por una parte:</span> la UNIVERSIDAD TECNOLÓGICA NACIONAL – FACULTAD REGIONAL RESISTENCIA, representada en este acto por el Sr. Decano, Ing. José Leandro BASTERRA, con domicilio legal en French 414 de la ciudad de Resistencia, Chaco, en adelante "LA FACULTAD".
          </p>
          <p>
            <span className="font-medium">Por la otra parte:</span> {organizacion}, representada en este acto por {representante}, con domicilio legal en [...], en adelante "LA ORGANIZACIÓN".
          </p>
        </div>
      </div>
      
      <div className="space-y-6 text-sm text-black">
        <p className="font-medium">
          Las partes celebran el presente convenio y acuerdan las siguientes cláusulas:
        </p>
        
        {clausulas.map((clausula: { id: number; titulo: string; contenido: string }, index: number) => (
          <div className="mb-6" key={clausula.id}>
            <p className="font-bold mb-2 text-primary">{`${index + 1 === 1 ? 'PRIMERA' : index + 1 === 2 ? 'SEGUNDA' : index + 1 === 3 ? 'TERCERA' : index + 1 === 4 ? 'CUARTA' : index + 1 === 5 ? 'QUINTA' : index + 1 === 6 ? 'SEXTA' : index + 1 === 7 ? 'SÉPTIMA' : index + 1 === 8 ? 'OCTAVA' : index + 1 === 9 ? 'NOVENA' : `CLÁUSULA ${index + 1}`}: ${clausula.titulo.toUpperCase()}`}</p>
            <p>{clausula.contenido}</p>
          </div>
        ))}
        
        <div className="mt-12 grid grid-cols-2 gap-20 pt-16 text-center">
          <div>
            <p className="border-t border-gray-300 pt-2">Por UTN-FRRe</p>
            <p className="font-medium mt-1 text-black">Ing. José Leandro BASTERRA</p>
            <p className="text-xs text-gray-600">Decano</p>
          </div>
          <div>
            <p className="border-t border-gray-300 pt-2">Por {organizacion}</p>
            <p className="font-medium mt-1 text-black">{representante}</p>
            <p className="text-xs text-gray-600">Representante</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentoPreviewContent;
