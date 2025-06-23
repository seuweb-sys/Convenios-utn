"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { 
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  HashIcon 
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from 'next/navigation';
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

// Función para formatear fechas de forma segura
const formatDateSafely = (dateString: string) => {
  try {
    if (!dateString) return "Sin fecha";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    return format(date, "dd/MM/yy", { locale: es });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error fecha";
  }
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
    cell: ({ row }) => {
      const serialNumber = row.getValue("serial_number") as string;
      return (
        <div className="flex items-center justify-center gap-1 font-mono">
          <HashIcon className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium text-xs">{serialNumber || "Sin N°"}</span>
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
            title={`${fullName || "Usuario"} (${role === "admin" ? "Admin" : role === "profesor" ? "Profesor" : "Usuario"})`}
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
      const dateString = row.getValue("created_at") as string;
      return (
        <div className="text-xs text-muted-foreground font-mono">
          {formatDateSafely(dateString)}
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

      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted/50"
            onClick={() => {
              // Ir a la página de detalle del profesor
              window.open(`/protected/profesor/${convenio.id}`, '_blank');
            }}
          >
            <EyeIcon className="h-4 w-4" />
            <span className="sr-only">Ver detalles</span>
          </Button>
        </div>
      );
    },
  },
]; 