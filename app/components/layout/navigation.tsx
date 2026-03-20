"use client";

import { usePathname } from "next/navigation";
import {
  FileTextIcon,
  HomeIcon,
  ClockIcon,
  CheckCircleIcon,
  SettingsIcon,
  ShieldIcon,
  GraduationCap,
  ScrollText,
  BadgeCheck,
  Scale,
} from "lucide-react";
import { useLoadingNavigation } from "@/app/hooks/use-loading-navigation";
import type { NavMembershipFlags } from "@/app/lib/authz/membership-scope";

interface NavigationProps {
  userRole?: string;
  navMembershipFlags?: NavMembershipFlags;
}

export function Navigation({
  userRole,
  navMembershipFlags,
}: NavigationProps) {
  const pathname = usePathname();
  const { navigate } = useLoadingNavigation();
  const isActive = (path: string) => pathname === path;
  const isAdmin = userRole === "admin";
  const isDecano = userRole === "decano";

  const handleNavigation = (path: string, label: string) => {
    navigate(path, `Navegando a ${label}...`);
  };

  const flags = navMembershipFlags ?? {
    hasProfesor: false,
    hasDirector: false,
    hasSecretario: false,
  };

  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1">
        <button
          onClick={() => handleNavigation("/protected", "Dashboard")}
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive("/protected")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <HomeIcon className="h-4 w-4" />
          Dashboard
        </button>
        <button
          onClick={() =>
            handleNavigation("/protected/convenios-lista", "Convenios")
          }
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive("/protected/convenios-lista")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <FileTextIcon className="h-4 w-4" />
          Convenios
        </button>
        <button
          onClick={() => handleNavigation("/protected/actividad", "Actividad")}
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive("/protected/actividad")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <ClockIcon className="h-4 w-4" />
          Actividad
        </button>
        <button
          onClick={() =>
            handleNavigation("/protected/aprobaciones", "Aprobaciones")
          }
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive("/protected/aprobaciones")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <CheckCircleIcon className="h-4 w-4" />
          Aprobaciones
        </button>
      </nav>

      {isAdmin && (
        <div className="px-3 py-4 border-t">
          <div className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Administración
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => handleNavigation("/protected/admin", "Panel Admin")}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive("/protected/admin")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <ShieldIcon className="h-4 w-4" />
              Panel Admin
            </button>
            <button
              onClick={() =>
                handleNavigation(
                  "/protected/admin/configuracion",
                  "Configuración"
                )
              }
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive("/protected/admin/configuracion")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <SettingsIcon className="h-4 w-4" />
              Configuración
            </button>
          </nav>
        </div>
      )}

      {(flags.hasProfesor ||
        flags.hasDirector ||
        flags.hasSecretario ||
        isDecano) && (
        <div className="px-3 py-4 border-t">
          <div className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Ámbitos
          </div>
          <nav className="space-y-1">
            {flags.hasProfesor && (
              <button
                onClick={() =>
                  handleNavigation("/protected/profesor", "Profesor")
                }
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname?.startsWith("/protected/profesor")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                Profesor
              </button>
            )}
            {flags.hasDirector && (
              <button
                onClick={() =>
                  handleNavigation("/protected/director", "Director")
                }
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive("/protected/director")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <BadgeCheck className="h-4 w-4" />
                Director
              </button>
            )}
            {flags.hasSecretario && (
              <button
                onClick={() =>
                  handleNavigation("/protected/secretario", "Secretario")
                }
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive("/protected/secretario")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <ScrollText className="h-4 w-4" />
                Secretario
              </button>
            )}
            {isDecano && (
              <button
                onClick={() => handleNavigation("/protected/decano", "Decano")}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive("/protected/decano")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Scale className="h-4 w-4" />
                Decano
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
