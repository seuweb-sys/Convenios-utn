import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { 
  FileTextIcon, 
  PlusIcon, 
  ClockIcon, 
  CheckIcon, 
  AlertCircleIcon, 
  UsersIcon,
  BuildingIcon,
  FilePenIcon,
  ClipboardCheckIcon,
  ChevronRightIcon,
  EyeIcon
} from "lucide-react";

// Componente para convenios en el listado
const ConvenioItem = ({ 
  title, 
  date, 
  type, 
  status 
}: { 
  title: string; 
  date: string; 
  type: string; 
  status: "borrador" | "enviado" | "revision" | "aprobado" | "rechazado" 
}) => {
  const statusColors = {
    borrador: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    enviado: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    revision: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    aprobado: "bg-green-500/10 text-green-500 border-green-500/20",
    rechazado: "bg-red-500/10 text-red-500 border-red-500/20"
  };

  const statusLabels = {
    borrador: "Borrador",
    enviado: "Enviado",
    revision: "En revisión",
    aprobado: "Aprobado",
    rechazado: "Rechazado"
  };

  const statusIcons = {
    borrador: <FilePenIcon className="w-3 h-3" />,
    enviado: <ClockIcon className="w-3 h-3" />,
    revision: <ClipboardCheckIcon className="w-3 h-3" />,
    aprobado: <CheckIcon className="w-3 h-3" />,
    rechazado: <AlertCircleIcon className="w-3 h-3" />
  };

  return (
    <Link href={`/protected/convenio/123`} className="block">
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

// Componente para tipos de convenios
const ConvenioTypeCard = ({ 
  title, 
  description,
  icon,
  color,
  previewUrl
}: { 
  title: string; 
  description: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "amber";
  previewUrl: string;
}) => {
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

export default async function Dashboard() {
  const supabase = await createClient();

  return (
    <>
      {/* Fondo con patrón de puntos estático */}
      <div className="fixed inset-0 bg-background -z-10 opacity-80">
        <svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>
          <defs>
            <pattern id='pattern' width='40' height='40' patternUnits='userSpaceOnUse'>
              <circle cx='20' cy='20' r='0.5' fill='currentColor' className="text-foreground/30" />
            </pattern>
            <pattern id='pattern2' width='80' height='80' patternUnits='userSpaceOnUse'>
              <circle cx='40' cy='40' r='1' fill='currentColor' className="text-foreground/20" />
            </pattern>
          </defs>
          <rect width='100%' height='100%' fill='url(#pattern)' />
          <rect width='100%' height='100%' fill='url(#pattern2)' />
        </svg>
      </div>
      
      <div className="p-6 max-w-screen-2xl mx-auto relative">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Santiago</h1>
            <p className="text-muted-foreground">Bienvenido de vuelta, administra tus convenios desde aquí.</p>
          </div>
          <Link href="/protected/convenio/nuevo">
            <Button className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Nuevo Convenio
            </Button>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Actividad Reciente y Listado de Convenios */}
          <div className="lg:col-span-2 space-y-6">
            {/* Actividad Reciente */}
            <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Actividad Reciente</h2>
                <Link href="/protected/actividad" className="text-sm text-primary flex items-center hover:underline">
                  Ver todo
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3 items-start pb-3 border-b border-border/40">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500">
                    <FileTextIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">Convenio con Empresa XYZ enviado a revisión</p>
                      <span className="text-xs text-muted-foreground">Hace 2 horas</span>
                    </div>
                    <p className="text-xs text-muted-foreground">El convenio requiere aprobación por parte del coordinador.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start pb-3 border-b border-border/40">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500">
                    <CheckIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">Convenio Marco con Universidad ABC aprobado</p>
                      <span className="text-xs text-muted-foreground">Ayer</span>
                    </div>
                    <p className="text-xs text-muted-foreground">El convenio ha sido firmado por ambas partes.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500">
                    <AlertCircleIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">Convenio Específico de Investigación devuelto</p>
                      <span className="text-xs text-muted-foreground">Hace 2 días</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Se requieren modificaciones en las cláusulas de financiamiento.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Listado de Convenios */}
            <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Mis Convenios</h2>
                <Link href="/protected/convenios" className="text-sm text-primary flex items-center hover:underline">
                  Ver todos
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ConvenioItem 
                  title="Convenio con Empresa XYZ" 
                  date="12/04/2023" 
                  type="Prácticas Profesionales" 
                  status="borrador" 
                />
                <ConvenioItem 
                  title="Acuerdo Marco con Universidad ABC" 
                  date="05/04/2023" 
                  type="Convenio Marco" 
                  status="revision" 
                />
                <ConvenioItem 
                  title="Convenio de Pasantías con Tech Inc." 
                  date="01/03/2023" 
                  type="Prácticas Profesionales" 
                  status="aprobado" 
                />
                <ConvenioItem 
                  title="Convenio Específico de Investigación" 
                  date="20/02/2023" 
                  type="Convenio Específico" 
                  status="rechazado" 
                />
              </div>
            </div>
          </div>
          
          {/* Crear Nuevo Convenio */}
          <div className="space-y-6">
            <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg p-5">
              <h2 className="text-lg font-medium mb-4">Crear Nuevo Convenio</h2>
              <p className="text-sm text-muted-foreground mb-5">Selecciona un tipo de convenio para comenzar.</p>
              
              <div className="space-y-4">
                <ConvenioTypeCard 
                  title="Convenio Marco" 
                  description="Establece lineamientos generales de colaboración institucional."
                  icon={<BuildingIcon className="h-5 w-5" />}
                  color="blue"
                  previewUrl="/plantillas/marco/preview"
                />
                <ConvenioTypeCard 
                  title="Prácticas Profesionales" 
                  description="Para realizar prácticas laborales en organizaciones."
                  icon={<UsersIcon className="h-5 w-5" />}
                  color="green"
                  previewUrl="/plantillas/practicas/preview"
                />
                <ConvenioTypeCard 
                  title="Convenio Específico" 
                  description="Para proyectos o actividades específicas."
                  icon={<ClipboardCheckIcon className="h-5 w-5" />}
                  color="amber"
                  previewUrl="/plantillas/especifico/preview"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 