"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/app/components/ui/textarea";

interface ObservacionesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (observaciones: string) => void;
}

export function ObservacionesDialog({
  isOpen,
  onClose,
  onSubmit,
}: ObservacionesDialogProps) {
  const [observaciones, setObservaciones] = useState("");

  const handleSubmit = () => {
    if (observaciones.trim()) {
      onSubmit(observaciones);
      setObservaciones("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar corrección</DialogTitle>
          <DialogDescription>
            Ingresa las observaciones que necesitas que el usuario corrija.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Escribe tus observaciones aquí..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!observaciones.trim()}>
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 