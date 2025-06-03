import React from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { ChevronLeftIcon, EyeIcon, SaveIcon } from "lucide-react";

interface ConvenioHeaderProps {
  title: string;
  subtitle: string;
}

export const ConvenioHeader = ({ title, subtitle }: ConvenioHeaderProps) => {
  return (
    <div className="mb-8 border-b border-border/40 pb-6">
      <div className="flex items-center justify-between mb-2">
        <Link
          href="/protected/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" /> 
          Volver al dashboard
        </Link>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
            <EyeIcon className="h-4 w-4" />
            <span>Vista previa</span>
          </button>
          <Button variant="outline" size="sm" className="gap-2 text-sm">
            <SaveIcon className="h-4 w-4" />
            Guardar borrador
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
};

export default ConvenioHeader;