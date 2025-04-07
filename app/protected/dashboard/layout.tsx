import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions";
import { FileTextIcon, HomeIcon, ClockIcon, CheckCircleIcon, UserIcon, SettingsIcon, BellIcon, SearchIcon, MenuIcon } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/protected/dashboard" className="flex items-center gap-2">
              <div className="bg-white/95 backdrop-filter backdrop-blur-sm p-1.5 rounded-md shadow-md relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 opacity-90"></div>
                <div className="absolute inset-0 bg-white/50 mix-blend-overlay"></div>
                <Image 
                  src={`/utn-logo.png?v=${new Date().getTime()}`} 
                  alt="UTN Logo" 
                  width={120}
                  height={40}
                  className="h-7 w-auto object-contain relative z-10 drop-shadow-sm contrast-125 brightness-105"
                  priority
                />
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-300/20 blur-sm z-0"></div>
              </div>
              <span className="font-semibold text-xl hidden md:inline-block">Convenios UTN</span>
            </Link>
          </div>
          
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-16">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar convenios..."
                className="w-full pl-10 pr-4 py-1.5 text-sm bg-muted/50 rounded-md border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50"
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-full hover:bg-muted/50 transition-colors">
              <BellIcon className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-3 border-l pl-3 ml-1">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium">{user.email?.split('@')[0]}</div>
                <div className="text-xs text-muted-foreground">Administrador</div>
              </div>
              
              <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm overflow-hidden">
                {user.email ? user.email[0].toUpperCase() : "U"}
              </div>
              
              <form action={signOutAction} className="hidden md:block">
                <Button variant="outline" size="sm" type="submit" className="text-xs h-8">
                  Cerrar sesión
                </Button>
              </form>
              
              <button className="md:hidden p-1">
                <MenuIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden bg-muted/10">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block w-60 border-r bg-card shadow-sm overflow-y-auto pt-6">
          <nav className="space-y-1 px-3">
            <Link href="/protected/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-primary/10 text-primary">
              <HomeIcon className="h-4 w-4" />
              Inicio
            </Link>
            <Link href="/protected/convenios" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
              <FileTextIcon className="h-4 w-4" />
              Mis Convenios
            </Link>
            <Link href="/protected/pendientes" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
              <ClockIcon className="h-4 w-4" />
              Pendientes
            </Link>
            <Link href="/protected/aprobados" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
              <CheckCircleIcon className="h-4 w-4" />
              Aprobados
            </Link>
          </nav>
          
          <div className="mt-6 px-3 pt-6 border-t">
            <div className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Administración
            </div>
            <nav className="space-y-1">
              <Link href="/protected/usuarios" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                <UserIcon className="h-4 w-4" />
                Usuarios
              </Link>
              <Link href="/protected/configuracion" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                <SettingsIcon className="h-4 w-4" />
                Configuración
              </Link>
            </nav>
          </div>
          
          <div className="mt-10 mx-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-medium text-blue-800 dark:text-blue-300">¿Necesitas ayuda?</h3>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">Consulta la guía de uso o contacta a soporte.</p>
                <a href="#" className="mt-2 inline-block text-xs font-medium text-blue-600 dark:text-blue-300 hover:underline">
                  Ver documentación
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 