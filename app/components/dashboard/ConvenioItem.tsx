import Link from "next/link";
import { 
  FileTextIcon, 
  ClockIcon, 
  CheckIcon, 
  AlertCircleIcon, 
  BuildingIcon,
  FilePenIcon,
  ClipboardCheckIcon
} from "lucide-react";

export type ConvenioStatus = "enviado" | "aprobado" | "rechazado";

export interface ConvenioItemProps { 
  id?: string;
  title: string; 
  date: string; 
  type: string; 
  status: ConvenioStatus;
}

export const ConvenioItem = ({ 
  id = "123",
  title, 
  date, 
  type, 
  status 
}: ConvenioItemProps) => {
  const statusColors = {
    enviado: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    aprobado: "bg-green-500/10 text-green-500 border-green-500/20",
    rechazado: "bg-red-500/10 text-red-500 border-red-500/20"
  };

  const statusLabels = {
    enviado: "Enviado",
    aprobado: "Aprobado",
    rechazado: "Rechazado"
  };

  const statusIcons = {
    enviado: <ClockIcon className="w-3 h-3" />,
    aprobado: <CheckIcon className="w-3 h-3" />,
    rechazado: <AlertCircleIcon className="w-3 h-3" />
  };

  return (
    <Link href={`/protected/convenio-detalle/${id}`} className="block">
      <div className="p-4 border border-border/60 rounded-lg hover:border-primary/30 hover:shadow-sm hover:bg-accent/30 transition-all duration-200 cursor-pointer">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-sm line-clamp-1">{title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 ${statusColors[status]}`}>
            {statusIcons[status]}
            {statusLabels[status]}
          </span>
        </div>
        <div className="flex justify-between mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BuildingIcon className="w-3 h-3" />
            {type}
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {date}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ConvenioItem; 