import Link from "next/link";
import {
  FileTextIcon,
  ClockIcon,
  CheckIcon,
  AlertCircleIcon,
  BuildingIcon,
} from "lucide-react";

import {
  resolveConvenioStatusDisplay,
  type ConvenioStatus,
  type ConvenioStatusIconKind,
} from "./convenio-status-display";

export type { ConvenioStatus, ConvenioStatusDisplay } from "./convenio-status-display";

export interface ConvenioItemProps {
  id?: string;
  title: string;
  date: string;
  type: string;
  status: ConvenioStatus;
}

const STATUS_ICONS: Record<ConvenioStatusIconKind, React.ReactNode> = {
  clock: <ClockIcon className="w-3 h-3" />,
  check: <CheckIcon className="w-3 h-3" />,
  alert: <AlertCircleIcon className="w-3 h-3" />,
  file: <FileTextIcon className="w-3 h-3" />,
};

export const ConvenioItem = ({
  id = "123",
  title,
  date,
  type,
  status,
}: ConvenioItemProps) => {
  const display = resolveConvenioStatusDisplay(status);

  return (
    <Link href={`/protected/convenio-detalle/${id}`} className="block">
      <div className="p-4 border border-border/60 rounded-lg hover:border-primary/30 hover:shadow-sm hover:bg-accent/30 transition-all duration-200 cursor-pointer">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-sm line-clamp-1">{title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 ${display.color}`}>
            {STATUS_ICONS[display.icon]}
            {display.label}
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