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
  UploadIcon,
  MaximizeIcon,
  MinimizeIcon,
  ZoomInIcon,
  ZoomOutIcon,
  XIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon
} from "lucide-react";

// Mantener esta sección de código
const commonInputStyles = `
  w-full px-4 py-2.5 
  bg-card/50
  border border-border/60
  text-foreground
  rounded-md 
  placeholder-muted-foreground
  focus:border-primary/30
  focus:ring-1 
  focus:ring-primary/20
  focus:ring-offset-0 
  transition-colors
  hover:border-border
`;

const commonCardStyles = `
  border border-border/60
  rounded-lg
  bg-card/80
  backdrop-blur-sm
  hover:border-primary/30
  hover:shadow-sm
  transition-all 
  duration-200
`;

const commonLabelStyles = `
  block 
  text-sm 
  font-medium 
  mb-1.5 
  text-foreground/80
`;

// Un stepper tradicional con línea continua detrás de los círculos
const Stepper = ({ currentStep, onStepChange }: { currentStep: number, onStepChange?: (step: number) => void }) => {
  const steps = [
    { id: 1, label: "Datos básicos" },
    { id: 2, label: "Partes" },
    { id: 3, label: "Cláusulas" },
    { id: 4, label: "Anexos" },
    { id: 5, label: "Revisión" },
  ];

  return (
    <div className="relative py-8">
      {/* Línea base continua (gris) */}
      <div className="absolute h-[2px] bg-white/20 left-0 right-0 top-[18px]"></div>
      
      {/* Línea de progreso (azul) */}
      <div 
        className="absolute h-[2px] bg-blue-500 left-0 top-[18px] transition-all duration-300"
        style={{ 
          width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
        }}
      ></div>

      {/* Pasos con círculos */}
      <div className="flex justify-between relative">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className="flex flex-col items-center"
            onClick={() => onStepChange && onStepChange(step.id)}
          >
            <div 
              className={`
                w-7 h-7 rounded-full flex items-center justify-center mb-2 transition-colors
                ${currentStep > step.id 
                  ? 'bg-blue-500 text-white' 
                  : currentStep === step.id 
                    ? 'bg-blue-500 text-white'
                    : 'bg-black/10 border border-white/20 text-white/60'
                }
              `}
            >
              {currentStep > step.id ? (
                <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-xs font-medium">{step.id}</span>
              )}
            </div>
            <span className={`text-xs ${currentStep === step.id ? 'text-white' : 'text-white/60'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Header mejorado para el editor de convenio
const ConvenioHeader = ({ title, subtitle }: { title: string, subtitle: string }) => {
  return (
    <div className="mb-8 border-b border-border/40 pb-6">
      <div className="flex items-center justify-between mb-2">
        <Link
          href="/protected/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" /> 
          Volver al dashboard
        </Link>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
            <EyeIcon className="h-4 w-4" />
            <span>Vista previa</span>
          </button>
          <Button variant="outline" size="sm" className="gap-2 text-sm">
            <SaveIcon className="h-4 w-4" />
            Guardar borrador
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
};

// Mini-footer para navegación
const NavigationFooter = ({ 
  currentStep, 
  totalSteps, 
  onPrevious, 
  onNext, 
  onSubmit 
}: { 
  currentStep: number, 
  totalSteps: number, 
  onPrevious: () => void, 
  onNext: () => void, 
  onSubmit: () => void 
}) => {
  return (
    <div className="flex items-center justify-between border-t border-border/40 mt-8 pt-6">
      <div className="text-sm text-muted-foreground">
        Paso {currentStep} de {totalSteps}
      </div>
      
      <div className="flex gap-3">
        {currentStep > 1 && (
          <Button 
            variant="outline" 
            onClick={onPrevious}
            className="border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" /> 
            Anterior
          </Button>
        )}
        
        {currentStep < totalSteps ? (
          <Button 
            onClick={onNext}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Siguiente
            <ChevronRightIcon className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={onSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            Guardar convenio
          </Button>
        )}
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
    <div className="animate-in fade-in slide-in-from-left duration-500">
      <div className="mb-6 pb-4 border-b border-border/30">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/20 text-primary">
            <FileTextIcon className="h-5 w-5" />
          </div>
          Datos Básicos del Convenio
        </h2>
        <p className="text-muted-foreground text-sm">Información general y propósito del convenio.</p>
      </div>
      
      <div className="space-y-5">
        <div>
          <label htmlFor="titulo" className={commonLabelStyles}>
            Título del convenio <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="titulo"
              type="text"
              placeholder="Ej: Convenio de colaboración entre UTN y Empresa..."
              className={commonInputStyles}
              onChange={handleChange}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <FileTextIcon className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            El título debe ser claro y descriptivo.
          </p>
        </div>
        
        <div>
          <label htmlFor="fecha" className={commonLabelStyles}>
            Fecha <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="fecha"
              type="text"
              placeholder="dd/mm/aaaa"
              className={commonInputStyles}
              onChange={handleChange}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="duracion" className={commonLabelStyles}>
              Duración del convenio <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="duracion"
                type="number"
                placeholder="Duración"
                min="1"
                className={commonInputStyles}
                onChange={handleChange}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <ClockIcon className="h-4 w-4" />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="unidad-tiempo" className={commonLabelStyles}>
              Unidad de tiempo <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <select
                id="unidad-tiempo"
                className={`${commonInputStyles} appearance-none`}
                onChange={handleChange}
              >
                <option value="dias" className="bg-background text-foreground">Días</option>
                <option value="meses" className="bg-background text-foreground">Meses</option>
                <option value="años" className="bg-background text-foreground">Años</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center px-2 pointer-events-none">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="descripcion" className={commonLabelStyles}>
            Descripción <span className="text-destructive">*</span>
          </label>
          <textarea
            id="descripcion"
            rows={5}
            placeholder="Breve descripción del objetivo del convenio..."
            className={`${commonInputStyles} resize-none`}
            onChange={handleChange}
          ></textarea>
          <p className="text-xs text-muted-foreground mt-1.5">
            Describe brevemente el propósito y alcance del convenio. Máximo 500 caracteres.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 pt-2">
          <input
            id="confidencial"
            type="checkbox"
            className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary/30 focus:ring-offset-background focus:ring-1"
          />
          <label htmlFor="confidencial" className="text-sm text-muted-foreground font-medium select-none">
            Marcar como confidencial
          </label>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Importar datos
          </Button>
          
          <Button variant="outline" size="sm" className="bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 hover:text-amber-600">
            <PlusIcon className="h-4 w-4 mr-2" />
            Añadir referencias
          </Button>
          
          <Button variant="outline" size="sm" className="bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20 hover:text-green-600">
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Validar datos
          </Button>
        </div>
      </div>
    </div>
  );
};

// Componente para partes involucradas (Step 2)
const PartesForm = ({ onDataChange }: { onDataChange?: (data: any) => void }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Partes Involucradas</h2>
        <p className="text-muted-foreground text-sm">Información de las organizaciones que participan en el convenio.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className={`${commonCardStyles} p-6`}>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            Universidad Tecnológica Nacional (UTN)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Representante legal</label>
              <input
                type="text"
                className="w-full px-3 py-2.5 bg-muted/50 border border-border/50 text-muted-foreground rounded-md cursor-not-allowed"
                value="Ing. José Leandro BASTERRA"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Cargo</label>
              <input
                type="text"
                className="w-full px-3 py-2.5 bg-muted/50 border border-border/50 text-muted-foreground rounded-md cursor-not-allowed"
                value="Decano"
                readOnly
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Dirección</label>
              <input
                type="text"
                className="w-full px-3 py-2.5 bg-muted/50 border border-border/50 text-muted-foreground rounded-md cursor-not-allowed"
                value="French 414, Resistencia, Chaco"
                readOnly
              />
            </div>
          </div>
        </div>
        
        <div className={`${commonCardStyles} p-6`}>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            Contraparte
          </h3>
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className={commonLabelStyles}>Nombre de la organización <span className="text-destructive">*</span></label>
              <input
                type="text"
                className={commonInputStyles}
                placeholder="Nombre de empresa o institución"
                onChange={(e) => onDataChange && onDataChange({ organizacion: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={commonLabelStyles}>Representante legal <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  className={commonInputStyles}
                  placeholder="Nombre y apellido"
                  onChange={(e) => onDataChange && onDataChange({ representante: e.target.value })}
                />
              </div>
              <div>
                <label className={commonLabelStyles}>Cargo <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  className={commonInputStyles}
                  placeholder="Cargo del representante"
                  onChange={(e) => onDataChange && onDataChange({ cargo: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className={commonLabelStyles}>Dirección <span className="text-destructive">*</span></label>
              <input
                type="text"
                className={commonInputStyles}
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
    const newClausula = { id: newId, titulo: `Nueva Cláusula ${newId}`, contenido: "" };
    setClausulas([...clausulas, newClausula]);
    if (onDataChange) { onDataChange({ clausulas: [...clausulas, newClausula] }); }
  };

  const handleRemoveClausula = (id: number) => {
    const updatedClausulas = clausulas.filter(clausula => clausula.id !== id);
    setClausulas(updatedClausulas);
    if (onDataChange) { onDataChange({ clausulas: updatedClausulas }); }
  };

  const handleClausulaChange = (id: number, field: 'titulo' | 'contenido', value: string) => {
    const updatedClausulas = clausulas.map(clausula => clausula.id === id ? { ...clausula, [field]: value } : clausula);
    setClausulas(updatedClausulas);
    if (onDataChange) { onDataChange({ clausulas: updatedClausulas }); }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Cláusulas</h2>
        <p className="text-muted-foreground text-sm">Define las cláusulas que formarán parte del convenio.</p>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-md font-medium text-muted-foreground">Total: {clausulas.length} cláusulas</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddClausula}
          className="flex items-center gap-1 border-dashed border-border/60 bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        >
          <PlusIcon className="h-4 w-4" /> 
          Agregar cláusula
        </Button>
      </div>
      
      <div className="space-y-6">
        {clausulas.map((clausula) => (
          <div 
            key={clausula.id} 
            className={commonCardStyles}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 w-full mr-2">
                <div className="p-2 rounded-full bg-card text-muted-foreground flex-shrink-0">
                  <CornerDownRightIcon className="h-4 w-4" />
                </div>
                <input
                  className={`${commonInputStyles} font-medium text-lg border-0 bg-transparent focus:ring-0 focus:ring-offset-0 w-full focus:outline-none text-foreground placeholder-muted-foreground`}
                  value={clausula.titulo}
                  onChange={(e) => handleClausulaChange(clausula.id, 'titulo', e.target.value)}
                  placeholder="Título de la cláusula"
                />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                onClick={() => handleRemoveClausula(clausula.id)}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
            <textarea
              className={`${commonInputStyles} resize-none transition-colors placeholder-muted-foreground`}
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

// Componente para revisión final (Step 5)
const RevisionForm = ({ onDataChange, formData }: { onDataChange?: (data: any) => void, formData: any }) => {
  const handleObservacionesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const observaciones = e.target.value;
    onDataChange && onDataChange({ observaciones });
  };
  
  return (
    <div className="animate-in fade-in slide-in-from-right duration-500">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Revisión Final</h2>
        <p className="text-muted-foreground text-sm">Revisa toda la información del convenio antes de enviarlo.</p>
      </div>
      
      <div className="space-y-6">
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-blue-500/20 text-blue-500"><FileIcon className="h-5 w-5" /></div>
            Información básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Título:</p>
              <p className="font-medium text-foreground">{formData.titulo || <span className="text-foreground/50 italic">No especificado</span>}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Fecha:</p>
              <p className="font-medium text-foreground">{formData.fecha || <span className="text-foreground/50 italic">No especificada</span>}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Duración:</p>
              <p className="font-medium text-foreground">{`${formData.duracion || '--'} ${formData['unidad-tiempo'] || ''}`.trim() || <span className="text-foreground/50 italic">No especificada</span>}</p>
            </div>
             <div className="space-y-1 md:col-span-2">
              <p className="text-muted-foreground">Descripción:</p>
              <p className="font-medium text-foreground">{formData.descripcion || <span className="text-foreground/50 italic">No especificada</span>}</p>
            </div>
             <div className="space-y-1">
              <p className="text-muted-foreground">Confidencial:</p>
              <p className="font-medium text-foreground">{formData.confidencial ? 'Sí' : 'No'}</p>
            </div>
          </div>
        </div>
        
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-green-500/20 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            Partes involucradas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div className="space-y-3 border-r border-border/60 pr-6">
              <p className="font-semibold border-b border-border/60 pb-1 text-foreground">UTN</p>
              <div className="space-y-1"><p className="text-muted-foreground">Representante:</p><p className="text-foreground">Ing. José Leandro BASTERRA</p></div>
              <div className="space-y-1"><p className="text-muted-foreground">Cargo:</p><p className="text-foreground">Decano</p></div>
              <div className="space-y-1"><p className="text-muted-foreground">Dirección:</p><p className="text-foreground">French 414, Resistencia, Chaco</p></div>
            </div>
            <div className="space-y-3">
              <p className="font-semibold border-b border-border/60 pb-1 text-foreground">{formData.organizacion || <span className="text-foreground/50 italic">Organización</span>}</p>
              <div className="space-y-1"><p className="text-muted-foreground">Representante:</p><p className="text-foreground">{formData.representante || <span className="text-foreground/50 italic">No especificado</span>}</p></div>
              <div className="space-y-1"><p className="text-muted-foreground">Cargo:</p><p className="text-foreground">{formData.cargo || <span className="text-foreground/50 italic">No especificado</span>}</p></div>
              <div className="space-y-1"><p className="text-muted-foreground">Dirección:</p><p className="text-foreground">{formData.direccion || <span className="text-foreground/50 italic">No especificada</span>}</p></div>
            </div>
          </div>
        </div>
        
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-amber-500/20 text-amber-500"><CornerDownRightIcon className="h-5 w-5" /></div>
            Cláusulas verificadas ({formData.clausulas?.length || 0})
          </h3>
          <ul className="space-y-2 text-sm">
            {formData.clausulas && formData.clausulas.length > 0 ? (
              formData.clausulas.map((clausula: { id: number, titulo: string, contenido: string }, index: number) => (
                <li key={clausula.id} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{clausula.titulo}</p>
                    <p className="text-muted-foreground text-xs">{clausula.contenido.substring(0, 100)}{clausula.contenido.length > 100 ? '...' : ''}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground italic">No hay cláusulas definidas</li>
            )}
          </ul>
        </div>
        
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-purple-500/20 text-purple-500"><PaperclipIcon className="h-5 w-5" /></div>
            Anexos adjuntos ({formData.anexos?.length || 0})
          </h3>
          <ul className="space-y-2 text-sm">
            {formData.anexos && formData.anexos.length > 0 ? (
              formData.anexos.map((anexo: { id: number, nombre: string, tamano: string }) => (
                <li key={anexo.id} className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-primary text-primary-foreground flex-shrink-0">
                     <FileTextIcon className="w-4 h-4"/>
                  </div>
                  <span className="text-foreground">{anexo.nombre}</span>
                  <span className="text-xs text-muted-foreground">({anexo.tamano})</span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground italic">No hay anexos adjuntos</li>
            )}
          </ul>
        </div>
        
        <div className="border border-border/60 p-6 rounded-md bg-card/80 hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-cyan-500/20 text-cyan-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
            </div>
            Observaciones adicionales
          </h3>
          <textarea
            className="w-full px-4 py-2.5 bg-card/80 border border-border/60 text-foreground focus:border-primary/30 focus:ring-1 focus:ring-primary/20 focus:ring-offset-0 rounded-md h-28 resize-none transition-colors placeholder-muted-foreground"
            placeholder="Agregue cualquier observación o nota adicional sobre el convenio..."
            value={formData.observaciones || ""}
            onChange={handleObservacionesChange}
          ></textarea>
        </div>
        
        <div className="p-4 bg-primary/20 border border-primary/30 rounded-md">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded-full bg-primary text-primary-foreground mt-0.5 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Importante:</p>
              <p className="text-sm text-muted-foreground">
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

// Componente para el contenido del documento (separado para reutilizarlo)
const DocumentoPreviewContent = ({ formData, isFullScreen = false }: { formData: any, isFullScreen?: boolean }) => {
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

// Componente Modal para vista previa en pantalla completa
const FullScreenPreview = ({ formData, isOpen, onClose }: { formData: any, isOpen: boolean, onClose: () => void }) => {
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

// Componente principal de la página
export default function ConvenioPage({ params }: { params: Promise<{ id: string }> }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const resolvedParams = React.use(params);
  const convenioId = resolvedParams.id;

  const handleStepChange = (step: number) => {
    if (step >= 1 && step <= 5) {
      setCurrentStep(step);
    }
  };

  const handleFormDataChange = (data: any) => {
    setFormData((prevData) => ({ ...prevData, ...data }));
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = () => {
    console.log("Formulario enviado:", formData);
  };

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
        return <RevisionForm onDataChange={handleFormDataChange} formData={formData} />;
      default:
        return <DatosBasicosForm onDataChange={handleFormDataChange} />;
    }
  };

  return (
    <>
      {/* Fondo con patrón de puntos estático */}
      <div className="fixed inset-0 bg-background -z-10 opacity-80">
        <svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>
          <defs>
            <pattern id='pattern' width='40' height='40' patternUnits='userSpaceOnUse'>
              <circle cx='20' cy='20' r='0.5' fill='currentColor' className="text-foreground/30" />
            </pattern>
            <pattern id='pattern2' width='80' height='80' patternUnits='userSpaceOnUse'>
              <circle cx='40' cy='40' r='1' fill='currentColor' className="text-foreground/20" />
            </pattern>
          </defs>
          <rect width='100%' height='100%' fill='url(#pattern)' />
          <rect width='100%' height='100%' fill='url(#pattern2)' />
        </svg>
      </div>
      
      <div className="p-6 max-w-screen-2xl mx-auto">
        {/* Botón de regreso independiente */}
        <div className="mb-6">
          <Link
            href="/protected/dashboard"
            className="inline-flex items-center text-sm text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" /> 
            Volver al dashboard
          </Link>
        </div>
        
        {/* Panel de bienvenida con stepper - como en las capturas */}
        <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-lg p-5 mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            {convenioId === "nuevo" ? "Nuevo Convenio" : `Editar Convenio #${convenioId}`}
          </h1>
          <p className="text-white/60 mb-4">
            Completa la información del convenio paso a paso
          </p>
          
          {/* Stepper tradicional */}
          <Stepper 
            currentStep={currentStep} 
            onStepChange={handleStepChange} 
          />
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Columna izquierda - Formulario */}
          <div className="w-full lg:w-3/5">
            {/* Formulario del paso actual */}
            <div className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-lg p-6 mb-6 shadow-sm">
              {renderStep()}
              
              {/* Mini-footer para navegación */}
              <NavigationFooter 
                currentStep={currentStep}
                totalSteps={5}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onSubmit={handleSubmit}
              />
            </div>
          </div>

          {/* Columna derecha - Vista previa */}
          <div className="w-full lg:w-2/5 sticky top-6">
            <div className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-lg overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                <div className="flex items-center">
                  <FileTextIcon className="h-5 w-5 text-primary mr-2" />
                  <span className="text-sm font-medium">Vista previa</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors flex items-center">
                    <ZoomInIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs">Zoom</span>
                  </button>
                  <button className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors flex items-center">
                    <MaximizeIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs">Pantalla completa</span>
                  </button>
                  <div className="text-xs text-muted-foreground">
                    Página 1 de 2
                  </div>
                </div>
              </div>
              <div className="p-4">
                <DocumentoPreview formData={formData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 