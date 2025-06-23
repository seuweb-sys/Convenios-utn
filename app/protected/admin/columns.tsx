"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Check, 
  X, 
  AlertCircle,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  HashIcon 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { ObservacionesDialog } from "./observaciones-dialog";
import { cn } from "@/lib/utils";

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

// Función para obtener icono de estado
const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "aceptado":
    case "aprobado":
      return <CheckCircleIcon className="h-4 w-4" />;
    case "enviado":
      return <ClockIcon className="h-4 w-4" />;
    case "rechazado":
      return <XCircleIcon className="h-4 w-4" />;
    default:
      return <ClockIcon className="h-4 w-4" />;
  }
};

// Función para obtener colores de estado (igual que convenios-lista)
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "aceptado":
    case "aprobado":
      return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
    case "enviado":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
    case "rechazado":
      return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

// Función para manejar las acciones
async function handleAction(id: string, action: string, observaciones?: string) {
  try {
    let endpoint = `/api/admin/convenios/${id}/actions`;
    
    // Si es solicitud de corrección, usar el endpoint específico
    if (action === "correct") {
      endpoint = `/api/convenio/${id}/request-correction`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, observaciones }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al realizar la acción");
    }

    // Recargar la página para actualizar los datos
    window.location.reload();
  } catch (error) {
    console.error("Error:", error);
    alert(error instanceof Error ? error.message : "Error al realizar la acción");
  }
}

export const columns: ColumnDef<Convenio>[] = [
  {
    accessorKey: "serial_number",
    header: "N°",
    cell: ({ row }) => {
      const serialNumber = row.getValue("serial_number") as string;
      return (
        <div className="flex items-center justify-center gap-1 font-mono">
          <HashIcon className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium text-xs">{serialNumber}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Título",
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return (
        <div className="max-w-[350px]">
          <p className="font-medium truncate text-sm leading-tight" title={title}>
            {title}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "profiles.full_name",
    header: "Usuario",
    cell: ({ row }) => {
      const fullName = row.original.profiles?.full_name;
      const role = row.original.profiles?.role;
      
      // Función para obtener las iniciales
      const getInitials = (name: string) => {
        if (!name) return "U";
        const names = name.split(" ");
        if (names.length >= 2) {
          return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return name[0].toUpperCase();
      };

      return (
        <div className="flex justify-center">
          <div 
            className="h-9 w-9 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm border border-primary/20 cursor-help"
            title={`${fullName || "Usuario"} (${role === "admin" ? "Admin" : "Usuario"})`}
          >
            {getInitials(fullName || "Usuario")}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "convenio_types.name",
    header: "Tipo",
    cell: ({ row }) => {
      const typeName = row.original.convenio_types?.name;
      
      // Acortar nombres de tipos comunes
      const getShortTypeName = (name: string) => {
        if (!name) return "Sin tipo";
        
        const shortNames: { [key: string]: string } = {
          "Convenio Marco": "Marco",
          "Convenio Particular de Práctica Supervisada": "Práctica",
          "Convenio Específico": "Específico",
          "Acuerdo de Colaboracion": "Colaboración"
        };
        
        return shortNames[name] || name;
      };

      return (
        <div className="text-xs font-medium text-muted-foreground">
          {getShortTypeName(typeName)}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="text-xs text-muted-foreground font-mono">
          {format(date, "dd/MM/yy", { locale: es })}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
        enviado: { label: "Enviado", variant: "secondary" },
        aprobado: { label: "Aprobado", variant: "default" },
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
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/50">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card/80 backdrop-blur-sm border-border/60">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleAction(convenio.id, "approve")}
                className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Check className="mr-2 h-4 w-4" />
                Aprobar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleAction(convenio.id, "reject")}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="mr-2 h-4 w-4" />
                Rechazar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowObservaciones(true)}
                className="text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
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