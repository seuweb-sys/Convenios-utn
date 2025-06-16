"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ActivityApiData } from "@/app/api/activity/route";
import { 
  FileTextIcon, 
  FilePlusIcon, 
  EditIcon, 
  CheckCircleIcon, 
  AlertCircleIcon, 
  ClockIcon 
} from "lucide-react";

export const columns: ColumnDef<ActivityApiData>[] = [
  {
    accessorKey: "iconName",
    header: "",
    cell: ({ row }) => {
      const iconName = row.getValue("iconName") as string;
      let icon = <FileTextIcon className="h-5 w-5" />;
      
      switch(iconName) {
        case "file-plus":
          icon = <FilePlusIcon className="h-5 w-5" />;
          break;
        case "edit":
          icon = <EditIcon className="h-5 w-5" />;
          break;
        case "check":
          icon = <CheckCircleIcon className="h-5 w-5" />;
          break;
        case "alert-circle":
          icon = <AlertCircleIcon className="h-5 w-5" />;
          break;
        case "clock":
          icon = <ClockIcon className="h-5 w-5" />;
          break;
      }

      return (
        <div className="p-2 rounded-lg bg-primary/5">
          {icon}
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Actividad",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.getValue("title")}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Descripción",
    cell: ({ row }) => {
      return (
        <div className="text-muted-foreground">
          {row.getValue("description")}
        </div>
      );
    },
  },
  {
    accessorKey: "time",
    header: "Tiempo",
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {row.getValue("time")}
        </div>
      );
    },
  },
]; 