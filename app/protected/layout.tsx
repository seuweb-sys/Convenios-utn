import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import { signOutAction } from "@/app/actions";
import { BellIcon, SearchIcon, MenuIcon } from "lucide-react";
import { Navigation } from "@/app/components/layout/navigation";
import { NotificationsDropdown } from "@/app/components/layout/notifications";

export default async function ProtectedLayout({
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
      {/* Header - Fijo en la parte superior */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <Link href="/protected" className="flex items-center gap-2">
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
          
          <div className="flex items-center gap-2">
            <NotificationsDropdown userId={user.id} />
            
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

      {/* Main Container - Flex para sidebar y contenido */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fijo a la izquierda */}
        <aside className="hidden md:flex flex-col w-64 border-r bg-card/50">
          <Navigation userRole={profile?.role} />
        </aside>

        {/* Content Area - Scrollable */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 