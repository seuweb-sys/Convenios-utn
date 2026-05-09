import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Navigation } from "@/app/components/layout/navigation";
import { ProtectedHeader } from "@/app/components/layout/protected-header";
import { getNavMembershipFlags } from "@/app/lib/authz/membership-scope";

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

  const navMembershipFlags = await getNavMembershipFlags(supabase, user.id);

  return (
    <div className="flex h-screen flex-col">
      {/* Header - Fijo en la parte superior */}
      <ProtectedHeader user={user} profile={profile} />

      {/* Main Container - Flex para sidebar y contenido */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fijo a la izquierda */}
        <aside className="hidden md:flex flex-col w-64 border-r bg-card/50">
          <Navigation userRole={profile?.role} navMembershipFlags={navMembershipFlags} />
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
