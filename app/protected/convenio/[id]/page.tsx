"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  FileIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon, 
  SaveIcon, 
  CheckCircleIcon,
  PlusIcon,
  Trash2Icon,
  EyeIcon,
  CornerDownRightIcon,
  PaperclipIcon,
  FileTextIcon,
  UploadIcon
} from "lucide-react";

// Componente para el stepper
const Stepper = ({ currentStep, onStepChange }: { currentStep: number, onStepChange?: (step: number) => void }) => {
  const steps = [
    { id: 1, label: "Datos básicos" },
    { id: 2, label: "Partes" },
    { id: 3, label: "Cláusulas" },
    { id: 4, label: "Anexos" },
    { id: 5, label: "Revisión" },
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between relative">
        {/* Línea conectora */}
        <div className="absolute top-[15px] left-0 w-full h-[2px] bg-slate-800" />
        <div 
          className="absolute top-[15px] left-0 h-[2px] bg-blue-600 transition-all duration-500 ease-in-out" 
          style={{ width: `${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100)}%` }}
        />
        
        {/* Steps */}
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={`flex flex-col items-center relative z-10 ${onStepChange ? 'cursor-pointer' : ''}`}
            onClick={() => onStepChange && onStepChange(step.id)}
          >
            <div 
              className={`
                w-8 h-8 rounded-full flex items-center justify-center mb-1 border transition-all
                ${currentStep === step.id 
                  ? 'bg-blue-600 text-white border-blue-600 scale-110 shadow-lg shadow-blue-500/30' 
                  : currentStep > step.id 
                    ? 'bg-blue-950 text-blue-400 border-blue-600'
                    : 'bg-slate-900 text-slate-500 border-slate-700'
                }
              `}
            >
              {currentStep > step.id ? (
                <CheckCircleIcon className="w-5 h-5" />
              ) : (
                <span className="font-medium">{step.id}</span>
              )}
            </div>
            <span className={`text-xs ${currentStep === step.id ? 'text-white font-semibold' : 'text-slate-400'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para el formulario de datos básicos
const DatosBasicosForm = ({ onDataChange }: { onDataChange?: (data: any) => void }) => {
  // Simulamos cambios en los datos con una función
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (onDataChange) {
      onDataChange({ [e.target.id]: e.target.value });
    }
  };

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-left duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Datos Básicos del Convenio</h2>
        <p className="text-slate-400">Información general y propósito del convenio.</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="titulo" className="block text-sm font-medium mb-2">
            Título del convenio <span className="text-red-500">*</span>
          </label>
          <input
            id="titulo"
            type="text"
            placeholder="Ej: Convenio de colaboración entre UTN y Empresa..."
            className="w-full px-4 py-3 bg-slate-900 text-white rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
            onChange={handleChange}
          />
          <p className="text-xs text-slate-400 mt-1">
            El título debe ser claro y descriptivo.
          </p>
        </div>
        
        <div>
          <label htmlFor="fecha" className="block text-sm font-medium mb-2">
            Fecha <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="fecha"
              type="text"
              placeholder="dd/mm/aaaa"
              className="w-full px-4 py-3 bg-slate-900 text-white rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
              onChange={handleChange}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="duracion" className="block text-sm font-medium mb-2">
              Duración del convenio <span className="text-red-500">*</span>
            </label>
            <input
              id="duracion"
              type="number"
              placeholder="Duración"
              min="1"
              className="w-full px-4 py-3 bg-slate-900 text-white rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="unidad-tiempo" className="block text-sm font-medium mb-2">
              Unidad de tiempo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="unidad-tiempo"
                className="w-full appearance-none bg-slate-900 text-white px-4 py-3 rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                onChange={handleChange}
              >
                <option value="dias">Días</option>
                <option value="meses">Meses</option>
                <option value="años">Años</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium mb-2">
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            id="descripcion"
            rows={5}
            placeholder="Breve descripción del objetivo del convenio..."
            className="w-full px-4 py-3 bg-slate-900 text-white rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors resize-none"
            onChange={handleChange}
          ></textarea>
          <p className="text-xs text-slate-400 mt-1">
            Describe brevemente el propósito y alcance del convenio. Máximo 500 caracteres.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 pt-2">
          <input
            id="confidencial"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-600/20"
          />
          <label htmlFor="confidencial" className="text-sm text-slate-400 font-medium">
            Marcar como confidencial
          </label>
        </div>
      </div>
    </div>
  );
};

// Componente para partes involucradas (Step 2)
const PartesForm = ({ onDataChange }: { onDataChange?: (data: any) => void }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Partes Involucradas</h2>
        <p className="text-slate-400">Información de las organizaciones que participan en el convenio.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="border border-slate-700 p-6 rounded-md bg-slate-900/80 hover:bg-slate-900 transition-colors duration-200">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            Universidad Tecnológica Nacional (UTN)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Representante legal</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-900 text-white rounded-md border border-slate-700"
                value="Ing. Oscar Pascal"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cargo</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-900 text-white rounded-md border border-slate-700"
                value="Decano"
                readOnly
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Dirección</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-900 text-white rounded-md border border-slate-700"
                value="French 414, Resistencia, Chaco"
                readOnly
              />
            </div>
          </div>
        </div>
        
        <div className="border border-slate-700 p-6 rounded-md bg-slate-900/80 hover:bg-slate-900 transition-colors duration-200">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            Contraparte
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre de la organización <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-900 text-white rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                placeholder="Nombre de empresa o institución"
                onChange={(e) => onDataChange && onDataChange({ organizacion: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Representante legal <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-900 text-white rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  placeholder="Nombre y apellido"
                  onChange={(e) => onDataChange && onDataChange({ representante: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cargo <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-900 text-white rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  placeholder="Cargo del representante"
                  onChange={(e) => onDataChange && onDataChange({ cargo: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dirección <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-900 text-white rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                placeholder="Dirección completa"
                onChange={(e) => onDataChange && onDataChange({ direccion: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para cláusulas (Step 3)
const ClausulasForm = ({ onDataChange }: { onDataChange?: (data: any) => void }) => {
  const [clausulas, setClausulas] = useState([
    { id: 1, titulo: "Objeto", contenido: "El presente convenio tiene por objeto establecer relaciones de complementación y cooperación académica, científica y cultural entre las partes." },
    { id: 2, titulo: "Obligaciones de las partes", contenido: "Para el logro del objetivo señalado, las partes se comprometen a:" },
    { id: 3, titulo: "Plazo de ejecución", contenido: "El presente convenio tendrá una duración de 12 meses a partir de la fecha de su firma." }
  ]);

  const handleAddClausula = () => {
    const newId = clausulas.length > 0 ? Math.max(...clausulas.map(c => c.id)) + 1 : 1;
    const newClausula = { 
      id: newId, 
      titulo: `Nueva Cláusula ${newId}`, 
      contenido: "" 
    };
    
    setClausulas([...clausulas, newClausula]);
    
    if (onDataChange) {
      onDataChange({ clausulas: [...clausulas, newClausula] });
    }
  };

  const handleRemoveClausula = (id: number) => {
    const updatedClausulas = clausulas.filter(clausula => clausula.id !== id);
    setClausulas(updatedClausulas);
    
    if (onDataChange) {
      onDataChange({ clausulas: updatedClausulas });
    }
  };

  const handleClausulaChange = (id: number, field: 'titulo' | 'contenido', value: string) => {
    const updatedClausulas = clausulas.map(clausula => 
      clausula.id === id ? { ...clausula, [field]: value } : clausula
    );
    
    setClausulas(updatedClausulas);
    
    if (onDataChange) {
      onDataChange({ clausulas: updatedClausulas });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Cláusulas</h2>
        <p className="text-slate-400">Define las cláusulas que formarán parte del convenio.</p>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-md font-medium text-slate-400">Total: {clausulas.length} cláusulas</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddClausula}
          className="flex items-center gap-1 border-dashed border-slate-700 hover:bg-slate-800 text-white"
        >
          <PlusIcon className="h-4 w-4" /> 
          Agregar cláusula
        </Button>
      </div>
      
      <div className="space-y-6">
        {clausulas.map((clausula) => (
          <div 
            key={clausula.id} 
            className="border border-slate-700 p-5 rounded-md bg-slate-900/80 hover:bg-slate-900 transition-colors duration-200"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 w-full">
                <div className="p-2 rounded-full bg-amber-900/20 text-amber-500">
                  <CornerDownRightIcon className="h-4 w-4" />
                </div>
                <input
                  className="font-medium text-md border-0 bg-transparent focus:ring-0 w-full focus:outline-none text-white"
                  value={clausula.titulo}
                  onChange={(e) => handleClausulaChange(clausula.id, 'titulo', e.target.value)}
                  placeholder="Título de la cláusula"
                />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                onClick={() => handleRemoveClausula(clausula.id)}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
            <textarea
              className="w-full px-4 py-3 bg-slate-950 text-white border border-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors rounded-md h-32 resize-none"
              placeholder="Describa el contenido de esta cláusula..."
              value={clausula.contenido}
              onChange={(e) => handleClausulaChange(clausula.id, 'contenido', e.target.value)}
            ></textarea>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para anexos (Step 4)
const AnexosForm = ({ onDataChange }: { onDataChange?: (data: any) => void }) => {
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
    
    if (onDataChange) {
      onDataChange({ anexos: [...anexos, nuevoAnexo] });
    }
  };

  const handleRemoveAnexo = (id: number) => {
    const updatedAnexos = anexos.filter(anexo => anexo.id !== id);
    setAnexos(updatedAnexos);
    
    if (onDataChange) {
      onDataChange({ anexos: updatedAnexos });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Anexos</h2>
        <p className="text-slate-400">Adjunta los documentos anexos que complementan este convenio.</p>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-md font-medium text-slate-400">
            Total: {anexos.length} anexo{anexos.length !== 1 ? 's' : ''}
          </h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddAnexo}
          className="flex items-center gap-1 border-dashed border-slate-700 hover:bg-slate-800 text-white"
        >
          <UploadIcon className="h-4 w-4" /> 
          Subir anexo
        </Button>
      </div>
      
      <div className="border-2 border-dashed rounded-md p-10 bg-slate-950/30 hover:bg-slate-950/50 transition-colors cursor-pointer">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <UploadIcon className="h-6 w-6" />
          </div>
          <h3 className="font-medium">Arrastra archivos aquí o haz clic para seleccionar</h3>
          <p className="text-slate-400 text-sm">
            Puedes subir archivos PDF, DOC, DOCX o JPG (máx. 10MB)
          </p>
        </div>
      </div>
      
      {anexos.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="font-medium">Anexos adjuntos</h3>
          <div className="border rounded-md divide-y">
            {anexos.map((anexo) => (
              <div 
                key={anexo.id} 
                className="p-4 flex items-center justify-between hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-500">
                    <FileTextIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{anexo.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {anexo.tamano} • Subido el {anexo.fecha}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
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

// Componente para revisión final (Step 5)
const RevisionForm = ({ onDataChange }: { onDataChange?: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    titulo: "Convenio de pasantías UTN - Tech Solutions",
    fecha: "06/04/2023",
    duracion: "12 meses",
    organizacion: "Tech Solutions",
    representante: "Lic. María González",
    cargo: "Directora de RRHH",
    direccion: "Av. Siempre Viva 123, Resistencia",
    clausulas: [
      { id: 1, titulo: "Objeto", contenido: "El presente convenio tiene por objeto..." },
      { id: 2, titulo: "Obligaciones de las partes", contenido: "Para el logro del objetivo señalado..." },
      { id: 3, titulo: "Plazo de ejecución", contenido: "El presente convenio tendrá una duración..." }
    ],
    anexos: [
      { id: 1, nombre: "Anexo_Técnico.pdf", tamano: "845 KB" }
    ],
    observaciones: ""
  });
  
  const handleObservacionesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const observaciones = e.target.value;
    setFormData({...formData, observaciones});
    if (onDataChange) {
      onDataChange({ observaciones });
    }
  };
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Revisión Final</h2>
        <p className="text-slate-400">Revisa toda la información del convenio antes de enviarlo.</p>
      </div>
      
      <div className="space-y-6">
        <div className="border border-slate-700 p-6 rounded-md bg-slate-900/80 hover:bg-slate-900 transition-colors duration-200">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500">
              <FileIcon className="h-5 w-5" />
            </div>
            Información básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <p className="text-slate-400">Título:</p>
              <p className="font-medium">{formData.titulo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400">Fecha:</p>
              <p className="font-medium">{formData.fecha}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400">Duración:</p>
              <p className="font-medium">{formData.duracion}</p>
            </div>
          </div>
        </div>
        
        <div className="border border-slate-700 p-6 rounded-md bg-slate-900/80 hover:bg-slate-900 transition-colors duration-200">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            Partes involucradas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <p className="font-medium border-b pb-1">UTN</p>
              <div className="space-y-1">
                <p className="text-slate-400">Representante:</p>
                <p>Ing. Oscar Pascal</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400">Cargo:</p>
                <p>Decano</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400">Dirección:</p>
                <p>French 414, Resistencia, Chaco</p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="font-medium border-b pb-1">{formData.organizacion}</p>
              <div className="space-y-1">
                <p className="text-slate-400">Representante:</p>
                <p>{formData.representante}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400">Cargo:</p>
                <p>{formData.cargo}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400">Dirección:</p>
                <p>{formData.direccion}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border border-slate-700 p-6 rounded-md bg-slate-900/80 hover:bg-slate-900 transition-colors duration-200">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-500">
              <CornerDownRightIcon className="h-5 w-5" />
            </div>
            Cláusulas verificadas ({formData.clausulas.length})
          </h3>
          <ul className="space-y-2 text-sm">
            {formData.clausulas.map((clausula: { id: number, titulo: string }, index: number) => (
              <li key={clausula.id} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium">{index + 1}</span>
                </div>
                <span>{clausula.titulo}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="border border-slate-700 p-6 rounded-md bg-slate-900/80 hover:bg-slate-900 transition-colors duration-200">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            Anexos adjuntos ({formData.anexos.length})
          </h3>
          <ul className="space-y-2 text-sm">
            {formData.anexos.map((anexo: { id: number, nombre: string, tamano: string }) => (
              <li key={anexo.id} className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-50 dark:bg-blue-900/10 text-blue-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <span>{anexo.nombre}</span>
                <span className="text-xs text-slate-400">({anexo.tamano})</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="border border-slate-700 p-6 rounded-md bg-slate-900/80 hover:bg-slate-900 transition-colors duration-200">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
              </svg>
            </div>
            Observaciones adicionales
          </h3>
          <textarea
            className="w-full px-4 py-3 bg-slate-950 text-white border border-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors rounded-md h-28 resize-none"
            placeholder="Agregue cualquier observación o nota adicional sobre el convenio..."
            value={formData.observaciones}
            onChange={handleObservacionesChange}
          ></textarea>
        </div>
        
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-md">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded-full bg-primary/20 text-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Importante:</p>
              <p className="text-sm text-slate-400">
                Una vez enviado, el convenio será remitido para revisión y no podrá ser modificado hasta que sea aprobado o rechazado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para la vista previa del documento
const DocumentoPreview = ({ formData }: { formData: any }) => {
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
    <div className="bg-slate-950 text-white p-8 border border-slate-800 rounded-md max-h-[650px] overflow-y-auto shadow-md">
      <div className="flex justify-center mb-6">
        <svg width="80" height="80" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M60 14L74.5 28.5H104.5V90.5H15.5V28.5H45.5L60 14Z" className="fill-blue-600" />
          <path d="M36 48.5H84M36 68.5H84M36 88.5H66" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold uppercase tracking-wide text-white">
          {titulo}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Universidad Tecnológica Nacional - Facultad Regional Resistencia y {organizacion}
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-md font-semibold mb-2 text-blue-400">PARTES INTERVINIENTES</h2>
        <div className="pl-4 text-sm space-y-4 text-slate-300">
          <p>
            <span className="font-medium text-white">Por una parte:</span> la UNIVERSIDAD TECNOLÓGICA NACIONAL – FACULTAD REGIONAL RESISTENCIA, representada en este acto por el Sr. Decano, Ing. José Leandro BASTERRA, con domicilio legal en French 414 de la ciudad de Resistencia, Chaco, en adelante "LA FACULTAD".
          </p>
          <p>
            <span className="font-medium text-white">Por la otra parte:</span> {organizacion}, representada en este acto por {representante}, con domicilio legal en [...], en adelante "LA ORGANIZACIÓN".
          </p>
        </div>
      </div>
      
      <div className="space-y-6 text-sm text-slate-300">
        <p className="font-medium text-white">
          Las partes celebran el presente convenio y acuerdan las siguientes cláusulas:
        </p>
        
        {clausulas.map((clausula: { id: number; titulo: string; contenido: string }, index: number) => (
          <div className="mb-6" key={clausula.id}>
            <p className="font-bold mb-2 text-blue-400">{`${index + 1 === 1 ? 'PRIMERA' : index + 1 === 2 ? 'SEGUNDA' : index + 1 === 3 ? 'TERCERA' : index + 1 === 4 ? 'CUARTA' : index + 1 === 5 ? 'QUINTA' : index + 1 === 6 ? 'SEXTA' : index + 1 === 7 ? 'SÉPTIMA' : index + 1 === 8 ? 'OCTAVA' : index + 1 === 9 ? 'NOVENA' : `CLÁUSULA ${index + 1}`}: ${clausula.titulo.toUpperCase()}`}</p>
            <p>{clausula.contenido}</p>
          </div>
        ))}
        
        <div className="mt-12 grid grid-cols-2 gap-20 pt-16 text-center">
          <div>
            <p className="border-t border-slate-700 pt-2">Por UTN-FRRe</p>
            <p className="font-medium mt-1 text-white">Ing. José Leandro BASTERRA</p>
            <p className="text-xs text-slate-400">Decano</p>
          </div>
          <div>
            <p className="border-t border-slate-700 pt-2">Por {organizacion}</p>
            <p className="font-medium mt-1 text-white">{representante}</p>
            <p className="text-xs text-slate-400">Representante</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal de la página
export default function ConvenioPage({ params }: { params: Promise<{ id: string }> }) {
  // Usar React.use para acceder a todos los parámetros
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Datos iniciales del formulario
    titulo: "",
    organizacion: "",
    representante: "",
    clausulas: [],
    anexos: [],
    observaciones: ""
  });

  // Maneja el cambio de step en el stepper
  const handleStepChange = (step: number) => {
    if (step >= 1 && step <= 5) {
      setCurrentStep(step);
    }
  };

  // Maneja los cambios en el formulario
  const handleFormDataChange = (data: any) => {
    setFormData({
      ...formData,
      ...data
    });
  };

  // Renderiza el componente correspondiente según el step actual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <DatosBasicosForm onDataChange={handleFormDataChange} />;
      case 2:
        return <PartesForm onDataChange={handleFormDataChange} />;
      case 3:
        return <ClausulasForm onDataChange={handleFormDataChange} />;
      case 4:
        return <AnexosForm onDataChange={handleFormDataChange} />;
      case 5:
        return <RevisionForm onDataChange={handleFormDataChange} />;
      default:
        return <DatosBasicosForm onDataChange={handleFormDataChange} />;
    }
  };

  // Función para el envío final del convenio
  const handleSubmit = () => {
    console.log("Convenio enviado:", formData);
    // Aquí iría la lógica para guardar en base de datos
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Fondo con patrón de puntos estático */}
      <div className="fixed inset-0 -z-10">
        <svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>
          <defs>
            <pattern id='pattern' width='40' height='40' patternUnits='userSpaceOnUse'>
              <circle cx='20' cy='20' r='0.5' fill='currentColor' className="text-slate-700" />
            </pattern>
            <pattern id='pattern2' width='80' height='80' patternUnits='userSpaceOnUse'>
              <circle cx='40' cy='40' r='1' fill='currentColor' className="text-slate-600" />
            </pattern>
          </defs>
          <rect width='100%' height='100%' fill='url(#pattern)' />
          <rect width='100%' height='100%' fill='url(#pattern2)' />
        </svg>
      </div>
      
      <div className="container max-w-full px-6 py-8 space-y-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Columna izquierda - Stepper y Formulario */}
          <div className="w-full lg:w-2/3 xl:w-3/4 space-y-6">
            {/* Encabezado */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {id === "nuevo" ? "Nuevo Convenio" : `Editar Convenio #${id}`}
                </h1>
                <p className="text-slate-400">
                  {currentStep === 5 
                    ? "Revisa toda la información antes de enviar" 
                    : "Completa la información del convenio paso a paso"}
                </p>
              </div>
              {currentStep === 5 && (
                <Button 
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={handleSubmit}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Finalizar y enviar
                </Button>
              )}
            </div>

            {/* Stepper */}
            <div className="sticky top-0 bg-black/95 backdrop-blur-sm pt-4 pb-4 z-40 -mx-6 px-6 border-b border-slate-800">
              <Stepper 
                currentStep={currentStep} 
                onStepChange={handleStepChange} 
              />
            </div>

            {/* Formulario del paso actual */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-lg shadow-lg backdrop-blur-sm">
              {renderStep()}
            </div>

            {/* Navegación entre pasos */}
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => handleStepChange(currentStep - 1)}
                disabled={currentStep === 1}
                className="gap-2 border-slate-700 hover:bg-slate-800"
              >
                <ChevronLeftIcon className="h-4 w-4" /> 
                Anterior
              </Button>
              {currentStep < 5 ? (
                <Button 
                  onClick={() => handleStepChange(currentStep + 1)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  Siguiente <ChevronRightIcon className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={handleSubmit}
                >
                  <SaveIcon className="h-4 w-4" />
                  Guardar borrador
                </Button>
              )}
            </div>
          </div>

          {/* Columna derecha - Vista previa */}
          <div className="w-full lg:w-1/3 xl:w-1/4 sticky top-20">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-lg shadow-lg backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">Vista previa</h2>
              <DocumentoPreview formData={formData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 