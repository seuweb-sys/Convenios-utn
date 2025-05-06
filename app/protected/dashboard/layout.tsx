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

  // Obtener el perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error al obtener perfil:', profileError);
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-2">
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
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-muted/50 transition-colors">
              <BellIcon className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-3 border-l pl-3 ml-1">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium">{profile?.full_name || user.email?.split('@')[0]}</div>
                <div className="text-xs text-muted-foreground capitalize">{profile?.role || 'Usuario'}</div>
              </div>
              
              <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm overflow-hidden">
                {profile?.avatar_url ? (
                  <Image 
                    src={profile.avatar_url}
                    alt={profile.full_name || user.email?.split('@')[0] || "Usuario"}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user.email ? user.email[0].toUpperCase() : "U"
                )}
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
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r bg-card/50">
          <nav className="flex-1 px-3 py-4 space-y-1">
            <Link href="/protected/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-primary/10 text-primary">
              <HomeIcon className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/protected/convenios" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
              <FileTextIcon className="h-4 w-4" />
              Convenios
            </Link>
            <Link href="/protected/actividad" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
              <ClockIcon className="h-4 w-4" />
              Actividad
            </Link>
            <Link href="/protected/aprobaciones" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
              <CheckCircleIcon className="h-4 w-4" />
              Aprobaciones
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 