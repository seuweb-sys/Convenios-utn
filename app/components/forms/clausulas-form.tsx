import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CornerDownRightIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { commonCardStyles, commonInputStyles } from "@/app/components/ui/common-styles";

interface ClausulasFormProps {
  onDataChange?: (data: any) => void;
}

export const ClausulasForm = ({ onDataChange }: ClausulasFormProps) => {
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

export default ClausulasForm;