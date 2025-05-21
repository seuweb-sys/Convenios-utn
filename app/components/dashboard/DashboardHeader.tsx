import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export interface DashboardHeaderProps {
  name: string;
  subtitle?: string;
}

export const DashboardHeader = ({
  name,
  subtitle = "Bienvenido de vuelta, administra tus convenios desde aquí."
}: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <Link href="/protected/convenio-detalle/nuevo">
        <Button className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Nuevo Convenio
        </Button>
      </Link>
    </div>
  );
};

export default DashboardHeader; 