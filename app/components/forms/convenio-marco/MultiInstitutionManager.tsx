"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { PlusIcon, TrashIcon, EditIcon, BuildingIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface Institucion {
    nombre: string;
    tipo: string;
    domicilio: string;
    ciudad: string;
    cuit: string;
    representanteNombre: string;
    representanteDni: string;
    cargoRepresentante: string;
}

interface MultiInstitutionManagerProps {
    instituciones: Institucion[];
    onInstitucionesChange: (instituciones: Institucion[]) => void;
}

const emptyInstitucion: Institucion = {
    nombre: "",
    tipo: "",
    domicilio: "",
    ciudad: "",
    cuit: "",
    representanteNombre: "",
    representanteDni: "",
    cargoRepresentante: "",
};

export function MultiInstitutionManager({
    instituciones,
    onInstitucionesChange
}: MultiInstitutionManagerProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
    const [currentForm, setCurrentForm] = useState<Institucion>(emptyInstitucion);

    const handleAddNew = () => {
        setCurrentForm(emptyInstitucion);
        setEditingIndex(instituciones.length); // Nueva entrada
    };

    const handleEdit = (index: number) => {
        setCurrentForm({ ...instituciones[index] });
        setEditingIndex(index);
        setExpandedIndex(index);
    };

    const handleDelete = (index: number) => {
        const updated = instituciones.filter((_, i) => i !== index);
        onInstitucionesChange(updated);
        if (editingIndex === index) {
            setEditingIndex(null);
            setCurrentForm(emptyInstitucion);
        }
    };

    const handleSave = () => {
        if (!currentForm.nombre.trim()) {
            return; // Requiere al menos nombre
        }

        const updated = [...instituciones];
        if (editingIndex !== null && editingIndex < instituciones.length) {
            // Editando existente
            updated[editingIndex] = currentForm;
        } else {
            // Agregando nueva
            updated.push(currentForm);
        }

        onInstitucionesChange(updated);
        setEditingIndex(null);
        setCurrentForm(emptyInstitucion);
        setExpandedIndex(updated.length - 1);
    };

    const handleCancel = () => {
        setEditingIndex(null);
        setCurrentForm(emptyInstitucion);
    };

    const handleFormChange = (field: keyof Institucion, value: string) => {
        setCurrentForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-4">
            {/* Lista de instituciones agregadas */}
            {instituciones.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-base font-semibold">Instituciones agregadas ({instituciones.length})</Label>
                    {instituciones.map((inst, index) => (
                        <div
                            key={index}
                            className="border border-border rounded-lg bg-card overflow-hidden"
                        >
                            <div
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-blue-500/20 text-blue-600">
                                        <BuildingIcon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="font-medium">{inst.nombre || "Sin nombre"}</span>
                                        <span className="text-sm text-muted-foreground ml-2">({inst.tipo})</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => { e.stopPropagation(); handleEdit(index); }}
                                    >
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(index); }}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                    {expandedIndex === index ?
                                        <ChevronUpIcon className="h-4 w-4 text-muted-foreground" /> :
                                        <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                                    }
                                </div>
                            </div>

                            {expandedIndex === index && (
                                <div className="px-4 pb-4 pt-2 border-t bg-muted/20 text-sm grid grid-cols-2 gap-2">
                                    <div><span className="text-muted-foreground">CUIT:</span> {inst.cuit}</div>
                                    <div><span className="text-muted-foreground">Ciudad:</span> {inst.ciudad}</div>
                                    <div className="col-span-2"><span className="text-muted-foreground">Domicilio:</span> {inst.domicilio}</div>
                                    <div><span className="text-muted-foreground">Representante:</span> {inst.representanteNombre}</div>
                                    <div><span className="text-muted-foreground">Cargo:</span> {inst.cargoRepresentante}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Formulario de edición/creación */}
            {editingIndex !== null && (
                <div className="border border-primary/50 rounded-lg p-4 bg-primary/5 space-y-4">
                    <h4 className="font-semibold text-sm">
                        {editingIndex < instituciones.length ? "Editar institución" : "Nueva institución"}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-nombre">Nombre *</Label>
                            <Input
                                id="edit-nombre"
                                value={currentForm.nombre}
                                onChange={(e) => handleFormChange("nombre", e.target.value)}
                                placeholder="Nombre de la entidad"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-tipo">Tipo</Label>
                            <Input
                                id="edit-tipo"
                                value={currentForm.tipo}
                                onChange={(e) => handleFormChange("tipo", e.target.value.toUpperCase())}
                                placeholder="EMPRESA, FUNDACION, etc."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-cuit">CUIT</Label>
                            <Input
                                id="edit-cuit"
                                value={currentForm.cuit}
                                onChange={(e) => handleFormChange("cuit", e.target.value.replace(/\D/g, ''))}
                                placeholder="Sin guiones"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-ciudad">Ciudad</Label>
                            <Input
                                id="edit-ciudad"
                                value={currentForm.ciudad}
                                onChange={(e) => handleFormChange("ciudad", e.target.value)}
                                placeholder="Ciudad"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="edit-domicilio">Domicilio</Label>
                            <Input
                                id="edit-domicilio"
                                value={currentForm.domicilio}
                                onChange={(e) => handleFormChange("domicilio", e.target.value)}
                                placeholder="Dirección completa"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-representante">Representante</Label>
                            <Input
                                id="edit-representante"
                                value={currentForm.representanteNombre}
                                onChange={(e) => handleFormChange("representanteNombre", e.target.value)}
                                placeholder="Nombre del representante"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-cargo">Cargo</Label>
                            <Input
                                id="edit-cargo"
                                value={currentForm.cargoRepresentante}
                                onChange={(e) => handleFormChange("cargoRepresentante", e.target.value)}
                                placeholder="Cargo del representante"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-dni">DNI Representante</Label>
                            <Input
                                id="edit-dni"
                                value={currentForm.representanteDni}
                                onChange={(e) => handleFormChange("representanteDni", e.target.value.replace(/\D/g, ''))}
                                placeholder="DNI sin puntos"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button type="button" onClick={handleSave} size="sm">
                            Guardar
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancel} size="sm">
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}

            {/* Botón agregar */}
            {editingIndex === null && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddNew}
                    className="w-full border-dashed"
                >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Agregar {instituciones.length > 0 ? "otra " : ""}institución
                </Button>
            )}
        </div>
    );
}
