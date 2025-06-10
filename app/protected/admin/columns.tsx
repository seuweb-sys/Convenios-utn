"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { MoreHorizontal, Check, X, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { ObservacionesDialog } from "./observaciones-dialog";

// Tipos
type Convenio = {
  id: string;
  serial_number: string;
  title: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    role: string;
  };
  convenio_types: {
    name: string;
  };
  observaciones: {
    id: string;
    content: string;
    created_at: string;
    resolved: boolean;
  }[];
};

// Función para manejar las acciones
async function handleAction(id: string, action: string, observaciones?: string) {
  try {
    const response = await fetch(`/api/admin/convenios/${id}/actions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, observaciones }),
    });

    if (!response.ok) {
      throw new Error("Error al realizar la acción");
    }

    // Recargar la página para actualizar los datos
    window.location.reload();
  } catch (error) {
    console.error("Error:", error);
    alert("Error al realizar la acción");
  }
}

export const columns: ColumnDef<Convenio>[] = [
  {
    accessorKey: "serial_number",
    header: "N°",
  },
  {
    accessorKey: "title",
    header: "Título",
  },
  {
    accessorKey: "profiles.full_name",
    header: "Creado por",
  },
  {
    accessorKey: "convenio_types.name",
    header: "Tipo",
  },
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return format(date, "dd/MM/yyyy", { locale: es });
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
        enviado: { label: "Enviado", variant: "secondary" },
        aceptado: { label: "Aceptado", variant: "default" },
        rechazado: { label: "Rechazado", variant: "destructive" },
      };

      const { label, variant } = statusMap[status] || { label: status, variant: "secondary" };

      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const convenio = row.original;
      const [showObservaciones, setShowObservaciones] = useState(false);

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleAction(convenio.id, "approve")}
                className="text-green-600"
              >
                <Check className="mr-2 h-4 w-4" />
                Aprobar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleAction(convenio.id, "reject")}
                className="text-red-600"
              >
                <X className="mr-2 h-4 w-4" />
                Rechazar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowObservaciones(true)}
                className="text-yellow-600"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Solicitar corrección
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ObservacionesDialog
            isOpen={showObservaciones}
            onClose={() => setShowObservaciones(false)}
            onSubmit={(observaciones) => handleAction(convenio.id, "correct", observaciones)}
          />
        </>
      );
    },
  },
]; 