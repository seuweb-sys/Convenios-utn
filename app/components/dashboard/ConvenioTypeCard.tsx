import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { EyeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConvenioColor = "blue" | "green" | "amber" | "purple" | "rose" | "cyan" | "orange" | "red";

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
  color = "cyan",
  previewUrl
}: ConvenioTypeCardProps) => {
  const iconGlowClasses = {
    blue: "bg-blue-500/20 dark:bg-blue-500/30",
    green: "bg-green-500/20 dark:bg-green-500/30",
    amber: "bg-amber-500/20 dark:bg-amber-500/30",
    purple: "bg-purple-500/20 dark:bg-purple-500/30",
    rose: "bg-rose-500/20 dark:bg-rose-500/30",
    cyan: "bg-cyan-500/20 dark:bg-cyan-500/30",
    orange: "bg-orange-500/20 dark:bg-orange-500/30",
    red: "bg-red-500/20 dark:bg-red-500/30",
  };

  const iconTextClasses = {
    blue: "text-blue-400",
    green: "text-green-400",
    amber: "text-amber-400",
    purple: "text-purple-400",
    rose: "text-rose-400",
    cyan: "text-cyan-400",
    orange: "text-orange-400",
    red: "text-red-400",
  };

  const buttonBgClasses = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    amber: "bg-amber-600 hover:bg-amber-700",
    purple: "bg-purple-600 hover:bg-purple-700",
    rose: "bg-rose-600 hover:bg-rose-700",
    cyan: "bg-cyan-600 hover:bg-cyan-700",
    orange: "bg-orange-600 hover:bg-orange-700",
    red: "bg-red-600 hover:bg-red-700",
  };

  const borderHoverClasses = {
    blue: "hover:border-blue-400/50",
    green: "hover:border-green-400/50",
    amber: "hover:border-amber-400/50",
    purple: "hover:border-purple-400/50",
    rose: "hover:border-rose-400/50",
    cyan: "hover:border-cyan-400/50",
    orange: "hover:border-orange-400/50",
    red: "hover:border-red-400/50",
  };

  // Determinar el tipo de convenio y generar URL
  const titleLower = title.toLowerCase();
  const getConvenioUrl = () => {
    // Condiciones específicas primero
    if (titleLower === "convenio marco") {
      return "/protected/convenio-detalle/nuevo?type=marco";
    }
    if (titleLower === "convenio específico" || titleLower === "convenio especifico") {
      return "/protected/convenio-detalle/nuevo?type=especifico";
    }
    if (titleLower === "convenio particular de práctica supervisada" || titleLower === "convenio particular de practica supervisada") {
      return "/protected/convenio-detalle/nuevo?type=particular";
    }
    if (titleLower === "acuerdo de colaboración" || titleLower === "acuerdo de colaboracion") {
      return "/protected/convenio-detalle/nuevo?type=acuerdo";
    }
    // Condiciones más generales después
    if (titleLower.includes("práctica supervisada") || titleLower.includes("practica supervisada")) {
      return "/protected/convenio-detalle/nuevo?type=practica-marco";
    }
    return "#";
  };
  
  const isEnabled = titleLower === "convenio marco" || 
                   titleLower.includes("práctica supervisada") || 
                   titleLower.includes("practica supervisada") ||
                   titleLower === "convenio específico" ||
                   titleLower === "convenio especifico" ||
                   titleLower === "convenio particular de práctica supervisada" ||
                   titleLower === "convenio particular de practica supervisada" ||
                   titleLower === "acuerdo de colaboración" ||
                   titleLower === "acuerdo de colaboracion";

  return (
    <div className={cn(
      "border rounded-lg p-6 hover:shadow-md transition-all duration-200 bg-card group",
      borderHoverClasses[color]
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-medium text-lg group-hover:text-primary transition-colors">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className={cn(
          "relative flex items-center justify-center w-12 h-12 rounded-lg shrink-0",
          iconGlowClasses[color]
        )}>
          <div className={cn(
            "absolute inset-0 rounded-lg blur-md opacity-70",
            iconGlowClasses[color]
          )}></div>
          <div className={cn("relative z-10", iconTextClasses[color])}>
          {icon}
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Link href={getConvenioUrl()} legacyBehavior>
          <Button 
            className={cn(
              "w-full border-0",
              buttonBgClasses[color],
              "text-primary-foreground"
            )}
            disabled={!isEnabled}
            title={isEnabled ? undefined : "Próximamente disponible"}
          >
            Usar plantilla
          </Button>
        </Link>
        <Link href={previewUrl} legacyBehavior>
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