import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";

export type ConvenioColor = "blue" | "green" | "amber";

export interface ConvenioTypeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: ConvenioColor;
  previewUrl: string;
}

export const ConvenioTypeCard = ({ 
  title, 
  description,
  icon,
  color,
  previewUrl
}: ConvenioTypeCardProps) => {
  const buttonColors = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    amber: "bg-amber-600 hover:bg-amber-700"
  };

  const borderColors = {
    blue: "hover:border-blue-400/50",
    green: "hover:border-green-400/50",
    amber: "hover:border-amber-400/50"
  };

  const iconColors = {
    blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-500",
    green: "bg-green-100 dark:bg-green-900/20 text-green-500",
    amber: "bg-amber-100 dark:bg-amber-900/20 text-amber-500"
  };

  return (
    <div className={`border rounded-lg p-6 ${borderColors[color]} hover:shadow-md transition-all duration-200 bg-card group`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-lg group-hover:text-primary transition-colors">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className={`p-3 rounded-full ${iconColors[color]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Link href={`/protected/convenio/nuevo?tipo=${title.toLowerCase()}`}>
          <Button className={`w-full text-white ${buttonColors[color]} border-0`}>
            Usar plantilla
          </Button>
        </Link>
        <Link href={previewUrl}>
          <Button variant="outline" className="w-full border-border/60 flex items-center justify-center gap-1">
            <EyeIcon className="h-4 w-4" />
            <span>Vista previa</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ConvenioTypeCard; 