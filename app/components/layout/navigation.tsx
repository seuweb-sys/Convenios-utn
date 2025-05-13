"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileTextIcon, HomeIcon, ClockIcon, CheckCircleIcon, UserIcon, SettingsIcon } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1">
        <Link 
          href="/protected" 
          className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive('/protected') 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          }`}
        >
          <HomeIcon className="h-4 w-4" />
          Dashboard
        </Link>
        <Link 
          href="/protected/convenios" 
          className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive('/protected/convenios') 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          }`}
        >
          <FileTextIcon className="h-4 w-4" />
          Convenios
        </Link>
        <Link 
          href="/protected/actividad" 
          className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive('/protected/actividad') 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          }`}
        >
          <ClockIcon className="h-4 w-4" />
          Actividad
        </Link>
        <Link 
          href="/protected/aprobaciones" 
          className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive('/protected/aprobaciones') 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          }`}
        >
          <CheckCircleIcon className="h-4 w-4" />
          Aprobaciones
        </Link>
      </nav>

      <div className="px-3 py-4 border-t">
        <div className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Administración
        </div>
        <nav className="space-y-1">
          <Link 
            href="/protected/usuarios" 
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive('/protected/usuarios') 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            Usuarios
          </Link>
          <Link 
            href="/protected/configuracion" 
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive('/protected/configuracion') 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <SettingsIcon className="h-4 w-4" />
            Configuración
          </Link>
        </nav>
      </div>
    </>
  );
} 